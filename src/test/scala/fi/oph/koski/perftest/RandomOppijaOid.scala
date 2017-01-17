package fi.oph.koski.perftest

import fi.oph.koski.integrationtest.KoskidevHttpSpecification
import fi.oph.koski.json.Json
import fi.oph.koski.log.Logging
import org.scalatest.Matchers

import scala.util.Random

object RandomOppijaOid extends KoskidevHttpSpecification with Matchers with Logging {
  val url: String = s"api/oppija/oids?pageNumber=0&pageSize=500000"
  lazy val oids = get(url, headers = (authHeaders() ++ jsonContent)) {
    response.status should equal(200)
    Json.read[List[String]](body)
  }

  lazy val oidIterator = {
    logger.info("Looping through " + oids.length + " oids")
    Iterator.continually(Random.shuffle(oids).iterator).flatten
  }

  def nextOid = oidIterator.next
}
