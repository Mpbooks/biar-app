import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as THREE from 'three'

export default function ChooseUsername() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const canvasRef = useRef(null)
  const inputRef = useRef(null)

  const email = searchParams.get('email')
  const googleId = searchParams.get('googleId')
  const name = searchParams.get('name')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const user = params.get('user')
    if (token && user) {
      localStorage.setItem('biar_token', token)
      localStorage.setItem('biar_user', user)
      navigate('/')
    }
  }, [])

  // Three.js scene
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 5

    // Floating particles
    const count = 120
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
      sizes[i] = Math.random() * 2 + 0.5
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#a78bfa') },
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.3 + position.x * 0.5) * 0.3;
          pos.x += cos(uTime * 0.2 + position.z * 0.4) * 0.2;
          vAlpha = 0.3 + 0.4 * sin(uTime * 0.5 + position.z);
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float alpha = (1.0 - d * 2.0) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    })

    const particles = new THREE.Points(geo, mat)
    scene.add(particles)

    // Thin grid lines
    const gridMat = new THREE.LineBasicMaterial({ color: '#2e1065', transparent: true, opacity: 0.15 })
    for (let i = -5; i <= 5; i++) {
      const hGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-10, i * 1.5, -2),
        new THREE.Vector3(10, i * 1.5, -2),
      ])
      const vGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * 2, -10, -2),
        new THREE.Vector3(i * 2, 10, -2),
      ])
      scene.add(new THREE.Line(hGeo, gridMat))
      scene.add(new THREE.Line(vGeo, gridMat))
    }

    let raf
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      mat.uniforms.uTime.value = clock.getElapsedTime()
      particles.rotation.z = clock.getElapsedTime() * 0.02
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const u = username.trim()
    if (!u) { setMessage('escolha um nome de usuário'); return }
    if (u.length < 3) { setMessage('mínimo 3 caracteres'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(u)) { setMessage('apenas letras, números e _'); return }
    if (password.length < 6) { setMessage('senha deve ter no mínimo 6 caracteres'); return }

    setLoading(true)
    setMessage('')
    try {
      const r = await fetch('/api/auth/google/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, email, googleId, password }),
      })
      const data = await r.json()
      if (!r.ok) {
        if (data.error === 'duplicate_user') setMessage('nome já está em uso')
        else setMessage('erro ao criar conta, tente novamente')
        return
      }
      setSubmitted(true)
      localStorage.setItem('biar_token', data.token)
      localStorage.setItem('biar_user', JSON.stringify(data.user))
      setTimeout(() => navigate('/'), 800)
    } catch {
      setMessage('erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cu-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background: #030009;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'Syne', sans-serif;
        }

        .cu-canvas {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        /* Radial glow behind card */
        .cu-glow {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .cu-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          padding: 56px 48px 48px;
          animation: cardIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .cu-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          color: #7c3aed;
          text-transform: uppercase;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cu-eyebrow::before {
          content: '';
          display: block;
          width: 24px;
          height: 1px;
          background: #7c3aed;
        }

        .cu-heading {
          font-size: clamp(28px, 5vw, 38px);
          font-weight: 800;
          color: #f5f0ff;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
        }

        .cu-sub {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 44px;
          letter-spacing: 0.01em;
        }
        .cu-sub span {
          color: #a78bfa;
        }

        .cu-field {
          position: relative;
          margin-bottom: 8px;
        }

        .cu-prefix {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          color: #7c3aed;
          pointer-events: none;
          transition: opacity 0.2s;
          opacity: 0.6;
        }

        .cu-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 4px;
          padding: 16px 16px 16px 36px;
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          color: #f5f0ff;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          letter-spacing: 0.03em;
        }
        .cu-input::placeholder {
          color: rgba(255,255,255,0.15);
        }
        .cu-input:focus {
          border-color: rgba(124,58,237,0.6);
          background: rgba(124,58,237,0.05);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
        }

        .cu-hint {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #4b5563;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
          padding-left: 4px;
        }

        .cu-error {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #f87171;
          letter-spacing: 0.05em;
          margin-bottom: 20px;
          padding-left: 4px;
          animation: shake 0.3s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0) }
          25% { transform: translateX(-4px) }
          75% { transform: translateX(4px) }
        }

        .cu-btn {
          width: 100%;
          padding: 16px;
          background: #7c3aed;
          border: none;
          border-radius: 4px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #fff;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background 0.2s, transform 0.15s;
        }
        .cu-btn:hover:not(:disabled) {
          background: #6d28d9;
          transform: translateY(-1px);
        }
        .cu-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .cu-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cu-btn-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.5s;
        }
        .cu-btn:hover .cu-btn-shine {
          transform: translateX(100%);
        }

        .cu-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .cu-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg) } }

        .cu-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          animation: cardIn 0.4s ease both;
        }
        .cu-success-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .cu-success-text {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #a78bfa;
          letter-spacing: 0.1em;
        }

        /* Thin bottom line accent */
        .cu-line {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #7c3aed, transparent);
          opacity: 0.4;
        }
      `}</style>

      <div className="cu-root">
        <canvas ref={canvasRef} className="cu-canvas" />
        <div className="cu-glow" />

        <div className="cu-card">
          {submitted ? (
            <div className="cu-success">
              <div className="cu-success-icon">✓</div>
              <p className="cu-success-text">entrando...</p>
            </div>
          ) : (
            <>
              <p className="cu-eyebrow">último passo</p>
              <h1 className="cu-heading">escolha seu<br />username</h1>
              {name ? (
                <p className="cu-sub">olá, <span>{name}</span> — falta só isso.</p>
              ) : (
                <p className="cu-sub">como quer ser chamado?</p>
              )}

              <form onSubmit={handleSubmit}>
                <div className="cu-field">
                  <span className="cu-prefix">@</span>
                  <input
                    ref={inputRef}
                    className="cu-input"
                    type="text"
                    placeholder="seu_usuario"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    autoFocus
                    maxLength={20}
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                <p className="cu-hint">letras, números e _ · máx. 20 caracteres</p>

                <div className="cu-field">
                  <span className="cu-prefix">#</span>
                  <input
                    className="cu-input"
                    type="password"
                    placeholder="sua_senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <p className="cu-hint" style={{ marginBottom: '32px' }}>mínimo 6 caracteres</p>

                {message && <p className="cu-error">{message}</p>}

                <button type="submit" className="cu-btn" disabled={loading}>
                  <span className="cu-btn-shine" />
                  <span className="cu-btn-inner">
                    {loading ? <span className="cu-spinner" /> : null}
                    {loading ? 'criando...' : 'continuar'}
                  </span>
                </button>
              </form>
            </>
          )}
        </div>

        <div className="cu-line" />
      </div>
    </>
  )
}