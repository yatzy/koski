package fi.oph.koski.opiskeluoikeus

import java.time.LocalDate

import com.typesafe.config.Config
import fi.oph.koski.config.KoskiApplication
import fi.oph.koski.elasticsearch.ElasticSearchRunner
import fi.oph.koski.http.{Http, HttpStatus, KoskiErrorCategory}
import fi.oph.koski.json.{Json, Json4sHttp4s}
import fi.oph.koski.koskiuser.{AccessType, KoskiSession, RequiresAuthentication}
import fi.oph.koski.log.Logging
import fi.oph.koski.opiskeluoikeus.OpiskeluoikeusQueryFilter._
import fi.oph.koski.opiskeluoikeus.OpiskeluoikeusSortOrder.{Ascending, Descending}
import fi.oph.koski.schema._
import fi.oph.koski.servlet.{ApiServlet, InvalidRequestException, ObservableSupport}
import fi.oph.koski.util.{PaginatedResponse, Pagination, PaginationSettings, PortChecker}
import fi.oph.scalaschema.annotation.Description
import org.json4s.JValue

case class OpiskeluoikeudenPerustiedot(
  id: Option[Int], // TODO: remove optionality
  henkilö: NimitiedotJaOid,
  oppilaitos: Oppilaitos,
  @Description("Opiskelijan opiskeluoikeuden alkamisaika joko tutkintotavoitteisessa koulutuksessa tai tutkinnon osa tavoitteisessa koulutuksessa. Muoto YYYY-MM-DD")
  alkamispäivä: Option[LocalDate],
  tyyppi: Koodistokoodiviite,
  suoritukset: List[SuorituksenPerustiedot],
  @KoodistoUri("virtaopiskeluoikeudentila")
  @KoodistoUri("koskiopiskeluoikeudentila")
  tila: Koodistokoodiviite,
  @Description("Luokan tai ryhmän tunniste, esimerkiksi 9C")
  luokka: Option[String]
)

object OpiskeluoikeudenPerustiedot {
  def makePerustiedot(id: Int, henkilö: NimitiedotJaOid, oo: Opiskeluoikeus) = {
    val suoritukset: List[SuorituksenPerustiedot] = oo.suoritukset
      .filterNot(_.isInstanceOf[PerusopetuksenVuosiluokanSuoritus])
      .map { suoritus =>
        val (osaamisala, tutkintonimike) = suoritus match {
          case s: AmmatillisenTutkinnonSuoritus => (s.osaamisala, s.tutkintonimike)
          case s: NäyttötutkintoonValmistavanKoulutuksenSuoritus => (s.osaamisala, s.tutkintonimike)
          case _ => (None, None)
        }
        SuorituksenPerustiedot(suoritus.tyyppi, KoulutusmoduulinPerustiedot(suoritus.koulutusmoduuli.tunniste), osaamisala, tutkintonimike, suoritus.toimipiste)
      }
    OpiskeluoikeudenPerustiedot(Some(id), henkilö, oo.oppilaitos, oo.alkamispäivä, oo.tyyppi, suoritukset, oo.tila.opiskeluoikeusjaksot.last.tila, oo.luokka)
  }
}

case class SuorituksenPerustiedot(
  @Description("Suorituksen tyyppi, jolla erotellaan eri koulutusmuotoihin (perusopetus, lukio, ammatillinen...) ja eri tasoihin (tutkinto, tutkinnon osa, kurssi, oppiaine...) liittyvät suoritukset")
  @KoodistoUri("suorituksentyyppi")
  @Hidden
  tyyppi: Koodistokoodiviite,
  koulutusmoduuli: KoulutusmoduulinPerustiedot,
  @Description("Tieto siitä mihin osaamisalaan/osaamisaloihin oppijan tutkinto liittyy")
  @KoodistoUri("osaamisala")
  @OksaUri(tunnus = "tmpOKSAID299", käsite = "osaamisala")
  osaamisala: Option[List[Koodistokoodiviite]] = None,
  @Description("Tieto siitä mihin tutkintonimikkeeseen oppijan tutkinto liittyy")
  @KoodistoUri("tutkintonimikkeet")
  @OksaUri("tmpOKSAID588", "tutkintonimike")
  tutkintonimike: Option[List[Koodistokoodiviite]] = None,
  toimipiste: OrganisaatioWithOid
)

case class KoulutusmoduulinPerustiedot(
  tunniste: KoodiViite
)

object KoulutusmoduulinPerustiedot {

}

class OpiskeluoikeudenPerustiedotRepository(config: Config, opiskeluoikeusQueryService: OpiskeluoikeusQueryService) extends Logging {
  import Http._

  private val host = config.getString("elasticsearch.host")
  private val port = config.getInt("elasticsearch.port")
  private val url = s"http://$host:$port"
  private val elasticSearchHttp = Http(url)

  def find(filters: List[OpiskeluoikeusQueryFilter], sorting: OpiskeluoikeusSortOrder, pagination: PaginationSettings)(implicit session: KoskiSession): List[OpiskeluoikeudenPerustiedot] = {
    def nimi(order: String) = List(
      Map("henkilö.sukunimi.keyword" -> order),
      Map("henkilö.etunimet.keyword" -> order)
    )
    def luokka(order: String) = Map("luokka" -> order) :: nimi(order)
    def alkamispäivä(order: String) = Map("alkamispäivä" -> order):: nimi(order)

    val elasticSort = sorting match {
      case Ascending("nimi") => nimi("asc")
      case Ascending("luokka") => luokka("asc")
      case Ascending("alkamispäivä") => alkamispäivä("asc")
      case Descending("nimi") => nimi("desc")
      case Descending("luokka") => luokka("desc")
      case Descending("alkamispäivä") => alkamispäivä("desc")
      case _ => throw new InvalidRequestException(KoskiErrorCategory.badRequest.queryParam("Epäkelpo järjestyskriteeri: " + sorting.field))
    }

    val elasticFilters = filters.flatMap {
      case Nimihaku(hakusana) => hakusana.trim.split(" ").map { namePrefix =>
        Map("bool" -> Map("should" -> List(
          Map("prefix" -> Map("henkilö.sukunimi" -> namePrefix)),
          Map("prefix" -> Map("henkilö.etunimet" -> namePrefix))
        )))
      }
      case Luokkahaku(hakusana) => hakusana.trim.split(" ").map { prefix =>
        Map("prefix" -> Map("luokka" -> prefix))
      }
      case SuorituksenTyyppi(tyyppi) => List(Map("term" -> Map("suoritukset.tyyppi.koodiarvo" -> tyyppi.koodiarvo)))
      case OpiskeluoikeudenTyyppi(tyyppi) => List(Map("term" -> Map("tyyppi.koodiarvo" -> tyyppi.koodiarvo)))
      case OpiskeluoikeudenTila(tila) => List(Map("term" -> Map("tila.koodiarvo" -> tila.koodiarvo)))
      case Tutkintohaku(koulutukset, osaamisalat, nimikkeet) => List(Map("bool" -> Map("should" ->
        (koulutukset.map{ koulutus => Map("term" -> Map("suoritukset.koulutusmoduuli.tunniste.koodiarvo" -> koulutus.koodiarvo))} ++
          osaamisalat.map{ ala => Map("term" -> Map("suoritukset.koulutusmoduuli.osaamisala.koodiarvo" -> ala.koodiarvo))} ++
          nimikkeet.map{ nimike => Map("term" -> Map("suoritukset.koulutusmoduuli.tutkintonimike.koodiarvo" -> nimike.koodiarvo))}
        )
      )))
      case OpiskeluoikeusQueryFilter.Toimipiste(toimipisteet) => List(Map("bool" -> Map("should" ->
        toimipisteet.map{ toimipiste => Map("term" -> Map("suoritukset.toimipiste.oid" -> toimipiste.oid))}
      )))
      case SuorituksenTila(tila) => throw new InvalidRequestException(KoskiErrorCategory.badRequest.queryParam("suorituksenTila-parametriä ei tueta"))
      case SuoritusJsonHaku(json) => throw new InvalidRequestException(KoskiErrorCategory.badRequest.queryParam("suoritusJson-parametriä ei tueta"))
    } ++ (if (session.hasGlobalReadAccess) { Nil } else { List(Map("terms" -> Map("oppilaitos.oid" -> session.organisationOids(AccessType.read))))})

    val elasticQuery = elasticFilters match {
      case Nil => Map.empty
      case _ => Map(
        "bool" -> Map(
          "must" -> List(
            elasticFilters
          )
        )
      )
    }

    val doc = Json.toJValue(Map(
      "query" -> elasticQuery,
      "sort" -> elasticSort,
      "from" -> pagination.page * pagination.size,
      "size" -> pagination.size
    ))

    implicit val formats = Json.jsonFormats
    val response = Http.runTask(elasticSearchHttp.post(uri"/koski/_search", doc)(Json4sHttp4s.json4sEncoderOf[JValue])(Http.parseJson[JValue]))
    (response \ "hits" \ "hits").extract[List[JValue]].map(j => (j \ "_source").extract[OpiskeluoikeudenPerustiedot])
  }

  def update(perustiedot: OpiskeluoikeudenPerustiedot): Either[HttpStatus, Boolean] = {
    implicit val formats = Json.jsonFormats
    val doc = Json.toJValue(Map("doc_as_upsert" -> true, "doc" -> perustiedot))

    val response = Http.runTask(elasticSearchHttp
      .post(uri"/koski/perustiedot/${perustiedot.id.get}/_update", doc)(Json4sHttp4s.json4sEncoderOf[JValue])(Http.parseJson[JValue]))

    val failed: Int = (response \ "_shards" \ "failed").extract[Int]
    val result: String = (response \ "result").extract[String]

    if (failed > 0 ) {
      val msg = s"Elasticsearch indexing failed for id ${perustiedot.id.get} (fail count > 0)"
      logger.error(msg)
      Left(KoskiErrorCategory.internalError(msg))
    } else {
      Right(result != "noop")
    }
  }

  val init = {
    if (host == "localhost" && PortChecker.isFreeLocalPort(port)) {
      new ElasticSearchRunner("elastic-data", port, port + 100).start
    } else {
      logger.info(s"Using elasticsearch at $host:$port")
    }

    if (config.getBoolean("elasticsearch.reIndexAtStartup")) {
      logger.info("Starting elasticsearch re-indexing")
      val bufferSize = 10
      val observable = opiskeluoikeusQueryService.streamingQuery(Nil, None, None)(KoskiSession.systemUser).tumblingBuffer(bufferSize).zipWithIndex.map {
        case (rows, index) =>
          val updated = rows.par.map { case (opiskeluoikeusRow, henkilöRow) =>
            val oo = opiskeluoikeusRow.toOpiskeluoikeus
            val perustiedot = OpiskeluoikeudenPerustiedot.makePerustiedot(oo.id.get, henkilöRow.toNimitiedotJaOid, oo)
            update(perustiedot) match {
              case Right(true) => 1
              case Right(false) => 0
              case Left(error) => 0
            }
          }
          (rows.length, updated.sum)
      }.scan (0, 0) { case ((a1 : Int, b1 : Int), (a2 : Int, b2 : Int)) => (a1 + a2, b1 + b2) }


      observable.subscribe({case (countSoFar: Int, actuallyChanged: Int) => if (countSoFar % 100 == 0) logger.info(s"Updated elasticsearch index for ${countSoFar} rows, changed ${actuallyChanged}")},
                           {e: Throwable => logger.error(e)("Error updating Elasticsearch index")},
                           { () => logger.info("Finished updating Elasticsearch index")})
    }
  }

}

class OpiskeluoikeudenPerustiedotServlet(val application: KoskiApplication) extends ApiServlet with RequiresAuthentication with Pagination with ObservableSupport {
  get("/") {
    renderEither({
      val sort = params.get("sort").map {
        str => str.split(":") match {
          case Array(key: String, "asc") => Ascending(key)
          case Array(key: String, "desc") => Descending(key)
          case xs => throw new InvalidRequestException(KoskiErrorCategory.badRequest.queryParam("Invalid sort param. Expected key:asc or key: desc"))
        }
      }.getOrElse(Ascending("nimi"))

      OpiskeluoikeusQueryFilter.parse(params.toList)(application.koodistoViitePalvelu, application.organisaatioRepository, koskiSession) match {
        case Right(filters) =>
          val result: List[OpiskeluoikeudenPerustiedot] = application.perustiedotRepository.find(filters, sort, paginationSettings)(koskiSession)
          Right(PaginatedResponse(Some(paginationSettings), result, result.length))
        case Left(HttpStatus(404, _)) =>
          Right(PaginatedResponse(None, List[OpiskeluoikeudenPerustiedot](), 0))
        case e @ Left(_) => e
      }
    })
  }
}