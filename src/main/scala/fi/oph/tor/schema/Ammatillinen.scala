package fi.oph.tor.schema

import java.time.LocalDate

import fi.oph.tor.schema.generic.annotation.Description

case class AmmatillinenTutkintoSuoritus(
  koulutusmoduuli: TutkintoKoulutus,
  @Description("Tieto siitä mihin tutkintonimikkeeseen oppijan tutkinto liittyy")
  @KoodistoUri("tutkintonimikkeet")
  @OksaUri("tmpOKSAID588", "tutkintonimike")
  tutkintonimike: Option[List[KoodistoKoodiViite]] = None,
  @Description("Osaamisala")
  @KoodistoUri("osaamisala")
  @OksaUri(tunnus = "tmpOKSAID299", käsite = "osaamisala")
  osaamisala: Option[List[KoodistoKoodiViite]] = None,
  @Description("Tutkinnon tai tutkinnon osan suoritustapa")
  @OksaUri("tmpOKSAID141", "ammatillisen koulutuksen järjestämistapa")
  suoritustapa: Option[Suoritustapa] = None,
  @Description("Koulutuksen järjestämismuoto")
  @OksaUri("tmpOKSAID140", "koulutuksen järjestämismuoto")
  järjestämismuoto: Option[Järjestämismuoto] = None,

  paikallinenId: Option[String],
  suorituskieli: Option[KoodistoKoodiViite],
  tila: KoodistoKoodiViite,
  alkamispäivä: Option[LocalDate],
  toimipiste: OrganisaatioWithOid,
  arviointi: Option[List[Arviointi]] = None,
  vahvistus: Option[Vahvistus] = None,
  override val osasuoritukset: Option[List[AmmatillinenTutkinnonosaSuoritus]] = None
) extends Suoritus

trait AmmatillinenTutkinnonosaSuoritus extends Suoritus
  case class AmmatillinenOpsTutkinnonosaSuoritus(
    koulutusmoduuli: OpsTutkinnonosa,
    hyväksiluku: Option[Hyväksiluku] = None,
    @Description("Suoritukseen liittyvän näytön tiedot")
    näyttö: Option[Näyttö] = None,
    lisätiedot: Option[List[AmmatillisenTutkinnonOsanLisätieto]] = None,
    @Description("Tutkinto, jonka rakenteeseen tutkinnon osa liittyy. Käytetään vain tapauksissa, joissa tutkinnon osa on poimittu toisesta tutkinnosta.")
    tutkinto: Option[TutkintoKoulutus] = None,

    paikallinenId: Option[String],
    suorituskieli: Option[KoodistoKoodiViite],
    tila: KoodistoKoodiViite,
    alkamispäivä: Option[LocalDate],
    toimipiste: OrganisaatioWithOid,
    arviointi: Option[List[Arviointi]] = None,
    vahvistus: Option[Vahvistus] = None
  ) extends AmmatillinenTutkinnonosaSuoritus

  case class AmmatillinenPaikallinenTutkinnonosaSuoritus(
    koulutusmoduuli: PaikallinenTutkinnonosa,
    hyväksiluku: Option[Hyväksiluku] = None,
    @Description("Suoritukseen liittyvän näytön tiedot")
    näyttö: Option[Näyttö] = None,
    lisätiedot: Option[List[AmmatillisenTutkinnonOsanLisätieto]] = None,

    paikallinenId: Option[String],
    suorituskieli: Option[KoodistoKoodiViite],
    tila: KoodistoKoodiViite,
    alkamispäivä: Option[LocalDate],
    toimipiste: OrganisaatioWithOid,
    arviointi: Option[List[Arviointi]] = None,
    vahvistus: Option[Vahvistus] = None,
    override val osasuoritukset: Option[List[AmmatillinenPaikallinenTutkinnonosaSuoritus]] = None
  ) extends AmmatillinenTutkinnonosaSuoritus

@Description("Tutkintoon johtava koulutus")
case class TutkintoKoulutus(
 @Description("Tutkinnon 6-numeroinen tutkintokoodi")
 @KoodistoUri("koulutus")
 @OksaUri("tmpOKSAID560", "tutkinto")
 tunniste: KoodistoKoodiViite,
 @Description("Tutkinnon perusteen diaarinumero (pakollinen). Ks. ePerusteet-palvelu")
 perusteenDiaarinumero: Option[String]
) extends Koulutusmoduuli

@Description("Opetussuunnitelmaan kuuluva tutkinnon osa")
case class OpsTutkinnonosa(
  @Description("Tutkinnon osan kansallinen koodi")
  @KoodistoUri("tutkinnonosat")
  tunniste: KoodistoKoodiViite,
  @Description("Onko pakollinen osa tutkinnossa")
  pakollinen: Boolean,
  laajuus: Option[Laajuus],
  paikallinenKoodi: Option[Paikallinenkoodi] = None,
  kuvaus: Option[String] = None
) extends Koulutusmoduuli

@Description("Paikallinen tutkinnon osa")
case class PaikallinenTutkinnonosa(
  tunniste: Paikallinenkoodi,
  kuvaus: String,
  @Description("Onko pakollinen osa tutkinnossa")
  pakollinen: Boolean,
  laajuus: Option[Laajuus]
) extends Koulutusmoduuli

case class AmmatillisenTutkinnonOsanLisätieto(
  @Description("Lisätiedon tyyppi kooditettuna")
  @KoodistoUri("ammatillisentutkinnonosanlisatieto")
  tunniste: KoodistoKoodiViite,
  @Description("Lisätiedon kuvaus siinä muodossa, kuin se näytetään todistuksella")
  kuvaus: String
)

case class OppisopimuksellinenJärjestämismuoto(
  @KoodistoUri("jarjestamismuoto")
  @KoodistoKoodiarvo("20")
  tunniste: KoodistoKoodiViite,
  oppisopimus: Oppisopimus
) extends Järjestämismuoto

@Description("Näytön kuvaus")
case class Näyttö(
  @Description("Vapaamuotoinen kuvaus suoritetusta näytöstä")
  kuvaus: String,
  suorituspaikka: NäytönSuorituspaikka,
  arviointi: Option[NäytönArviointi]
)

@Description("Ammatillisen näytön suorituspaikka")
case class NäytönSuorituspaikka(
  @Description("Suorituspaikan tyyppi 1-numeroisella koodilla")
  @KoodistoUri("ammatillisennaytonsuorituspaikka")
  tunniste: KoodistoKoodiViite,
  @Description("Vapaamuotoinen suorituspaikan kuvaus")
  kuvaus: String
)

case class NäytönArviointi (
  @Description("Näytön eri arviointikohteiden (Työprosessin hallinta jne) arvosanat.")
  arviointiKohteet: List[NäytönArviointikohde],
  @KoodistoUri("ammatillisennaytonarvioinnistapaattaneet")
  @Description("Arvioinnista päättäneet tahot, ilmaistuna 1-numeroisella koodilla")
  arvioinnistaPäättäneet: KoodistoKoodiViite,
  @KoodistoUri("ammatillisennaytonarviointikeskusteluunosallistuneet")
  @Description("Arviointikeskusteluun osallistuneet tahot, ilmaistuna 1-numeroisella koodilla")
  arviointikeskusteluunOsallistuneet: KoodistoKoodiViite
)

case class NäytönArviointikohde(
  @Description("Arviointikohteen tunniste")
  @KoodistoUri("ammatillisennaytonarviointikohde")
  tunniste: KoodistoKoodiViite,
  @Description("Arvosana. Kullekin arviointiasteikolle löytyy oma koodistonsa")
  @KoodistoUri("arviointiasteikkoammatillinenhyvaksyttyhylatty")
  @KoodistoUri("arviointiasteikkoammatillinent1k3")
  arvosana: KoodistoKoodiViite
)

@Description("Oppisopimuksen tiedot")
case class Oppisopimus(
  työnantaja: Yritys
)