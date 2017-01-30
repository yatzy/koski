import React from 'react'
import R from 'ramda'
import { modelData, modelLookup, modelTitle, modelItems } from './EditorModel.js'
import * as GenericEditor from './GenericEditor.jsx'
import Versiohistoria from './Versiohistoria.jsx'
import Link from './Link.jsx'
import { currentLocation } from './location.js'
import { yearFromDateString } from './date'

const OppijaEditor = React.createClass({
  render() {
    let {model, context} = this.props
    let oppijaOid = modelData(model, 'henkilö.oid')
    let oppijaContext = R.merge(context, { oppijaOid: oppijaOid })

    let selectedTyyppi = currentLocation().params.opiskeluoikeudenTyyppi

    var opiskeluoikeusTyypit = modelLookup(model, 'opiskeluoikeudet').value

    let selectedIndex = selectedTyyppi
      ? opiskeluoikeusTyypit.findIndex((opiskeluoikeudenTyyppi) => selectedTyyppi == modelData(opiskeluoikeudenTyyppi, 'tyyppi.koodiarvo'))
      : 0


    return (
      <div>
        <ul className="opiskeluoikeustyypit">
          {
            opiskeluoikeusTyypit.map((opiskeluoikeudenTyyppi, tyyppiIndex) => {
              let selected = tyyppiIndex == selectedIndex
              let koodiarvo = modelData(opiskeluoikeudenTyyppi, 'tyyppi.koodiarvo')
              let className = selected ? koodiarvo + ' selected' : koodiarvo
              let content = (<div>
                <div className="opiskeluoikeustyyppi">{ modelTitle(opiskeluoikeudenTyyppi, 'tyyppi') }</div>
                <ul className="oppilaitokset">
                  {
                    modelLookup(opiskeluoikeudenTyyppi, 'opiskeluoikeudet').value.map((oppilaitoksenOpiskeluoikeudet, oppilaitosIndex) =>
                      <li key={oppilaitosIndex}>
                        <span className="oppilaitos">{modelTitle(oppilaitoksenOpiskeluoikeudet, 'oppilaitos')}</span>
                        <ul className="opiskeluoikeudet">
                          {
                            modelLookup(oppilaitoksenOpiskeluoikeudet, 'opiskeluoikeudet').value.map((opiskeluoikeus, opiskeluoikeusIndex) =>
                              modelLookup(opiskeluoikeus, 'suoritukset').value.filter(s => s.value.data.tyyppi.koodiarvo != 'perusopetuksenvuosiluokka').map((suoritus, suoritusIndex) =>
                                <li className="opiskeluoikeus" key={opiskeluoikeusIndex + '-' + suoritusIndex}>
                                  <span className="koulutus inline-text">{ modelTitle(suoritus, 'tyyppi') }</span>
                                  { modelData(opiskeluoikeus, 'alkamispäivä')
                                    ? <span className="inline-text">
                                        <span className="alku pvm">{yearFromDateString(modelTitle(opiskeluoikeus, 'alkamispäivä'))}</span>-
                                        <span className="loppu pvm">{yearFromDateString(modelTitle(opiskeluoikeus, 'päättymispäivä'))},</span>
                                      </span>
                                    : null
                                  }
                                  <span className="tila">{ modelTitle(opiskeluoikeus, 'tila.opiskeluoikeusjaksot.-1.tila') }</span>
                                </li>
                              )
                            )
                          }
                        </ul>
                      </li>
                    )
                  }
                </ul>
              </div>)
              return (
                <li className={className} key={tyyppiIndex}>
                  { selected ? content : <Link href={'?opiskeluoikeudenTyyppi=' + koodiarvo}>{content}</Link> }
                </li>)
            })}
        </ul>
        <ul className="opiskeluoikeuksientiedot">
          {
            modelLookup(model, 'opiskeluoikeudet.' + selectedIndex + '.opiskeluoikeudet').value.flatMap((oppilaitoksenOpiskeluoikeudet, oppilaitosIndex) => {
              return modelLookup(oppilaitoksenOpiskeluoikeudet, 'opiskeluoikeudet').value.map((opiskeluoikeus, opiskeluoikeusIndex) =>
                <li key={ oppilaitosIndex + '-' + opiskeluoikeusIndex }>
                  <OpiskeluoikeusEditor
                    model={ opiskeluoikeus }
                    context={GenericEditor.childContext(this, oppijaContext, 'opiskeluoikeudet', selectedIndex, 'opiskeluoikeudet', oppilaitosIndex, 'opiskeluoikeudet', opiskeluoikeusIndex)}
                  />
                </li>
              )
            })
          }
        </ul>
      </div>)
  }
})

const OpiskeluoikeusEditor = React.createClass({
  render() {
    let {model, context} = this.props
    let id = modelData(model, 'id')
    let opiskeluoikeusContext = R.merge(context, {editable: model.editable, opiskeluoikeusId: id})
    let suoritusQueryParam = context.path + '.suoritus'
    let suoritusIndex = currentLocation().params[suoritusQueryParam] || 0
    let suoritukset = modelItems(model, 'suoritukset')
    return (<div className="opiskeluoikeus">
      <h3>
        <span className="oppilaitos inline-text">{modelTitle(model, 'oppilaitos')},</span>
        <span className="koulutus inline-text">{modelTitle(model, 'suoritukset.0.koulutusmoduuli')}</span>
         { modelData(model, 'alkamispäivä')
            ? <span className="inline-text">(
                  <span className="alku pvm">{modelTitle(model, 'alkamispäivä')}</span>-
                  <span className="loppu pvm">{modelTitle(model, 'päättymispäivä')},</span>
              </span>
            : null
          }
        <span className="tila">{modelTitle(model, 'tila.opiskeluoikeusjaksot.-1.tila').toLowerCase()})</span>
        <Versiohistoria opiskeluOikeusId={id} oppijaOid={context.oppijaOid}/>
      </h3>
      <GenericEditor.PropertiesEditor properties={ model.value.properties.filter(property => property.key != 'suoritukset') } context={opiskeluoikeusContext}/>
      {
        suoritukset.length >= 2 && (
          <ul className="suoritus-tabs">
            {
              suoritukset.map((suoritusModel, i) => {
                let selected = i == suoritusIndex
                let title = modelTitle(suoritusModel, 'koulutusmoduuli')
                return (<li className={selected ? 'selected': null} key={i}>
                    { selected ? title : <Link href={currentLocation().addQueryParams({[suoritusQueryParam]: i}).toString()}> {title} </Link>}
                </li>)
              })
            }
          </ul>
        )
      }
      {
        suoritukset.map((suoritusModel, i) =>
          i == suoritusIndex ? <PäätasonSuoritusEditor model={suoritusModel} context={GenericEditor.childContext(this, opiskeluoikeusContext, 'suoritukset', i)} key={i}/> : null
        )
      }
      <OpiskeluoikeudenOpintosuoritusoteLink opiskeluoikeus={model} context={context}/>
    </div>)
  }
})

const PäätasonSuoritusEditor = React.createClass({
  render() {
    let {model, context} = this.props
    let title = modelTitle(model, 'koulutusmoduuli')
    let className = 'suoritus ' + model.value.class
    return (<div className={className}>
      <TodistusLink suoritus={model} context={context}/>
      <GenericEditor.PropertiesEditor properties={model.value.properties} context={R.merge(context, {editable: model.editable})}/>
    </div>)
  }
})

const TodistusLink = React.createClass({
  render() {
    let {suoritus, context: { oppijaOid }} = this.props
    let suoritustyyppi = modelData(suoritus, 'tyyppi').koodiarvo
    let koulutusmoduuliKoodistoUri = modelData(suoritus, 'koulutusmoduuli').tunniste.koodistoUri
    let koulutusmoduuliKoodiarvo = modelData(suoritus, 'koulutusmoduuli').tunniste.koodiarvo
    let suoritusTila = modelData(suoritus, 'tila').koodiarvo
    let href = '/koski/todistus/' + oppijaOid + '?suoritustyyppi=' + suoritustyyppi + '&koulutusmoduuli=' + koulutusmoduuliKoodistoUri + '/' + koulutusmoduuliKoodiarvo
    return suoritusTila == 'VALMIS' && suoritustyyppi != 'korkeakoulututkinto' && suoritustyyppi != 'preiboppimaara' && suoritustyyppi != 'esiopetuksensuoritus'
      ? <a className="todistus" href={href}>näytä todistus</a>
      : null
  }
})

const OpiskeluoikeudenOpintosuoritusoteLink = React.createClass({
  render() {
    let {opiskeluoikeus, context: { oppijaOid }} = this.props
    var opiskeluoikeusTyyppi = modelData(opiskeluoikeus, 'tyyppi').koodiarvo
    if (opiskeluoikeusTyyppi == 'lukiokoulutus' || opiskeluoikeusTyyppi == 'ibtutkinto') { // lukio/ib näytetään opiskeluoikeuskohtainen suoritusote
      let href = '/koski/opintosuoritusote/' + oppijaOid + '?opiskeluoikeus=' + modelData(opiskeluoikeus, 'id')
      return <a className="opintosuoritusote" href={href}>näytä opintosuoritusote</a>
    } else if (opiskeluoikeusTyyppi == 'korkeakoulutus') { // korkeakoulutukselle näytetään oppilaitoskohtainen suoritusote
      let href = '/koski/opintosuoritusote/' + oppijaOid + '?oppilaitos=' + modelData(opiskeluoikeus, 'oppilaitos').oid
      return <a className="opintosuoritusote" href={href}>näytä opintosuoritusote</a>
    } else {
      return null
    }
  }
})

const OppiaineEditor = React.createClass({
  render() {
    let {model} = this.props
    var oppiaine = modelTitle(model, 'koulutusmoduuli')
    let arvosana = modelTitle(model, 'arviointi.-1.arvosana')
    let pakollinen = modelData(model, 'koulutusmoduuli.pakollinen')
    if (pakollinen === false) {
      oppiaine = 'Valinnainen ' + oppiaine.toLowerCase() // i18n
    }
    return (<div className="oppiaineensuoritus">
      <label className="oppiaine">{oppiaine}</label>
      <span className="arvosana">{arvosana}</span>
      {modelData(model, 'yksilöllistettyOppimäärä') ? <span className="yksilollistetty"> *</span> : null}
      {modelData(model, 'korotus') ? <span className="korotus">(korotus)</span> : null}
    </div>)
  }
})
OppiaineEditor.canShowInline = () => false

const LukionKurssiEditor = React.createClass({
  render() {
    let {model} = this.props
    var tunniste = modelData(model, 'koulutusmoduuli.tunniste')
    let koodiarvo = tunniste && tunniste.koodiarvo
    let nimi = modelTitle(model, 'koulutusmoduuli')
    let arvosana = modelTitle(model, 'arviointi.-1.arvosana')
    return (<div className="lukionkurssinsuoritus">
      <label className="oppiaine"><span className="koodiarvo">{koodiarvo}</span> <span className="nimi">{nimi}</span></label>
      <span className="arvosana">{arvosana}</span>
    </div>)
  }
})
LukionKurssiEditor.canShowInline = () => false


const LaajuusEditor = React.createClass({
  render() {
    let {model, context} = this.props
    return context.edit
      ? <GenericEditor.ObjectEditor model={model} context={context}/>
      : <span>{modelTitle(model, 'arvo')} {modelTitle(model, 'yksikkö')}</span>
  }
})

const VahvistusEditor = React.createClass({
  render() {
    let {model, context} = this.props
    return context.edit
      ? <GenericEditor.ObjectEditor model={model} context={context} />
      : (<span className="vahvistus inline">
          <span className="date">{modelTitle(model, 'päivä')}</span>&nbsp;
          <span className="allekirjoitus">{modelTitle(model, 'paikkakunta')}</span>&nbsp;
          {
            (modelItems(model, 'myöntäjäHenkilöt') || []).map( (henkilö,i) =>
              <span key={i} className="nimi">{modelData(henkilö, 'nimi')}</span>
            )
          }
        </span>)
  }
})

const OpiskeluoikeusjaksoEditor = React.createClass({
  render() {
    let {model, context} = this.props
    return context.edit
      ? <GenericEditor.ObjectEditor {...this.props}/>
      : (<div className="opiskeluoikeusjakso">
        <label className="date">{modelTitle(model, 'alku')}</label>
        <label className="tila">{modelTitle(model, 'tila')}</label>
      </div>)
  }
})

const TutkinnonosaEditor = React.createClass({
  render() {
    let {model, context} = this.props

    return (<div className="suoritus tutkinnonosa">
      <GenericEditor.ExpandableEditor
        editor = {this}
        defaultExpanded={context.edit}
        collapsedView={() => <span className="tutkinnonosan-tiedot">
          <label className="nimi">{modelTitle(model, 'koulutusmoduuli')}</label>
          <span className="arvosana">{modelTitle(model, 'arviointi.-1.arvosana')}</span>
          </span>}
        expandedView={() => <span>
          <label className="nimi">{modelTitle(model, 'koulutusmoduuli')}</label>
          <GenericEditor.PropertiesEditor properties={model.value.properties} context={context}/>
          </span>}
        context={context}
      />
    </div>)
  }
})
TutkinnonosaEditor.canShowInline = () => false

export const editorMapping = {
  'oppijaeditorview': OppijaEditor,
  'perusopetuksenoppiaineensuoritus': OppiaineEditor,
  'perusopetukseenvalmistavanopetuksenoppiaineensuoritus': OppiaineEditor,
  'perusopetuksenlisaopetuksenoppiaineensuoritus': OppiaineEditor,
  'preiboppiaineensuoritus': TutkinnonosaEditor,
  'iboppiaineensuoritus': TutkinnonosaEditor,
  'ammatillisentutkinnonosansuoritus': TutkinnonosaEditor,
  'lukionoppiaineensuoritus': TutkinnonosaEditor,
  'ylioppilastutkinnonkokeensuoritus': TutkinnonosaEditor,
  'lukionkurssinsuoritus': LukionKurssiEditor,
  'ammatillinenopiskeluoikeusjakso': OpiskeluoikeusjaksoEditor,
  'lukionopiskeluoikeusjakso': OpiskeluoikeusjaksoEditor,
  'perusopetuksenopiskeluoikeusjakso': OpiskeluoikeusjaksoEditor,
  'henkilovahvistuspaikkakunnalla': VahvistusEditor,
  'henkilovahvistusilmanpaikkakuntaa': VahvistusEditor,
  'organisaatiovahvistus': VahvistusEditor,
  'laajuusosaamispisteissa' : LaajuusEditor,
  'laajuuskursseissa' : LaajuusEditor,
  'laajuusopintopisteissa' : LaajuusEditor,
  'laajuusvuosiviikkotunneissa' : LaajuusEditor
}
