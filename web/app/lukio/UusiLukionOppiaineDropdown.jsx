import React from 'baret'
import {t} from '../i18n/i18n'
import DropDown from '../components/Dropdown'
import {
  contextualizeSubModel, ensureArrayKey, modelData, modelItems, modelLookup, modelSet, modelSetTitle, oneOfPrototypes,
  pushModel,
  wrapOptional
} from '../editor/EditorModel'
import {koulutusModuuliprototypes} from '../suoritus/Koulutusmoduuli'
import {fetchAlternativesBasedOnPrototypes} from '../editor/EnumEditor'

const createOppiaineenSuoritus = (model, suoritusClass) => {
  const oppiaineet = wrapOptional(modelLookup(model, 'osasuoritukset'))
  const newItemIndex = modelItems(oppiaineet).length
  const oppiaineenSuoritusProto = contextualizeSubModel(oppiaineet.arrayPrototype, oppiaineet, newItemIndex)
  const options = oneOfPrototypes(oppiaineenSuoritusProto)
  const proto = suoritusClass && options.find(p => p.value.classes.includes(suoritusClass)) || options[0]
  return contextualizeSubModel(proto, oppiaineet, newItemIndex)
}

const fetchOppiaineOptions = uusiOppiaineenSuoritus => {
  const koulutusmoduuliModels = koulutusModuuliprototypes(uusiOppiaineenSuoritus)
  return fetchAlternativesBasedOnPrototypes(koulutusmoduuliModels, 'tunniste')
}

const oppiaineToKoodiarvo = oppiaine => modelData(oppiaine, 'koulutusmoduuli.tunniste').koodiarvo
const koulutusmoduuliToKoodiarvo = koulutusmoduuli => modelData(koulutusmoduuli, 'tunniste').koodiarvo

export const UusiLukionOppiaineDropdown = ({model, oppiaineenSuoritusClass}) => {
  if (!model || !model.context.edit) return null

  const uusiOppiaineenSuoritus = createOppiaineenSuoritus(model, oppiaineenSuoritusClass)
  const käytössäOlevatKoodiarvot = modelItems(model, 'osasuoritukset').map(oppiaineToKoodiarvo)
  const options = fetchOppiaineOptions(uusiOppiaineenSuoritus).map(oppiaineOptions =>
    oppiaineOptions
      .filter(option => !käytössäOlevatKoodiarvot.includes(koulutusmoduuliToKoodiarvo(option)))
  )
  const placeholderText = t('Lisää oppiaine')

  const addOppiaine = oppiaine => {
    const nimi = t(modelData(oppiaine, 'tunniste.nimi'))
    const oppiaineWithTitle = modelSetTitle(oppiaine, nimi)
    const suoritusUudellaOppiaineella = modelSet(uusiOppiaineenSuoritus, oppiaineWithTitle, 'koulutusmoduuli')
    pushModel(suoritusUudellaOppiaineella, model.context.changeBus)
    ensureArrayKey(suoritusUudellaOppiaineella)
  }

  return (
    <div className='uusi-oppiaine'>
      <DropDown
        options={options}
        keyValue={oppiaine => modelData(oppiaine, 'tunniste').koodiarvo}
        displayValue={oppiaine => modelLookup(oppiaine, 'tunniste').value.title}
        onSelectionChanged={addOppiaine}
        selectionText={placeholderText}
        isRemovable={() => false}
      />
    </div>
  )
}
