import React from 'react'
import BaconComponent from './BaconComponent'
import Http from './http'
import Link from './Link.jsx'
import {currentLocation, navigateTo} from './location.js'
import {ISO2FinnishDateTime} from './date.js'
import Text from './Text.jsx'

export default class Versiohistoria extends BaconComponent {
  constructor(props) {
    super(props)
    this.state = this.initialState()
  }
  render() {
    let { opiskeluoikeusOid, oppijaOid } = this.props
    let { showHistory, history } = this.state
    let toggle = () => {
      let newShowHistory = !showHistory
      this.setState({showHistory: newShowHistory})
      if (newShowHistory) this.fetchHistory(this.props.opiskeluoikeusOid)
      if (!newShowHistory && this.versionumero()) {
        navigateTo(`/koski/oppija/${oppijaOid}`)
      }
    }
    let selectedVersion = this.versionumero() || history.length
    return (<div className="versiohistoria">
      <a onClick={toggle}><Text name="versiohistoria"/></a>
      {
        showHistory && (<table><tbody>{
          history.map((version, i) =>
            <tr key={i} className={version.versionumero == selectedVersion ? 'selected' : ''}>
              <td className="versionumero">{'v' + version.versionumero}</td>
              <td className="aikaleima"><Link href={`/koski/oppija/${oppijaOid}?opiskeluoikeus=${opiskeluoikeusOid}&versionumero=${version.versionumero}`}>{ISO2FinnishDateTime(version.aikaleima)}</Link></td>
            </tr>
          )
        }</tbody></table>)
      }
    </div>)
  }
  componentWillMount() {
    super.componentWillMount()
    this.propsE.map('.opiskeluoikeusOid').skipDuplicates().onValue((opiskeluoikeusOid) => {
      this.setState(this.initialState())
      if (this.state.showHistory) this.fetchHistory(opiskeluoikeusOid)
    })
    this.propsE.push(this.props)
  }
  fetchHistory(opiskeluoikeusOid) {
    Http.cachedGet(`/koski/api/opiskeluoikeus/historia/${opiskeluoikeusOid}`)
      .takeUntil(this.unmountE)
      .onValue(h => this.setState({history: h}))
  }
  initialState() {
    return { showHistory: !!this.versionumero(), history: [] }
  }
  versionumero() {
    return currentLocation().params.versionumero
  }
}
