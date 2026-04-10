// src/pages/NotFound.jsx
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import LightPillar from '../components/LightPillar'
import '../styles/notfound.css'

export default function NotFound() {
  const { t } = useLanguage()

  return (
    <div className="notfound-page">
      <LightPillar topColor="#f43f5e" bottomColor="#8553f4" intensity={0.6} rotationSpeed={0.2} interactive={false} pillarRotation={45} pillarWidth={3.5} pillarHeight={0.3} />

      <div className="ui-layer">
        <header className="interactive">
          <Link to="/" className="logo-container" style={{ textDecoration: 'none', color: 'white' }}>
            <h2>BIAR</h2>
            <p>INVESTMENTS</p>
          </Link>
        </header>

        <div className="side-nav left-nav interactive" onClick={() => window.history.back()}>
          <div className="line"></div><span>BACK</span>
        </div>
        <div className="side-nav right-nav interactive" onClick={() => window.location.href = '/'}>
          <span>HOME</span><div className="line"></div>
        </div>

        <div className="content interactive">
          <Link to="/" className="back-home-btn">{t('error_btn')}</Link>
          <div className="huge-404">
            <h1>404</h1>
            <div className="vertical-text">{t('error_desc')}</div>
          </div>
        </div>

        <div className="bottom-icons interactive">
          <svg viewBox="0 0 24 24" onClick={() => window.location.href = '/'}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
      </div>
    </div>
  )
}
