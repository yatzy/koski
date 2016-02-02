package fi.oph.tor.http

case class HttpStatus(statusCode: Int, errors: List[ErrorDetail]) {
  def isOk = statusCode < 300
  def isError = !isOk

  /** Pick given status if this one is ok. Otherwise stick with this one */
  def then(status: => HttpStatus) = if (isOk) { status } else { this }
}

case class ErrorDetail(category: ErrorCategory, message: AnyRef) {
  override def toString = category.key + " (" + message + ")"
}

object HttpStatus {
  val ok = HttpStatus(200, Nil)

  // Combinators

  /** If predicate is true, yield 200/ok, else run given block */
  def validate(predicate: => Boolean)(status: => HttpStatus) = if (predicate) { ok } else { status }
  /** Combine two statii: concatenate errors list, pick highest status code */
  def append(a: HttpStatus, b: HttpStatus) = {
    HttpStatus(Math.max(a.statusCode, b.statusCode), a.errors ++ b.errors)
  }
  /** Append all given statii into one, concatenating error list, picking highest status code */
  def fold(statii: Iterable[HttpStatus]): HttpStatus = statii.fold(ok)(append)

  /** Append all given statii into one, concatenating error list, picking highest status code */
  def fold(statii: HttpStatus*): HttpStatus = fold(statii.toList)
}