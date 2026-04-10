// src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { login as loginApi } from '../api/auth'
import GridDistortion from '../components/GridDistortion';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .login-split {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #060504; /* Preto levemente aquecido */
    font-family: 'Syne', sans-serif;
  }

  /* ── LEFT PANEL ── */
  .login-left {
    position: relative;
    width: 38%;
    min-width: 380px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 52px;
    background: rgba(12, 10, 9, 0.95);
    z-index: 2;
    overflow: hidden;
    border-right: 1px solid rgba(244, 237, 230, 0.05);
  }

  /* Brilho sutil no fundo usando a cor nova */
  .login-left::before {
    content: '';
    position: absolute;
    top: -80px;
    left: -80px;
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(244, 237, 230, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── TOP BAR ── */
  .login-topbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 52px;
    z-index: 10;
  }

  .login-logo img {
    height: 70px;
    width: 70px;
    filter: brightness(1.2) grayscale(0.5);
  }

  .login-logo-name {
    font-size: 15px;
    font-weight: 700;
    color: #F4EDE6;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .login-topbar-link {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: rgba(244, 237, 230, 0.45);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s;
  }

  .login-topbar-link:hover {
    color: #F4EDE6;
  }

  /* ── FORM CONTENT ── */
  .login-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .login-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #F4EDE6;
    opacity: 0.7;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .login-eyebrow::before {
    content: '';
    display: block;
    width: 18px;
    height: 1px;
    background: rgba(244, 237, 230, 0.5);
  }

  .login-heading {
    font-size: 30px;
    font-weight: 800;
    color: #F4EDE6;
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin-bottom: 6px;
  }

  .login-subheading {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: rgba(244, 237, 230, 0.32);
    letter-spacing: 0.04em;
    margin-bottom: 36px;
  }

  /* ── GOOGLE BTN ── */
  .login-google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 13px 20px;
    background: rgba(244, 237, 230, 0.03);
    border: 1px solid rgba(244, 237, 230, 0.1);
    border-radius: 10px;
    color: #F4EDE6;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 24px;
  }

  .login-google-btn:hover {
    background: rgba(244, 237, 230, 0.08);
    border-color: rgba(244, 237, 230, 0.2);
  }

  /* ── DIVIDER ── */
  .login-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 24px;
  }

  .login-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(244, 237, 230, 0.08);
  }

  .login-divider-text {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    color: rgba(244, 237, 230, 0.25);
    text-transform: uppercase;
  }

  /* ── FIELDS ── */
  .login-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;
  }

  .login-field label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(244, 237, 230, 0.4);
  }

  .login-field input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(244, 237, 230, 0.1);
    border-radius: 9px;
    color: #F4EDE6;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    outline: none;
    transition: all 0.2s;
  }

  .login-field input::placeholder {
    color: rgba(244, 237, 230, 0.15);
  }

  .login-field input:focus {
    border-color: rgba(244, 237, 230, 0.4);
    background: rgba(244, 237, 230, 0.04);
  }

  /* ── ERROR MESSAGE ── */
  .login-error {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #E6B8A2; /* Um tom de terra/alerta suave que combina com bege */
    background: rgba(230, 184, 162, 0.08);
    border: 1px solid rgba(230, 184, 162, 0.15);
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 16px;
  }

  /* ── SUBMIT BTN ── */
  .login-submit-btn {
    width: 100%;
    padding: 14px 20px;
    background: #F4EDE6;
    border: none;
    border-radius: 10px;
    color: #060504;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    margin-top: 4px;
  }

  .login-submit-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .login-submit-btn:disabled {
    opacity: 0.5;
    transform: none;
    cursor: not-allowed;
  }

  /* ── FOOTER LINK ── */
  .login-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 22px;
  }

  .login-footer p {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: rgba(244, 237, 230, 0.3);
  }

  .login-footer a {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #F4EDE6;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;
  }

  .login-footer a:hover {
    opacity: 0.7;
  }

  .login-terms {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    color: rgba(244, 237, 230, 0.15);
    letter-spacing: 0.08em;
    text-align: center;
    margin-top: 18px;
  }

  /* ── RIGHT PANEL ── */
  .login-right {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .login-right-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 30% 20%, rgba(244, 237, 230, 0.08) 0%, transparent 55%),
      #0d0c0b;
  }

  .login-character {
    position: absolute;
    bottom:0%;
    width: 100%;          
    height:auto;
    max-height:100%;        
    object-fit: contain; 
    mix-blend-mode: luminosity;
    opacity: 0.90;
    z-index: 2;
    pointer-events: none; 
  }

  .login-right-fade {
    position: absolute;
    top: 0;
    left: 0;
    width: 120px;
    height: 100%;
    background: linear-gradient(90deg, #060504 0%, transparent 100%);
    pointer-events: none;
  }

  .login-right-tag {
    position: absolute;
    top: 28px;
    right: 28px;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(244, 237, 230, 0.35);
    display: flex;
    align-items: center;
    gap: 6px;
    z-index:2;
    cursor:pointer;
  }

  .login-right-tag::after {
    content: '';
    display: block;
    width: 14px;
    height: 1px;
    background: rgba(244, 237, 230, 0.25);
  }

  .login-right-bottom {
    position: absolute;
    bottom: 32px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index:2;
  }

  .login-right-pill {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(244, 237, 230, 0.35);
    background: rgba(244, 237, 230, 0.03);
    border: 1px solid rgba(244, 237, 230, 0.07);
    border-radius: 100px;
    padding: 6px 16px;
  }

  @media (max-width: 700px) {
    .login-split { flex-direction: column; }
    .login-left {
      width: 100%;
      min-width: unset;
      height: 100%;
      padding: 100px 28px 48px;
      border-right: none;
    }
    .login-right { display: none; }
  }
`

export default function Login() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    const u = username.trim()
    const em = email.trim()
    if ((!u && !em) || !password) {
      setMessage(t('err_auth_fill'))
      return
    }
    setLoading(true)
    try {
      const data = await loginApi({ username: u, email: em, password })
      localStorage.setItem('biar_token', data.token)
      localStorage.setItem('biar_user', JSON.stringify(data.user))
      navigate('/')
    } catch (err) {
      if (err.code === 'invalid_credentials') setMessage(t('err_auth_invalid'))
      else if (err.status === 0 || err.name === 'TypeError') setMessage(t('err_auth_network'))
      else if (err.code === 'server_error') setMessage(t('err_auth_server'))
      else setMessage(t('err_auth_invalid'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{styles}</style>



      <div className="login-split">

        <div style={{ width: '100%', height: '100%', position:'absolute', zIndex:1, opacity:0.9, }}>
  <GridDistortion
    imageSrc="../../public/images/wallpaper.png"
    grid={10}
    mouse={0.1}
    strength={0.15}
    relaxation={0.9}
    className="custom-class"
  />
</div>

        {/* ── LEFT PANEL ── */}
        <div className="login-left">

          {/* Top bar */}
          <div className="login-topbar">
            <Link to="/" className="login-logo">
              <img src="/images/logo_biar2.png" alt="BIAR" />
            </Link>
            <Link to="/cadastro" className="login-topbar-link">
              {t('login_signup')}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
              </svg>
            </Link>
          </div>

          <div className="login-content">
            <p className="login-eyebrow">{t('login_title')}</p>
            <h1 className="login-heading">{t('login_title')}</h1>
            <p className="login-subheading">{t('terms_policy')}</p>

            {/* Google button */}
            <button
                type="button"
                className="login-google-btn"
                onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || ''}/api/auth/google`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z"/>
                </svg>
                {t('sign_google')}
              </button>

            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">{t('login_or')}</span>
              <div className="login-divider-line" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label>{t('login_user_lbl')}</label>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder={t('login_user_ph')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="login-field">
                <label>{t('login_email_lbl')}</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={t('login_email_ph')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="login-field">
                <label>{t('sign_pass_lbl')}</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('sign_pass_ph')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {message && (
                <p className="login-error" role="alert">{message}</p>
              )}

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? '…' : t('login_btn')}
              </button>
            </form>

            <div className="login-footer">
              <p>{t('login_no_acc')}</p>
              <Link to="/cadastro">{t('login_signup')}</Link>
            </div>

            <p className="login-terms">{t('terms_policy')}</p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="login-right">
          <div className="login-right-bg" />

          {/*
            Coloque sua imagem de personagem aqui.
            Substitua o src abaixo pelo caminho da sua imagem.
            Exemplo: src="/images/seu-personagem.png"
          */}
          {/* <img src="/images/seu-personagem.png" alt="" className="login-character" aria-hidden="true" /> */}


          <div className="login-right-fade" />

         <Link to="/">
          <div className="login-right-tag">HOME</div>
         </Link>

          <div className="login-right-bottom">
            <span className="login-right-pill">{t('login_title')} · BIAR</span>
          </div>
        </div>

      </div>
    </>
  )
}
