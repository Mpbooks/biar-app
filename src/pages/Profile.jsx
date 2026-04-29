// src/pages/Profile.jsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../styles/profile.css'
import WalletTab from '../components/WalletTab'

// ── Data ───────────────────────────────────────────────────
const NAV_ITEMS = ['Dashboard', 'Cotas', 'Projetos', 'Carteira', 'Histórico', 'Suporte']

const WEEKLY_BARS = [
  { day: 'D', h: 38 }, { day: 'S', h: 55 }, { day: 'T', h: 42 },
  { day: 'Q', h: 82, active: true }, { day: 'Q', h: 67 },
  { day: 'S', h: 71 }, { day: 'S', h: 48 },
]

const PROJECTS = [
  { id: 1, title: 'Residencial Horizonte', tag: 'Imobiliário',    roi: '14,2% a.a', color: '#cdb89f', progress: 72 },
  { id: 2, title: 'Energia Solar SP',      tag: 'Sustentável',    roi: '18,7% a.a', color: '#a89968', progress: 41 },
  { id: 3, title: 'Hub Logístico Norte',   tag: 'Infraestrutura', roi: '11,5% a.a', color: '#8a7a5a', progress: 89 },
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
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(244,237,230,0.1)" strokeWidth="8" />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke="url(#radialGrad)" strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 60 60)"
        className="prf-radial-arc"
      />
      <defs>
        <linearGradient id="radialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cdb89f" />
          <stop offset="100%" stopColor="#a89968" />
        </linearGradient>
      </defs>
      <text x="60" y="55" textAnchor="middle" fontSize="20" fontWeight="700" fill="#F4EDE6">{pct}%</text>
      <text x="60" y="72" textAnchor="middle" fontSize="9"  fill="rgba(244,237,230,0.4)" letterSpacing="0.5">META ANUAL</text>
    </svg>
  )
}

// ── Map Component com Leaflet ────────────────────────────────────────
function MapCard() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [location, setLocation] = useState({ 
    city: 'Obtendo localização...', 
    region: 'Brasil', 
    lat: -23.5505, 
    lng: -46.6333 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initMap = (lat, lng) => {
      if (!mapRef.current || mapInstanceRef.current || !window.L) return;

      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false, // Começa desativado para não atrapalhar a rolagem da página
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // --- LOGICA DE FOCO PARA ZOOM ---
      // Ativa o zoom por scroll apenas quando o usuário clica no mapa
      map.on('focus', () => {
        map.scrollWheelZoom.enable();
      });

      // Desativa o zoom quando o mouse sai, permitindo rolar a página novamente
      map.on('blur', () => {
        map.scrollWheelZoom.disable();
      });

      // Marcador
      const markerDiv = document.createElement('div');
      markerDiv.className = 'prf-user-marker';
      L.marker([lat, lng], {
        icon: L.divIcon({
          html: markerDiv.outerHTML,
          className: 'prf-marker-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);

      mapInstanceRef.current = map;
    };

    const loadResources = () => {
      if (!document.querySelector('link[href*="leaflet.min.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.async = true;
        script.onload = () => handleGeolocation();
        document.body.appendChild(script);
      } else {
        handleGeolocation();
      }
    };

    const handleGeolocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
              .then(res => res.json())
              .then(data => {
                const city = data.address?.city || data.address?.town || 'Localização obtida';
                const region = data.address?.state || 'Brasil';
                setLocation({ city, region, lat: latitude, lng: longitude });
                setLoading(false);
                initMap(latitude, longitude);
              })
              .catch(() => {
                setLoading(false);
                initMap(latitude, longitude);
              });
          },
          () => {
            setLoading(false);
            initMap(location.lat, location.lng);
          }
        );
      } else {
        setLoading(false);
        initMap(location.lat, location.lng);
      }
    };

    loadResources();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="prf-globe-card prf-card">
      <div className="prf-card-header-mono">
        <span className="prf-label-mono">Live Location</span>
        <div className="prf-live-dot"></div>
      </div>
      <div 
        ref={mapRef} 
        className="prf-map-container" 
        style={{ 
          height: '200px', 
          width: '100%', 
          borderRadius: '12px', 
          marginTop: '15px',
          position: 'relative',
          zIndex: 5,
          outline: 'none' // Importante para o evento de focus funcionar
        }}
        tabIndex="0" // Permite que a div receba foco ao ser clicada
      ></div>
      <div className="prf-globe-info">
        <p className="prf-globe-city">{loading ? '📍 Carregando...' : location.city}</p>
        <p className="prf-globe-region">{location.region}</p>
      </div>
    </div>
  );
}

// ── Profile Component ───────────────────────────────────
export default function Profile() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [tasks, setTasks] = useState(TASKS)
  const [user, setUser] = useState(null)
  const [wallet, setWallet] = useState(null)
  const fileInputRef = useRef(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        uploadAvatar(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (base64Image) => {
    try {
      const token = localStorage.getItem('biar_token');
      const base = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${base}/api/user/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: base64Image })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, avatar: data.avatar };
        setUser(updatedUser);
        localStorage.setItem('biar_user', JSON.stringify(updatedUser));
      } else {
        alert('Erro ao atualizar foto');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar foto');
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('biar_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  useEffect(() => {
    const fetchProfileWallet = async () => {
      try {
        const token = localStorage.getItem('biar_token')
        if (!token) return
        const base = import.meta.env.VITE_API_URL || ''
        const res = await fetch(`${base}/api/wallet`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setWallet(data)
        }
      } catch (err) {
        console.error(err)
      }
    }
    if (activeNav === 'Dashboard') {
      fetchProfileWallet()
    }
  }, [activeNav])

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const formatMemberSince = (dateString) => {
    if (!dateString) return 'Mar 2022'
    const d = new Date(dateString)
    const m = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    const y = d.getFullYear()
    return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + y
  }

  const displayName = user?.username || 'Usuário'
  const memberSince = formatMemberSince(user?.createdAt)

  const userAvatar = user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=88&h=88&fit=crop"
  const userAvatarMini = user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop"

  return (
    <div className="prf-root">
      {/* ── NAVBAR Original mantido ─────────────────────────────────────── */}
      <header className="prf-header">
        <Link to="/" className="prf-logo">
          <img src="/images/logo_biar2.png" alt="BIAR" className="prf-logo-img" />
          <span className="prf-logo-name">BIAR</span>
        </Link>

        <nav className="prf-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              className={`prf-nav-btn ${activeNav === item ? 'prf-nav-btn--active' : ''}`}
              onClick={() => setActiveNav(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="prf-header-actions">
          <button className="prf-icon-btn" title="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          <button className="prf-icon-btn" title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div className="prf-notif-dot"></div>
          </button>

          <div className="prf-avatar-mini">
            <img src={userAvatarMini} alt="Avatar" />
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="prf-main">
        {activeNav === 'Dashboard' ? (
          <>
            {/* Welcome Row */}
            <div className="prf-welcome-row">
          <div>
            <div className="prf-welcome-eyebrow">
              <span className="prf-welcome-line"></span>
              Bem-vindo de volta
            </div>
            <h1 className="prf-welcome-h1">{displayName}</h1>
            <div className="prf-tags-row">
              <span className="prf-tag">Investidor Ativo</span>
              <span className="prf-tag prf-tag--accent">Alto Potencial</span>
              <span className="prf-tag">Portfólio Premium</span>
            </div>
          </div>

          <div className="prf-welcome-stats">
            <div className="prf-stat">
              <div className="prf-stat-num">
                {wallet ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(wallet.balance) : 'R$ ---'}
              </div>
              <div className="prf-stat-label">Saldo em Conta</div>
            </div>
            <div className="prf-stat-divider"></div>
            <div className="prf-stat">
              <div className="prf-stat-num">+18,4%</div>
              <div className="prf-stat-label">Retorno YTD</div>
            </div>
            <div className="prf-stat-divider"></div>
            <div className="prf-stat">
              <div className="prf-stat-num">
                {wallet?.positions ? Object.keys(wallet.positions).length : 0}
              </div>
              <div className="prf-stat-label">Ativos Diferentes</div>
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="prf-bento">
          {/* Col A - Left Column */}
          <div className="prf-col-a">
            {/* Map */}
            <MapCard />

            {/* Profile Card */}
            <div className="prf-card prf-profile-card">
              <div className="prf-avatar-wrap" onClick={handleAvatarClick} style={{ cursor: 'pointer', position: 'relative' }}>
                <img src={userAvatar} alt="Profile" className="prf-avatar-img" />
                <div className="prf-status-dot"></div>
                <div className="prf-avatar-overlay" style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                  background: 'rgba(0,0,0,0.5)', borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  opacity: 0, transition: 'opacity 0.2s', color: '#fff', fontSize: '12px', fontWeight: 'bold'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                >
                  Alterar
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              <h2 className="prf-profile-name">{displayName}</h2>
              <p className="prf-profile-role">Investidora Institucional</p>
              <div className="prf-profile-info">
                <div className="prf-profile-info-row">
                  <span>Conta:</span>
                  <strong>Premium Plus</strong>
                </div>
                <div className="prf-profile-info-row">
                  <span>Membro desde:</span>
                  <strong>{memberSince}</strong>
                </div>
                <div className="prf-profile-info-row">
                  <span>Verificação:</span>
                  <strong>100%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Col B - Center Column */}
          <div>
            {/* Activity & Tracker Row */}
            <div className="prf-row-top">
              {/* Activity */}
              <div className="prf-card prf-activity-card">
                <span className="prf-label-mono">Atividade Semanal</span>
                <div className="prf-activity-bars">
                  {WEEKLY_BARS.map((bar, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        className={`prf-bar ${bar.active ? 'prf-bar--active' : ''}`}
                        style={{ height: `${bar.h}px` }}
                      />
                      <span className="prf-bar-day">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracker */}
              <div className="prf-card prf-tracker-card">
                <span className="prf-label-mono">Meta Anual</span>
                <div className="prf-tracker-body">
                  <RadialProgress pct={62} />
                </div>
              </div>
            </div>

            {/* Projects */}
            <div className="prf-card prf-projects-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="prf-section-title">Portfólio</h3>
                <button className="prf-view-all-btn" onClick={() => setActiveNav('Carteira')}>Ver Carteira</button>
              </div>
              <div className="prf-projects-list">
                {wallet && wallet.positions && Object.keys(wallet.positions).length > 0 ? (
                  Object.entries(wallet.positions).map(([sym, data]) => {
                    const totalValue = data.qty * data.avgPrice;
                    return (
                      <div key={sym} className="prf-project-row">
                        <div className="prf-project-accent" style={{ background: '#cdb89f' }}></div>
                        <div className="prf-project-info">
                          <span className="prf-project-name">{sym}</span>
                          <span className="prf-project-meta">Preço Médio: <strong>R$ {data.avgPrice.toFixed(2)}</strong></span>
                        </div>
                        <div className="prf-project-right">
                          <div style={{ textAlign: 'right', marginRight: '15px' }}>
                            <div style={{ color: '#F4EDE6', fontWeight: 'bold' }}>{data.qty} cotas</div>
                            <div style={{ color: 'rgba(244,237,230,0.5)', fontSize: '11px' }}>R$ {totalValue.toFixed(2)}</div>
                          </div>
                          <button className="prf-project-btn" onClick={() => setActiveNav('Carteira')}>Negociar</button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p style={{ color: 'rgba(244,237,230,0.5)', fontSize: '13px' }}>Você ainda não comprou nenhuma ação.</p>
                )}
              </div>
            </div>
          </div>

          {/* Col C - Right Column */}
          <div className="prf-col-c">
            {/* Onboarding */}
            <div className="prf-card prf-onboard-card">
              <div className="prf-onboard-header">
                <span className="prf-label-mono">Progresso</span>
                <span className="prf-onboard-pct">60%</span>
              </div>
              <div className="prf-onboard-score">60</div>
              <div className="prf-onboard-track">
                <div className="prf-onboard-fill" style={{ width: '60%' }}></div>
              </div>
              <div className="prf-tasks-list">
                {tasks.map(task => (
                  <button
                    key={task.id}
                    className={`prf-task-item ${task.done ? 'prf-task-item--done' : ''}`}
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className={`prf-task-check ${task.done ? 'prf-task-check--done' : ''}`}>
                      {task.done && '✓'}
                    </div>
                    <span className="prf-task-label">{task.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Allocations */}
            <div className="prf-card prf-alloc-card">
              <span className="prf-label-mono prf-alloc-label-top">Alocação de Ativos</span>
              <div className="prf-alloc-list">
                <div className="prf-alloc-row">
                  <div className="prf-alloc-dot"></div>
                  <span className="prf-alloc-lbl">Imobiliário</span>
                  <div className="prf-alloc-track">
                    <div className="prf-alloc-fill" style={{ width: '45%' }} />
                  </div>
                  <span className="prf-alloc-num">45%</span>
                </div>
                <div className="prf-alloc-row">
                  <div className="prf-alloc-dot"></div>
                  <span className="prf-alloc-lbl">Infraestrutura</span>
                  <div className="prf-alloc-track">
                    <div className="prf-alloc-fill" style={{ width: '30%' }} />
                  </div>
                  <span className="prf-alloc-num">30%</span>
                </div>
                <div className="prf-alloc-row">
                  <div className="prf-alloc-dot"></div>
                  <span className="prf-alloc-lbl">Sustentável</span>
                  <div className="prf-alloc-track">
                    <div className="prf-alloc-fill" style={{ width: '25%' }} />
                  </div>
                  <span className="prf-alloc-num">25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        ) : activeNav === 'Carteira' ? (
          <WalletTab />
        ) : (
          <div className="prf-card" style={{ textAlign: 'center', padding: '100px 0' }}>
            <h2 className="prf-welcome-h1" style={{ color: 'rgba(244,237,230,0.5)' }}>Em breve</h2>
          </div>
        )}
      </main>
    </div>
  )
}
