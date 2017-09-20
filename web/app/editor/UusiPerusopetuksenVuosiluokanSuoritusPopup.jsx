import React from 'baret'
import Bacon from 'baconjs'
import R from 'ramda'
import * as L from 'partial.lenses'
import {PropertiesEditor} from './PropertiesEditor.jsx'
import {
  accumulateModelStateAndValidity,
  addContext,
  contextualizeSubModel,
  modelData,
  modelItems,
  modelLens,
  modelLookup,
  modelProperties,
  modelSet,
  modelSetValue
} from './EditorModel'
import {EnumEditor} from './EnumEditor.jsx'
import ModalDialog from './ModalDialog.jsx'
import {doActionWhileMounted} from '../util'
import Text from '../Text.jsx'
import {isToimintaAlueittain, luokkaAste, luokkaAsteenOsasuoritukset} from './Perusopetus'

const UusiPerusopetuksenVuosiluokanSuoritusPopup = ({opiskeluoikeus, resultCallback}) => {
  let submitBus = Bacon.Bus()
  let initialSuoritusModel = newSuoritusProto(opiskeluoikeus, 'perusopetuksenvuosiluokansuoritus')

  initialSuoritusModel = L.modify(L.compose(modelLens('koulutusmoduuli.tunniste'), 'alternativesPath'), (url => url + '/' + puuttuvatLuokkaAsteet(opiskeluoikeus).join(',')) , initialSuoritusModel)
  let viimeisin = viimeisinLuokkaAste(opiskeluoikeus)
  if (viimeisin) {
    initialSuoritusModel = modelSet(initialSuoritusModel, modelLookup(viimeisin, 'toimipiste'), 'toimipiste')
  }

  initialSuoritusModel = addContext(initialSuoritusModel, { editAll: true })

  let defaultLuokkaAsteP = valittuLuokkaAsteP(initialSuoritusModel)

  return (<div>
    {
      defaultLuokkaAsteP.last().map(valittuLuokkaAste => {
        initialSuoritusModel = modelSetValue(initialSuoritusModel, valittuLuokkaAste, 'koulutusmoduuli.tunniste')
        initialSuoritusModel = addContext(initialSuoritusModel, { suoritus: initialSuoritusModel })

        let { modelP, errorP } = accumulateModelStateAndValidity(initialSuoritusModel)

        let hasToimipisteP = modelP.map(m => !!modelData(m, 'toimipiste.oid'))
        let validP = errorP.not().and(hasToimipisteP)

        let finalSuoritus = submitBus.filter(validP).map(modelP).flatMapFirst((suoritus) => {
          let oppiaineidenSuoritukset = (luokkaAste(suoritus) == '9') ? Bacon.constant([]) : luokkaAsteenOsasuoritukset(luokkaAste(suoritus), isToimintaAlueittain(opiskeluoikeus))
          return oppiaineidenSuoritukset.map(oppiaineet => modelSetValue(suoritus, oppiaineet.value, 'osasuoritukset'))
        })

        return (<div>
          <ModalDialog className="lisaa-suoritus-modal" onDismiss={resultCallback} onSubmit={() => submitBus.push()} okTextKey="Lisää" validP={validP}>
            <h2><Text name="Suorituksen lisäys"/></h2>
            <PropertiesEditor baret-lift context={initialSuoritusModel.context} properties={modelP.map(model => modelProperties(model, ['koulutusmoduuli.perusteenDiaarinumero', 'koulutusmoduuli.tunniste', 'luokka', 'toimipiste']))} />
          </ModalDialog>
          { doActionWhileMounted(finalSuoritus, resultCallback) }
        </div>)
      })
    }
  </div>)
}

UusiPerusopetuksenVuosiluokanSuoritusPopup.canAddSuoritus = (opiskeluoikeus) => modelData(opiskeluoikeus, 'tyyppi.koodiarvo') == 'perusopetus' && puuttuvatLuokkaAsteet(opiskeluoikeus).length > 0

UusiPerusopetuksenVuosiluokanSuoritusPopup.addSuoritusTitle = () => <Text name="lisää vuosiluokan suoritus"/>

export default UusiPerusopetuksenVuosiluokanSuoritusPopup

let newSuoritusProto = (opiskeluoikeus, prototypeKey) => {
  let suoritukset = modelLookup(opiskeluoikeus, 'suoritukset')
  let indexForNewItem = modelItems(suoritukset).length
  let selectedProto = contextualizeSubModel(suoritukset.arrayPrototype, suoritukset, indexForNewItem).oneOfPrototypes.find(p => p.key === prototypeKey)
  return contextualizeSubModel(selectedProto, suoritukset, indexForNewItem)
}

let valittuLuokkaAsteP = (model) => {
  let luokkaAsteLens = modelLens('koulutusmoduuli.tunniste')
  let luokkaAsteModel = L.get(luokkaAsteLens, model)
  return EnumEditor.fetchAlternatives(luokkaAsteModel).map('.0')
}

let puuttuvatLuokkaAsteet = (opiskeluoikeus) => {
  var olemassaOlevatLuokkaAsteet = olemassaolevatLuokkaAsteenSuoritukset(opiskeluoikeus).filter(siirretäänSeuraavalleLuokalle).map(suorituksenLuokkaAste)
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => !olemassaOlevatLuokkaAsteet.includes(x))
}

let siirretäänSeuraavalleLuokalle = (suoritus) => !modelData(suoritus, 'jääLuokalle')

let olemassaolevatLuokkaAsteenSuoritukset = (opiskeluoikeus) => modelItems(opiskeluoikeus, 'suoritukset')
  .filter(suoritus => modelData(suoritus, 'tyyppi.koodiarvo') == 'perusopetuksenvuosiluokka')

let suorituksenLuokkaAste = (suoritus) => parseInt(modelData(suoritus, 'koulutusmoduuli.tunniste.koodiarvo'))

let viimeisinLuokkaAste = (opiskeluoikeus) => {
  let suoritukset = olemassaolevatLuokkaAsteenSuoritukset(opiskeluoikeus)
  if (suoritukset.length) {
    return suoritukset.reduce(R.maxBy(suorituksenLuokkaAste))
  }
}