import React from 'react'
import {PropertiesEditor} from './PropertiesEditor.jsx'
import {Editor} from './Editor.jsx'
import {t} from '../i18n.js'
import {suorituksenTyyppi} from './Suoritus'

export const KoulutusmoduuliEditor = React.createClass({
  render() {
    let { model } = this.props
    let overrideEdit = model.context.editAll ? true : false
    return (<span className="koulutusmoduuli">
      <span className="tunniste">
        {
          ['aikuistenperusopetuksenoppimaara', 'aikuistenperusopetuksenoppimaaranalkuvaihe'].includes(suorituksenTyyppi(model.context.suoritus))
            ? <Editor model={model.context.suoritus} path="tyyppi" edit={false}/>
            : <Editor model={model} path="tunniste" edit={overrideEdit}/>
        }
      </span>
      <span className="diaarinumero"><span className="value">
        <Editor model={model} path="perusteenDiaarinumero" placeholder={t('Perusteen diaarinumero')}/>
      </span></span>
      <PropertiesEditor model={model} propertyFilter={p => !['tunniste', 'perusteenDiaarinumero', 'pakollinen'].includes(p.key)} />
    </span>)
  }
})
