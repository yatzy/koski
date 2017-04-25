import React from 'react'
import { locationP } from './location.js'
import { oppijaContentP } from './Oppija.jsx'
import { CreateOppija } from './CreateOppija.jsx'
import { tiedonsiirtolokiContentP } from './Tiedonsiirtoloki.jsx'
import { tiedonsiirtovirheetContentP } from './Tiedonsiirtovirheet.jsx'
import { tiedonsiirtojenYhteenvetoContentP } from './TiedonsiirtojenYhteenveto.jsx'
import { omatTiedotContentP } from './OmatTiedot.jsx'
import { oppijataulukkoContentP } from './Oppijataulukko.jsx'
import { validointiContentP } from './Validointi.jsx'

export const routeP = locationP.flatMapLatest(({path, queryString, params, hash}) => {
  let oppijaId = (path.match(new RegExp('/koski/oppija/(.*)')) || [])[1]
  let uusiOppijaHetu = (hash.match(new RegExp('#(.*)')) || [])[1]
  if (oppijaId) {
    return oppijaContentP(oppijaId)
  } else if (path === '/koski/uusioppija' && uusiOppijaHetu) {
    return { content: (<CreateOppija hetu={uusiOppijaHetu}/>), title: 'Uuden opiskelijan lisäys' }
  } else if (path === '/koski/') {
    return oppijataulukkoContentP(queryString, params)
  } else if (path === '/koski/tiedonsiirrot') {
    return tiedonsiirtolokiContentP(queryString)
  } else if (path === '/koski/tiedonsiirrot/virheet') {
    return tiedonsiirtovirheetContentP(queryString)
  } else if (path === '/koski/tiedonsiirrot/yhteenveto') {
    return tiedonsiirtojenYhteenvetoContentP(queryString)
  } else if (path === '/koski/validointi') {
    return validointiContentP(queryString, params)
  } else if (path === '/koski/omattiedot') {
    return omatTiedotContentP()
  }
}).toProperty()

export const contentP = routeP.map('.content')

export const titleP = routeP.map('.title').map(title => title || '') // TODO localization

export const routeErrorP = contentP.map(content => content ? {} : { httpStatus: 404, comment: 'route not found' })