import '../styles/home.css'
import { useState, useEffect } from 'react'


  export default function cookies() {
    const [visible, setVisible] = useState(false)

    useEffect(() =>{
        if(localStorage.getItem('cookiesAccepted') !== 'true'){
            setVisible(true)
        }
    }, [])

    function acceptCookies(){
        localStorage.setItem('cookiesAccepted', 'true')
        setVisible(false)
    }

    function rejectCookies(){
        setVisible(false)
    }

    if (!visible) return null


    return(
    <div className="cookies" id='Cookie'>
  <div className="cookies-inner">
    <div className="cookies-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="rgba(255,255,255,0.35)" stroke="none"/>
        <circle cx="15.5" cy="9" r="1" fill="rgba(255,255,255,0.35)" stroke="none"/>
        <circle cx="10" cy="14.5" r="1" fill="rgba(255,255,255,0.35)" stroke="none"/>
        <circle cx="15" cy="14" r="1.5" fill="rgba(255,255,255,0.35)" stroke="none"/>
      </svg>
    </div>
    <div className="cookies-text">
      <h1>COOKIES</h1>
      <p>Usamos cookies para melhorar sua experiência de navegação e personalizar conteúdo.</p>
    </div>
    <div className="cookies-actions">
      <button className="btn-accept" onClick={acceptCookies}>ACEITAR TUDO</button>
      <button className="btn-reject" onClick={rejectCookies}>REJEITAR</button>
    </div>
  </div>
</div>
  )
  }