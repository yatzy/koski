import React from 'react'
import Link from './Link.jsx'

const loadingContent = <div className="ajax-indicator-bg">Ladataan...</div>

const withLoadingIndicator = (contentP) => contentP.startWith(loadingContent)

export const tiedonsiirrotContentP = (location, contentP) => withLoadingIndicator(contentP).map((content) => (<div className='content-area'>
  <nav className="sidebar tiedonsiirrot-navi">
    {naviLink('/koski/tiedonsiirrot/yhteenveto', 'Yhteenveto', location, 'yhteenveto-link')}
    {naviLink('/koski/tiedonsiirrot', 'Tiedonsiirtoloki', location, 'tiedonsiirto-link')}
    {naviLink('/koski/tiedonsiirrot/virheet', 'Virheet', location, 'virheet-link')}
  </nav>
  <div className="main-content tiedonsiirrot-content">
    { content }
  </div>
</div>))

const naviLink = (path, text, location, linkClassName) => {
  const className = path == location ? 'navi-link-container selected' : 'navi-link-container'
  return (<span className={className}><Link href={path} className={linkClassName}>{ text }</Link></span>)
}