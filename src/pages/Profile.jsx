// src/pages/Profile.jsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import '../styles/profile.css'

// ── Data ───────────────────────────────────────────────────
const NAV_ITEMS = ['Dashboard', 'Cotas', 'Projetos', 'Carteira', 'Histórico', 'Suporte']

const WEEKLY_BARS = [
  { day: 'D', h: 38 }, { day: 'S', h: 55 }, { day: 'T', h: 42 },
  { day: 'Q', h: 82, active: true }, { day: 'Q', h: 67 },
  { day: 'S', h: 71 }, { day: 'S', h: 48 },
]

const PROJECTS = [
  { id: 1, title: 'Residencial Horizonte', tag: 'Imobiliário',    roi: '14,2% a.a', color: '#7c6ff7', progress: 72 },
  { id: 2, title: 'Energia Solar SP',      tag: 'Sustentável',    roi: '18,7% a.a', color: '#F4EDE6', progress: 41 },
  { id: 3, title: 'Hub Logístico Norte',   tag: 'Infraestrutura', roi: '11,5% a.a', color: '#5ba89e', progress: 89 },
]

const TASKS = [
  { id: 1, label: 'Verificar identidade',    done: true  },
  { id: 2, label: 'Assinar contrato base',   done: true  },
  { id: 3, label: 'Definir perfil de risco', done: false },
  { id: 4, label: 'Primeiro aporte',         done: false },
  { id: 5, label: 'Revisão de carteira',     done: false },
]

// ── SVG Radial ─────────────────────────────────────────────
function RadialProgress({ pct = 75 }) {
  const r = 48
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="prf-radial-svg">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(244,237,230,0.08)" strokeWidth="9" />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke="#F4EDE6" strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 60 60)"
        className="prf-radial-arc"
      />
      <text x="60" y="55" textAnchor="middle" fontSize="20" fontWeight="700" fill="#F4EDE6">{pct}%</text>
      <text x="60" y="72" textAnchor="middle" fontSize="9"  fill="rgba(244,237,230,0.4)" letterSpacing="0.5">META ANUAL</text>
    </svg>
  )
}

// ── Globe Component ────────────────────────────────────────
// Uses real Earth Blue Marble texture via CDN (three-globe package on jsDelivr)
const GLOBE_CDN = 'https://cdn.jsdelivr.net/npm/three-globe@2.41.12/example/img'

function GlobeCard({ location }) {
  const mountRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const W = el.clientWidth
    const H = el.clientHeight

    // ── Renderer ─────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    // ── Scene + Camera ───────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 200)
    camera.position.z = 2.8

    // ── Stars ────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry()
    const starCount = 1200
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 100
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.07, transparent: true, opacity: 0.55,
    })))

    // ── Texture loader ───────────────────────────────
    const loader = new THREE.TextureLoader()

    // ── Earth sphere ─────────────────────────────────
    const earthGeo = new THREE.SphereGeometry(1, 64, 64)
    const earthMat = new THREE.MeshPhongMaterial({
      specular: new THREE.Color(0x2244aa),
      shininess: 18,
    })
    const earth = new THREE.Mesh(earthGeo, earthMat)
    scene.add(earth)

    // Blue Marble day texture
    loader.load(
      `${GLOBE_CDN}/earth-blue-marble.jpg`,
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace
        earthMat.map = tex
        earthMat.needsUpdate = true
      },
      undefined,
      () => {
        // Fallback canvas texture if CDN blocked
        const c = document.createElement('canvas')
        c.width = 512; c.height = 256
        const cx = c.getContext('2d')
        const grad = cx.createLinearGradient(0, 0, 0, 256)
        grad.addColorStop(0,   '#1a3a6a')
        grad.addColorStop(0.5, '#1c5a8a')
        grad.addColorStop(1,   '#0d2040')
        cx.fillStyle = grad; cx.fillRect(0, 0, 512, 256)
        cx.fillStyle = '#3a7d44'
        // rough landmass shapes
        cx.beginPath(); cx.ellipse(90,  110, 42, 60, 0.2, 0, Math.PI*2); cx.fill()
        cx.beginPath(); cx.ellipse(165, 95,  28, 70, 0.1, 0, Math.PI*2); cx.fill()
        cx.beginPath(); cx.ellipse(270, 90,  65, 52, 0.0, 0, Math.PI*2); cx.fill()
        cx.beginPath(); cx.ellipse(380, 115, 32, 40, 0.1, 0, Math.PI*2); cx.fill()
        cx.beginPath(); cx.ellipse(415, 138, 28, 50, 0.0, 0, Math.PI*2); cx.fill()
        cx.beginPath(); cx.ellipse(450, 155, 30, 22,-0.2, 0, Math.PI*2); cx.fill()
        earthMat.map = new THREE.CanvasTexture(c)
        earthMat.needsUpdate = true
      }
    )

    // Bump / topology
    loader.load(`${GLOBE_CDN}/earth-topology.png`, tex => {
      earthMat.bumpMap = tex
      earthMat.bumpScale = 0.05
      earthMat.needsUpdate = true
    })

    // Specular (ocean reflections)
    loader.load(`${GLOBE_CDN}/earth-water.png`, tex => {
      earthMat.specularMap = tex
      earthMat.needsUpdate = true
    })

    // ── Clouds ───────────────────────────────────────
    const cloudGeo = new THREE.SphereGeometry(1.013, 48, 48)
    const cloudMat = new THREE.MeshPhongMaterial({
      transparent: true, opacity: 0.35, depthWrite: false,
    })
    loader.load(`${GLOBE_CDN}/earth-clouds.png`, tex => {
      cloudMat.map = tex
      cloudMat.needsUpdate = true
    })
    const clouds = new THREE.Mesh(cloudGeo, cloudMat)
    scene.add(clouds)

    // ── Atmosphere ───────────────────────────────────
    // Inner glow (blue rim)
    const atmGeo = new THREE.SphereGeometry(1.1, 48, 48)
    const atmMat = new THREE.MeshPhongMaterial({
      color: 0x3366ee, transparent: true, opacity: 0.13, side: THREE.BackSide,
    })
    scene.add(new THREE.Mesh(atmGeo, atmMat))

    // Outer diffuse halo
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.22, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x2244cc, transparent: true, opacity: 0.05, side: THREE.BackSide })
    ))

    // ── Lights ───────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.30))
    const sun = new THREE.DirectionalLight(0xfff8e8, 1.8)
    sun.position.set(5, 2, 4)
    scene.add(sun)
    // Soft earthshine from opposite side
    const fill = new THREE.DirectionalLight(0x223366, 0.25)
    fill.position.set(-5, -2, -4)
    scene.add(fill)

    // ── Location marker ──────────────────────────────
    const lat = location?.lat ?? -14.2
    const lon = location?.lon ?? -51.9

    const phi   = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    const mx = -Math.sin(phi) * Math.cos(theta)
    const my =  Math.cos(phi)
    const mz =  Math.sin(phi) * Math.sin(theta)
    const markerPos = new THREE.Vector3(mx, my, mz)

    // Red glow dot
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    )
    pin.position.copy(markerPos)
    earth.add(pin)

    // Pulsing ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.036, 0.052, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff3333, transparent: true, opacity: 0.75, side: THREE.DoubleSide,
      })
    )
    ring.position.copy(markerPos)
    ring.lookAt(markerPos.clone().multiplyScalar(3))
    earth.add(ring)

    // Orient globe so location faces viewer at start
    earth.rotation.y = -(lon * Math.PI) / 180
    earth.rotation.x =  (lat * Math.PI) / 180 * 0.3
    clouds.rotation.y = earth.rotation.y

    // ── Animation loop ───────────────────────────────
    let pulseT = 0
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      earth.rotation.y  += 0.0014
      clouds.rotation.y += 0.0017
      pulseT += 0.045
      ring.material.opacity = 0.35 + 0.55 * Math.abs(Math.sin(pulseT))
      renderer.render(scene, camera)
    }
    animate()

    // ── Resize handler ───────────────────────────────
    const onResize = () => {
      const nW = el.clientWidth, nH = el.clientHeight
      camera.aspect = nW / nH
      camera.updateProjectionMatrix()
      renderer.setSize(nW, nH)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [location])

  return (
    <div className="prf-card prf-globe-card">
      <div className="prf-card-header-mono">
        <span className="prf-label-mono">LOCALIZAÇÃO</span>
        <div className="prf-live-dot" />
      </div>

      <div className="prf-globe-mount" ref={mountRef} />

      <div className="prf-globe-info">
        {location ? (
          <>
            <p className="prf-globe-city">{location.city || '—'}</p>
            <p className="prf-globe-region">
              {[location.region, location.country].filter(Boolean).join(' · ')}
            </p>
          </>
        ) : (
          <p className="prf-globe-city prf-globe-loading">Detectando localização…</p>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function Profile() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [time, setTime]           = useState(new Date())
  const [taskDone, setTaskDone]   = useState(TASKS.map(t => t.done))
  const [location, setLocation]   = useState(null)

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // IP-based geolocation
  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/')
        if (!res.ok) throw new Error('CORS/unavailable')
        const d = await res.json()
        if (d.error) throw new Error('API error')
        setLocation({ lat: d.latitude, lon: d.longitude, city: d.city, region: d.region, country: d.country_name })
      } catch {
        // Fallback: center of Brazil
        setLocation({ lat: -14.2350, lon: -51.9253, city: 'Brasil', region: null, country: null })
      }
    }
    detect()
  }, [])

  const doneTasks  = taskDone.filter(Boolean).length
  const onboardPct = Math.round((doneTasks / TASKS.length) * 100)
  const fmtTime    = d => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="prf-root">

      {/* ── HEADER ── */}
      <header className="prf-header">
        <Link to="/" className="prf-logo">
          <img src="/images/logo_biar2.png" alt="BIAR" className="prf-logo-img" />
          <span className="prf-logo-name">BIAR Investments</span>
        </Link>

        <nav className="prf-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              className={`prf-nav-btn${activeNav === item ? ' prf-nav-btn--active' : ''}`}
              onClick={() => setActiveNav(item)}
            >{item}</button>
          ))}
        </nav>

        <div className="prf-header-actions">
          <button className="prf-icon-btn" aria-label="Notificações">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="prf-notif-dot" />
          </button>
          <button className="prf-icon-btn" aria-label="Configurações">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <div className="prf-avatar-mini">
            <img src="https://api.dicebear.com/9.x/notionists/svg?seed=biarinvestor&backgroundColor=2d2d2d" alt="Investidor" />
          </div>
        </div>
      </header>

      <main className="prf-main">

        {/* ── WELCOME ROW ── */}
        <section className="prf-welcome-row">
          <div className="prf-welcome-left">
            <p className="prf-welcome-eyebrow">
              <span className="prf-welcome-line" />
              PAINEL DO INVESTIDOR
            </p>
            <h1 className="prf-welcome-h1">Bem-vindo, <br />Investidor</h1>
            <div className="prf-tags-row">
              <span className="prf-tag">Nível 2</span>
              <span className="prf-tag prf-tag--accent">12 Cotas</span>
              <span className="prf-tag">+15,3% rendimento</span>
            </div>
          </div>

          <div className="prf-welcome-stats">
            <div className="prf-stat">
              <span className="prf-stat-num">1.247</span>
              <span className="prf-stat-label">Membros</span>
            </div>
            <div className="prf-stat-divider" />
            <div className="prf-stat">
              <span className="prf-stat-num">56</span>
              <span className="prf-stat-label">Investindo</span>
            </div>
            <div className="prf-stat-divider" />
            <div className="prf-stat">
              <span className="prf-stat-num">203</span>
              <span className="prf-stat-label">Projetos</span>
            </div>
          </div>
        </section>

        {/* ── BENTO GRID ── */}
        <div className="prf-bento">

          {/* ── COL A: Profile + Globe ── */}
          <aside className="prf-col-a">
            <div className="prf-card prf-profile-card">
              <div className="prf-avatar-wrap">
                <img
                  className="prf-avatar-img"
                  src="https://api.dicebear.com/9.x/notionists/svg?seed=biarinvestor&backgroundColor=2d2d2d"
                  alt="Perfil do investidor"
                />
                <span className="prf-status-dot" />
              </div>
              <h2 className="prf-user-name">Investidor BIAR</h2>
              <p className="prf-user-sub">Membro desde Jan 2024</p>

              <div className="prf-balance-tag">
                <span className="prf-balance-label">PATRIMÔNIO</span>
                <span className="prf-balance-value">R$ 45.200,00</span>
              </div>

              <nav className="prf-side-menu">
                {['Aportes mensais', 'Dispositivos', 'Resumo de rendimentos', 'Benefícios'].map(item => (
                  <button key={item} className="prf-side-menu-item">
                    <span>{item}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
              </nav>
            </div>

            <GlobeCard location={location} />
          </aside>

          {/* ── COL B: Center ── */}
          <section className="prf-col-b">
            <div className="prf-row-top">
              <div className="prf-card prf-progress-card">
                <div className="prf-card-header">
                  <div>
                    <span className="prf-label-mono">DESEMPENHO</span>
                    <p className="prf-card-big">8,4%</p>
                    <span className="prf-card-sub">Lucro sobre cotas · esta semana</span>
                  </div>
                  <button className="prf-expand-btn" aria-label="Expandir">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                  </button>
                </div>
                <div className="prf-bars-wrap">
                  {WEEKLY_BARS.map((b, i) => (
                    <div key={i} className="prf-bar-col">
                      <div className={`prf-bar${b.active ? ' prf-bar--active' : ''}`} style={{ height: `${b.h}%` }} />
                      <span className="prf-bar-day">{b.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="prf-card prf-tracker-card">
                <div className="prf-card-header">
                  <span className="prf-label-mono">META ANUAL</span>
                  <button className="prf-expand-btn" aria-label="Expandir">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                  </button>
                </div>
                <div className="prf-tracker-body">
                  <RadialProgress pct={75} />
                  <p className="prf-tracker-clock">{fmtTime(time)}</p>
                  <span className="prf-tracker-clock-label">Última atualização</span>
                </div>
              </div>
            </div>

            <div className="prf-card prf-projects-card">
              <div className="prf-card-header prf-card-header--flat">
                <h3 className="prf-section-title">Projetos em captação</h3>
                <button className="prf-view-all-btn">Ver todos</button>
              </div>
              <div className="prf-projects-list">
                {PROJECTS.map(p => (
                  <div key={p.id} className="prf-project-row">
                    <div className="prf-project-accent" style={{ background: p.color }} />
                    <div className="prf-project-info">
                      <span className="prf-project-name">{p.title}</span>
                      <span className="prf-project-meta">
                        {p.tag} · Retorno alvo: <strong>{p.roi}</strong>
                      </span>
                    </div>
                    <div className="prf-project-right">
                      <div className="prf-mini-bar-wrap">
                        <div className="prf-mini-bar-fill" style={{ width: `${p.progress}%`, background: p.color }} />
                      </div>
                      <span className="prf-mini-bar-pct">{p.progress}%</span>
                    </div>
                    <button className="prf-project-btn">Detalhes</button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── COL C ── */}
          <aside className="prf-col-c">
            <div className="prf-card prf-onboard-card">
              <div className="prf-onboard-header">
                <div>
                  <span className="prf-label-mono">ONBOARDING</span>
                  <p className="prf-onboard-score">{doneTasks}/{TASKS.length}</p>
                </div>
                <span className="prf-onboard-pct">{onboardPct}%</span>
              </div>
              <div className="prf-onboard-track">
                <div className="prf-onboard-fill" style={{ width: `${onboardPct}%` }} />
              </div>
              <div className="prf-tasks-list">
                {TASKS.map((task, i) => (
                  <button
                    key={task.id}
                    className={`prf-task-item${taskDone[i] ? ' prf-task-item--done' : ''}`}
                    onClick={() => {
                      const next = [...taskDone]; next[i] = !next[i]; setTaskDone(next)
                    }}
                  >
                    <span className={`prf-task-check${taskDone[i] ? ' prf-task-check--done' : ''}`}>
                      {taskDone[i] && (
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2 6 5 9 10 3" />
                        </svg>
                      )}
                    </span>
                    <span className="prf-task-label">{task.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="prf-card prf-alloc-card">
              <p className="prf-label-mono prf-alloc-label-top">ALOCAÇÕES</p>
              <div className="prf-alloc-list">
                {[
                  { label: 'Imobiliário',  pct: 45, color: '#7c6ff7' },
                  { label: 'Sustentável',  pct: 30, color: '#F4EDE6' },
                  { label: 'Infraestrut.', pct: 25, color: '#5ba89e' },
                ].map(a => (
                  <div key={a.label} className="prf-alloc-row">
                    <span className="prf-alloc-dot" style={{ background: a.color }} />
                    <span className="prf-alloc-lbl">{a.label}</span>
                    <div className="prf-alloc-track">
                      <div className="prf-alloc-fill" style={{ width: `${a.pct}%`, background: a.color }} />
                    </div>
                    <span className="prf-alloc-num">{a.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}