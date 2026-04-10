// src/components/Navbar.jsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { SoundControlBar } from './AudioPlayer'

const LANG_LABELS = { pt: 'PT', en: 'EN', es: 'ES' }

export default function Navbar() {
  const { t, lang, changeLanguage } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <div className="menu">
      <div className="logo">
        <Link to="/">
          <img src="/images/logo_biar2.png" alt="BIAR" />
          <h1>BIAR</h1>
          <p>Invest</p>
        </Link>
      </div>

      <div className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
        <span></span><span></span><span></span>
      </div>

      <div className={`infos ${menuOpen ? 'active' : ''}`}>
        <ul className="lista">
          <li><Link to="/about" onClick={() => setMenuOpen(false)}>{t('menu_about')}</Link></li>
          <li><Link to="/login" onClick={() => setMenuOpen(false)}>{t('menu_sust')}</Link></li>
          <li><Link to="/cadastro" onClick={() => setMenuOpen(false)}>{t('menu_invest')}</Link></li>
          <li><Link to="/contact" onClick={() => setMenuOpen(false)}>{t('menu_contact')}</Link></li>
          <li><Link to="/profile" onClick={() => setMenuOpen(false)}>{t('Profile')}</Link></li>
          <li className="nav-item-sound">
            <SoundControlBar variant="menu" />
          </li>
          <li className="linguas">
            {LANG_LABELS[lang]}
            <div className="language">
              <p onClick={() => { changeLanguage('pt'); setMenuOpen(false) }}>Portuguese</p>
              <p onClick={() => { changeLanguage('en'); setMenuOpen(false) }}>English</p>
              <p onClick={() => { changeLanguage('es'); setMenuOpen(false) }}>Spanish</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}
