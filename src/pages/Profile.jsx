// src/pages/Profile.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import '../styles/profile.css'
import Negociacao from '../components/Negociacao'
import { getWallet, getQuotes } from '../api/wallet'

const NAV_ITEMS = ['Dashboard', 'Negociação', 'Histórico', 'Suporte']

const ACCENT_COLORS = ['#cdb89f','#a89968','#8a7a5a','#b8a882','#c4aa7a','#9e8c6a','#d4c4a0','#7a6a4a','#e0d0b0','#6a5a3a']

function fmt(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Radial Progress ─────────────────────────────────────────
function RadialProgress({ pct = 0, label = 'RETORNO' }) {
  const clamped = Math.min(100, Math.max(-100, pct))
  const abs = Math.abs(clamped)
  const r = 48
  const circ = 2 * Math.PI * r
  const offset = circ - (abs / 100) * circ
  const color = clamped >= 0 ? '#4ade80' : '#f87171'
  const sign = clamped >= 0 ? '+' : '-'
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="prf-radial-svg">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(244,237,230,0.1)" strokeWidth="8" />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 60 60)"
        className="prf-radial-arc"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <defs>
        <linearGradient id="radialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cdb89f" />
          <stop offset="100%" stopColor="#a89968" />
        </linearGradient>
      </defs>
      <text x="60" y="52" textAnchor="middle" fontSize="16" fontWeight="700" fill={color}>
        {sign}{abs.toFixed(1)}%
      </text>
      <text x="60" y="70" textAnchor="middle" fontSize="8" fill="rgba(244,237,230,0.4)" letterSpacing="0.5">
        {label}
      </text>
    </svg>
  )
}

// ── Mapa Leaflet ─────────────────────────────────────────────
function MapCard() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [location, setLocation] = useState({ city: 'Obtendo localização...', region: 'Brasil', lat: -23.5505, lng: -46.6333 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initMap = (lat, lng) => {
      if (!mapRef.current || mapInstanceRef.current || !window.L) return
      const L = window.L
      const map = L.map(mapRef.current, { center: [lat, lng], zoom: 13, zoomControl: true, attributionControl: false, dragging: true, scrollWheelZoom: false })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)
      map.on('focus', () => map.scrollWheelZoom.enable())
      map.on('blur', () => map.scrollWheelZoom.disable())
      const markerDiv = document.createElement('div')
      markerDiv.className = 'prf-user-marker'
      L.marker([lat, lng], { icon: L.divIcon({ html: markerDiv.outerHTML, className: 'prf-marker-icon', iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(map)
      mapInstanceRef.current = map
    }

    const loadResources = () => {
      if (!document.querySelector('link[href*="leaflet.min.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
        document.head.appendChild(link)
      }
      if (!window.L) {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
        script.async = true
        script.onload = () => handleGeolocation()
        document.body.appendChild(script)
      } else {
        handleGeolocation()
      }
    }

    const handleGeolocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords: { latitude, longitude } }) => {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
              .then(r => r.json())
              .then(data => {
                setLocation({ city: data.address?.city || data.address?.town || 'Localização obtida', region: data.address?.state || 'Brasil', lat: latitude, lng: longitude })
                setLoading(false)
                initMap(latitude, longitude)
              })
              .catch(() => { setLoading(false); initMap(latitude, longitude) })
          },
          () => { setLoading(false); initMap(location.lat, location.lng) }
        )
      } else {
        setLoading(false)
        initMap(location.lat, location.lng)
      }
    }

    loadResources()
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null } }
  }, [])

  return (
    <div className="prf-globe-card prf-card">
      <div className="prf-card-header-mono">
        <span className="prf-label-mono">Localização</span>
        <div className="prf-live-dot"></div>
      </div>
      <div ref={mapRef} className="prf-map-container" style={{ height: '200px', width: '100%', borderRadius: '12px', marginTop: '15px', position: 'relative', zIndex: 5, outline: 'none' }} tabIndex="0" />
      <div className="prf-globe-info">
        <p className="prf-globe-city">{loading ? '📍 Carregando...' : location.city}</p>
        <p className="prf-globe-region">{location.region}</p>
      </div>
    </div>
  )
}

// ── Sparkline mini ───────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.max(4, (Math.abs(value) / max) * 100) : 4
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(244,237,230,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

// ── Profile Component ────────────────────────────────────────
export default function Profile() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [user, setUser] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [quotes, setQuotes] = useState({})
  const [loadingWallet, setLoadingWallet] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('biar_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  // Carrega carteira do banco
  useEffect(() => {
    const token = localStorage.getItem('biar_token')
    if (!token) { setLoadingWallet(false); return }
    getWallet()
      .then(w => { setWallet(w); setLoadingWallet(false) })
      .catch(() => setLoadingWallet(false))
  }, [])

  // Carrega cotações dos ativos em carteira
  useEffect(() => {
    if (!wallet) return
    const symbols = Object.keys(wallet.positions || {})
    if (symbols.length === 0) return
    getQuotes(symbols)
      .then(data => {
        const q = {}
        ;(data.results || []).forEach(r => { q[r.symbol] = r })
        setQuotes(q)
      })
      .catch(() => {})
  }, [wallet])

  const formatMemberSince = (dateString) => {
    if (!dateString) return '—'
    const d = new Date(dateString)
    return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')
  }

  const displayName = user?.username || 'Usuário'
  const memberSince = formatMemberSince(user?.createdAt)

  // ── Cálculos da carteira ──────────────────────────────────
  const positions = wallet?.positions || {}
  const history = wallet?.history || []
  const balance = wallet?.balance ?? 0

  const posEntries = Object.entries(positions)

  const totalInvested = posEntries.reduce((a, [, p]) => a + p.avgPrice * p.qty, 0)
  const totalMarket = posEntries.reduce((a, [sym, p]) => {
    const q = quotes[sym]
    return a + (q ? q.regularMarketPrice * p.qty : p.avgPrice * p.qty)
  }, 0)
  const totalEquity = balance + totalMarket
  const unrealizedPL = totalMarket - totalInvested
  const returnPct = ((totalEquity - 10000) / 10000) * 100
  const totalOperations = history.length

  // Alocação por ativo (% do patrimônio em ações)
  const allocations = posEntries.map(([sym, pos], i) => {
    const q = quotes[sym]
    const mktVal = q ? q.regularMarketPrice * pos.qty : pos.avgPrice * pos.qty
    const pct = totalMarket > 0 ? (mktVal / totalMarket) * 100 : 0
    const pl = q ? (q.regularMarketPrice - pos.avgPrice) * pos.qty : 0
    const plPct = ((q?.regularMarketPrice ?? pos.avgPrice) - pos.avgPrice) / pos.avgPrice * 100
    return { sym, pos, mktVal, pct, pl, plPct, color: ACCENT_COLORS[i % ACCENT_COLORS.length] }
  }).sort((a, b) => b.mktVal - a.mktVal)

  // Operações por dia da semana (últimos 7 dias)
  const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
  const today = new Date()
  const weekBars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    const count = history.filter(h => {
      const hd = new Date(h.date?.split(' ')[0]?.split('/').reverse().join('-'))
      return hd.toDateString() === d.toDateString()
    }).length
    return { day: DAY_LABELS[d.getDay()], count, isToday: i === 6 }
  })
  const maxBar = Math.max(...weekBars.map(b => b.count), 1)

  // Progresso da conta (baseado em tarefas reais)
  const accountTasks = [
    { label: 'Criar conta', done: true },
    { label: 'Verificar e-mail', done: !!user },
    { label: 'Primeiro aporte simulado', done: totalOperations > 0 },
    { label: 'Realizar primeira venda', done: history.some(h => h.side === 'SELL') },
    { label: 'Ter 3+ posições abertas', done: posEntries.length >= 3 },
  ]
  const accountProgress = Math.round((accountTasks.filter(t => t.done).length / accountTasks.length) * 100)

  return (
    <div className="prf-root">
      <header className="prf-header">
        <Link to="/" className="prf-logo">
          <img src="/images/logo_biar2.png" alt="BIAR" className="prf-logo-img" />
          <span className="prf-logo-name">BIAR</span>
        </Link>

        <nav className="prf-nav">
          {NAV_ITEMS.map(item => (
            <button key={item} className={`prf-nav-btn ${activeNav === item ? 'prf-nav-btn--active' : ''}`} onClick={() => setActiveNav(item)}>
              {item}
            </button>
          ))}
        </nav>

        <div className="prf-header-actions">
          <button className="prf-icon-btn" title="Notificações">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <div className="prf-avatar-mini">
            <span style={{ fontSize: 16, fontWeight: 700, color: '#cdb89f' }}>{displayName[0]?.toUpperCase()}</span>
          </div>
        </div>
      </header>

      <main className="prf-main">
        {activeNav === 'Negociação' && <Negociacao />}

        {activeNav === 'Histórico' && (
          <div className="prf-card" style={{ marginTop: 8 }}>
            <h3 className="prf-section-title" style={{ marginBottom: 20 }}>Histórico de Operações</h3>
            {history.length === 0 ? (
              <p style={{ color: 'rgba(244,237,230,0.3)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                Nenhuma operação realizada. Acesse Negociação para começar.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Data', 'Tipo', 'Ativo', 'Qtd', 'Preço', 'Total'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(244,237,230,0.35)', borderBottom: '1px solid rgba(244,237,230,0.08)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td style={{ padding: '11px 12px', color: 'rgba(244,237,230,0.5)', borderBottom: '1px solid rgba(244,237,230,0.05)' }}>{h.date}</td>
                      <td style={{ padding: '11px 12px', borderBottom: '1px solid rgba(244,237,230,0.05)' }}>
                        <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: h.side === 'BUY' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', color: h.side === 'BUY' ? '#4ade80' : '#f87171' }}>
                          {h.side === 'BUY' ? 'COMPRA' : 'VENDA'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 12px', color: '#F4EDE6', fontWeight: 700, borderBottom: '1px solid rgba(244,237,230,0.05)' }}>{h.symbol}</td>
                      <td style={{ padding: '11px 12px', color: '#F4EDE6', borderBottom: '1px solid rgba(244,237,230,0.05)' }}>{h.qty}</td>
                      <td style={{ padding: '11px 12px', color: '#F4EDE6', borderBottom: '1px solid rgba(244,237,230,0.05)' }}>R$ {fmt(h.price)}</td>
                      <td style={{ padding: '11px 12px', color: h.side === 'BUY' ? '#f87171' : '#4ade80', fontWeight: 600, borderBottom: '1px solid rgba(244,237,230,0.05)' }}>
                        {h.side === 'BUY' ? '-' : '+'}R$ {fmt(h.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeNav === 'Suporte' && (
          <div className="prf-card" style={{ marginTop: 8, textAlign: 'center', padding: '60px 40px' }}>
            <p style={{ fontSize: 32, marginBottom: 16 }}>🛠️</p>
            <h3 className="prf-section-title">Suporte</h3>
            <p style={{ color: 'rgba(244,237,230,0.4)', fontSize: 13, marginTop: 12 }}>Em breve. Entre em contato pela página de <Link to="/contact" style={{ color: '#cdb89f' }}>Contato</Link>.</p>
          </div>
        )}

        {activeNav === 'Dashboard' && (
          <>
            {/* ── Welcome Row ─────────────────────────────── */}
            <div className="prf-welcome-row">
              <div>
                <div className="prf-welcome-eyebrow">
                  <span className="prf-welcome-line"></span>
                  Bem-vindo de volta
                </div>
                <h1 className="prf-welcome-h1">{displayName}</h1>
                <div className="prf-tags-row">
                  <span className="prf-tag">{posEntries.length > 0 ? 'Investidor Ativo' : 'Novo Investidor'}</span>
                  {returnPct > 0 && <span className="prf-tag prf-tag--accent">Carteira Positiva</span>}
                  {posEntries.length >= 3 && <span className="prf-tag">Portfólio Diversificado</span>}
                </div>
              </div>

              <div className="prf-welcome-stats">
                <div className="prf-stat">
                  <div className="prf-stat-num" style={{ fontSize: loadingWallet ? 16 : undefined }}>
                    {loadingWallet ? '...' : `R$ ${totalInvested >= 1000 ? (totalInvested / 1000).toFixed(1) + 'K' : fmt(totalInvested)}`}
                  </div>
                  <div className="prf-stat-label">Capital Investido</div>
                </div>
                <div className="prf-stat-divider"></div>
                <div className="prf-stat">
                  <div className="prf-stat-num" style={{ color: returnPct >= 0 ? '#4ade80' : '#f87171' }}>
                    {loadingWallet ? '...' : `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%`}
                  </div>
                  <div className="prf-stat-label">Retorno Total</div>
                </div>
                <div className="prf-stat-divider"></div>
                <div className="prf-stat">
                  <div className="prf-stat-num">{loadingWallet ? '...' : posEntries.length}</div>
                  <div className="prf-stat-label">Posições Abertas</div>
                </div>
              </div>
            </div>

            {/* ── Bento Grid ──────────────────────────────── */}
            <div className="prf-bento">

              {/* Col A */}
              <div className="prf-col-a">
                <MapCard />

                {/* Perfil */}
                <div className="prf-card prf-profile-card">
                  <div className="prf-avatar-wrap" style={{ background: 'rgba(205,184,159,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: '#cdb89f' }}>{displayName[0]?.toUpperCase()}</span>
                    <div className="prf-status-dot"></div>
                  </div>
                  <h2 className="prf-profile-name">{displayName}</h2>
                  <p className="prf-profile-role">{user?.email || '—'}</p>
                  <div className="prf-profile-info">
                    <div className="prf-profile-info-row">
                      <span>Patrimônio:</span>
                      <strong style={{ color: '#cdb89f' }}>R$ {fmt(totalEquity)}</strong>
                    </div>
                    <div className="prf-profile-info-row">
                      <span>Saldo livre:</span>
                      <strong>R$ {fmt(balance)}</strong>
                    </div>
                    <div className="prf-profile-info-row">
                      <span>Membro desde:</span>
                      <strong>{memberSince}</strong>
                    </div>
                    <div className="prf-profile-info-row">
                      <span>Operações:</span>
                      <strong>{totalOperations}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Col B */}
              <div>
                <div className="prf-row-top">
                  {/* Atividade — operações por dia */}
                  <div className="prf-card prf-activity-card">
                    <span className="prf-label-mono">Operações (7 dias)</span>
                    <div className="prf-activity-bars">
                      {weekBars.map((bar, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div
                            className={`prf-bar ${bar.isToday ? 'prf-bar--active' : ''}`}
                            style={{ height: `${bar.count > 0 ? Math.max(12, (bar.count / maxBar) * 82) : 6}px`, opacity: bar.count === 0 ? 0.2 : 1 }}
                          />
                          <span className="prf-bar-day">{bar.day}</span>
                        </div>
                      ))}
                    </div>
                    {totalOperations === 0 && (
                      <p style={{ fontSize: 11, color: 'rgba(244,237,230,0.3)', textAlign: 'center', marginTop: 8 }}>
                        Nenhuma operação ainda
                      </p>
                    )}
                  </div>

                  {/* Retorno total */}
                  <div className="prf-card prf-tracker-card">
                    <span className="prf-label-mono">Retorno Total</span>
                    <div className="prf-tracker-body">
                      <RadialProgress pct={returnPct} label="VS INICIAL" />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: 'rgba(244,237,230,0.4)' }}>
                        P&L: <span style={{ color: unrealizedPL >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                          {unrealizedPL >= 0 ? '+' : ''}R$ {fmt(unrealizedPL)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Posições abertas */}
                <div className="prf-card prf-projects-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 className="prf-section-title">Posições Abertas</h3>
                    <button className="prf-view-all-btn" onClick={() => setActiveNav('Negociação')}>
                      Negociar
                    </button>
                  </div>

                  {loadingWallet ? (
                    <p style={{ color: 'rgba(244,237,230,0.3)', fontSize: 13 }}>Carregando...</p>
                  ) : allocations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <p style={{ color: 'rgba(244,237,230,0.3)', fontSize: 13 }}>Nenhuma posição aberta.</p>
                      <button className="prf-view-all-btn" style={{ marginTop: 12 }} onClick={() => setActiveNav('Negociação')}>
                        Ir para Negociação →
                      </button>
                    </div>
                  ) : (
                    <div className="prf-projects-list">
                      {allocations.map(({ sym, pos, mktVal, pct, pl, plPct, color }) => (
                        <div key={sym} className="prf-project-row">
                          <div className="prf-project-accent" style={{ background: color }}></div>
                          <div className="prf-project-info">
                            <span className="prf-project-name">{sym}</span>
                            <span className="prf-project-meta">
                              {pos.qty} ações • PM R$ {fmt(pos.avgPrice)}
                            </span>
                          </div>
                          <div className="prf-project-right">
                            <div className="prf-mini-bar-wrap">
                              <div className="prf-mini-bar-fill" style={{ width: `${pct}%`, background: color }} />
                            </div>
                            <span className="prf-mini-bar-pct">{pct.toFixed(0)}%</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: pl >= 0 ? '#4ade80' : '#f87171', minWidth: 60, textAlign: 'right' }}>
                              {pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Col C */}
              <div className="prf-col-c">
                {/* Progresso da conta */}
                <div className="prf-card prf-onboard-card">
                  <div className="prf-onboard-header">
                    <span className="prf-label-mono">Progresso da Conta</span>
                    <span className="prf-onboard-pct">{accountProgress}%</span>
                  </div>
                  <div className="prf-onboard-score">{accountProgress}</div>
                  <div className="prf-onboard-track">
                    <div className="prf-onboard-fill" style={{ width: `${accountProgress}%`, transition: 'width 0.6s ease' }}></div>
                  </div>
                  <div className="prf-tasks-list">
                    {accountTasks.map((task, i) => (
                      <div key={i} className={`prf-task-item ${task.done ? 'prf-task-item--done' : ''}`} style={{ cursor: 'default' }}>
                        <div className={`prf-task-check ${task.done ? 'prf-task-check--done' : ''}`}>
                          {task.done && '✓'}
                        </div>
                        <span className="prf-task-label">{task.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alocação por ativo */}
                <div className="prf-card prf-alloc-card">
                  <span className="prf-label-mono prf-alloc-label-top">Alocação por Ativo</span>
                  {allocations.length === 0 ? (
                    <p style={{ color: 'rgba(244,237,230,0.3)', fontSize: 12, marginTop: 16, textAlign: 'center' }}>
                      Sem posições abertas
                    </p>
                  ) : (
                    <div className="prf-alloc-list">
                      {allocations.map(({ sym, pct, color }) => (
                        <div key={sym} className="prf-alloc-row">
                          <div className="prf-alloc-dot" style={{ background: color }}></div>
                          <span className="prf-alloc-lbl">{sym}</span>
                          <div className="prf-alloc-track">
                            <div className="prf-alloc-fill" style={{ width: `${pct}%`, background: color, transition: 'width 0.5s ease' }} />
                          </div>
                          <span className="prf-alloc-num">{pct.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
