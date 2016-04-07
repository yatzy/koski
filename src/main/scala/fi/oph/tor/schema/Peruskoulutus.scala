package fi.oph.tor.schema

import java.time.LocalDate

import fi.oph.tor.schema.generic.annotation.{MaxItems, MinItems, Description}

@Description("Perusopetuksen opiskeluoikeus")
case class PerusopetuksenOpiskeluoikeus(
  id: Option[Int],
  versionumero: Option[Int],
  lähdejärjestelmänId: Option[LähdejärjestelmäId],
  alkamispäivä: Option[LocalDate],
  arvioituPäättymispäivä: Option[LocalDate],
  päättymispäivä: Option[LocalDate],
  oppilaitos: Oppilaitos,
  suoritukset: List[PeruskoulunPäättötodistus],
  opiskeluoikeudenTila: Option[OpiskeluoikeudenTila],
  läsnäolotiedot: Option[Läsnäolotiedot],
  @KoodistoKoodiarvo("peruskoulutus")
  tyyppi: Koodistokoodiviite = Koodistokoodiviite("peruskoulutus", Some("Peruskoulutus"), "opiskeluoikeudentyyppi", None)
) extends Opiskeluoikeus {
  override def withIdAndVersion(id: Option[Int], versionumero: Option[Int]) = this.copy(id = id, versionumero = versionumero)
}

case class PeruskoulunPäättötodistus(
  @KoodistoKoodiarvo("peruskoulunpaattotodistus")
  tyyppi: Koodistokoodiviite = Koodistokoodiviite("peruskoulunpaattotodistus", koodistoUri = "suorituksentyyppi"),
  koulutusmoduuli: Peruskoulutus,
  paikallinenId: Option[String],
  suorituskieli: Option[Koodistokoodiviite],
  tila: Koodistokoodiviite,
  @Description("Oppilaitoksen toimipiste, jossa opinnot on suoritettu")
  @OksaUri("tmpOKSAID148", "koulutusorganisaation toimipiste")
  toimipiste: OrganisaatioWithOid,
  vahvistus: Option[Vahvistus] = None,
  @Description("Päättötodistukseen liittyvät oppiaineen suoritukset")
  override val osasuoritukset: Option[List[PeruskoulunOppiainesuoritus]]
) extends Suoritus {
  def arviointi: Option[List[Arviointi]] = None
}

case class PeruskoulunOppiainesuoritus(
  @KoodistoKoodiarvo("peruskoulunoppiainesuoritus")
  tyyppi: Koodistokoodiviite = Koodistokoodiviite(koodiarvo = "peruskoulunoppiainesuoritus", koodistoUri = "suorituksentyyppi"),
  koulutusmoduuli: PeruskoulunOppiaine,
  paikallinenId: Option[String],
  suorituskieli: Option[Koodistokoodiviite],
  tila: Koodistokoodiviite,
  arviointi: Option[List[PeruskoulunArviointi]] = None,
  vahvistus: Option[Vahvistus] = None
) extends Suoritus

@Description("Peruskoulutus")
case class Peruskoulutus(
 @Description("Tutkinnon 6-numeroinen tutkintokoodi")
 @KoodistoUri("koulutus")
 @KoodistoKoodiarvo("201100")
 @OksaUri("tmpOKSAID560", "tutkinto")
 tunniste: Koodistokoodiviite = Koodistokoodiviite("201100", koodistoUri = "koulutus")
) extends Koulutusmoduuli

case class PeruskoulunArviointi(
  @KoodistoUri("arvosanat")
  arvosana: Koodistokoodiviite,
  päivä: Option[LocalDate],
  arvioitsijat: Option[List[Arvioitsija]] = None
) extends Arviointi

trait PeruskoulunOppiaine extends Koulutusmoduuli {
  @Description("Peruskoulutuksen oppiaine")
  @KoodistoUri("koskioppiaineetyleissivistava")
  @OksaUri("tmpOKSAID256", "oppiaine")
  def tunniste: Koodistokoodiviite
}

  case class Oppiaine(
    tunniste: Koodistokoodiviite
  ) extends PeruskoulunOppiaine

  case class Uskonto(
    @KoodistoKoodiarvo("KT")
    tunniste: Koodistokoodiviite = Koodistokoodiviite(koodiarvo = "KT", koodistoUri = "koskioppiaineetyleissivistava"),
    @Description("Mikä uskonto on kyseessä")
    @KoodistoUri("oppiaineuskonto")
    uskonto: Koodistokoodiviite
  ) extends PeruskoulunOppiaine

  case class AidinkieliJaKirjallisuus(
    @KoodistoKoodiarvo("AI")
    tunniste: Koodistokoodiviite = Koodistokoodiviite(koodiarvo = "AI", koodistoUri = "koskioppiaineetyleissivistava"),
    @Description("Mikä kieli on kyseessä")
    @KoodistoUri("oppiaineaidinkielijakirjallisuus")
    kieli: Koodistokoodiviite
  ) extends PeruskoulunOppiaine

  case class VierasTaiToinenKotimainenKieli(
    @KoodistoKoodiarvo("A1")
    @KoodistoKoodiarvo("A2")
    @KoodistoKoodiarvo("B1")
    @KoodistoKoodiarvo("B2")
    @KoodistoKoodiarvo("B3")
    tunniste: Koodistokoodiviite,
    @Description("Mikä kieli on kyseessä")
    @KoodistoUri("kielivalikoima")
    kieli: Koodistokoodiviite
  ) extends PeruskoulunOppiaine