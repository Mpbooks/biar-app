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

  // Three.js scene com partículas em dourado
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 5

    // Partículas em dourado
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
        uColor: { value: new THREE.Color('#cdb89f') }, // Dourado do site
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

    // Grid lines em cor mais sutil
    const gridMat = new THREE.LineBasicMaterial({ color: '#cdb89f', transparent: true, opacity: 0.08 })
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
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cu-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'Montserrat', sans-serif;
        }

        .cu-canvas {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        /* Radial glow em dourado */
        .cu-glow {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(205, 184, 159, 0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .cu-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 460px;
          padding: 60px 48px;
          background: #0a0a0a;
          border: 1.5px solid rgba(205, 184, 159, 0.25);
          border-radius: 8px;
          animation: cardIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          box-shadow: 
            0 0 0 0 rgba(205, 184, 159, 0),
            0 8px 32px rgba(0, 0, 0, 0.4);
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .cu-eyebrow {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          letter-spacing: 2px;
          color: rgba(205, 184, 159, 0.6);
          text-transform: uppercase;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
        }
        .cu-eyebrow::before {
          content: '';
          display: block;
          width: 32px;
          height: 1.5px;
          background: linear-gradient(90deg, #cdb89f, #a89968);
        }

        .cu-heading {
          font-size: clamp(32px, 5vw, 42px);
          font-weight: 800;
          color: #F4EDE6;
          line-height: 1.15;
          letter-spacing: -1px;
          margin-bottom: 16px;
          font-family: 'Cinzel', serif;
        }

        .cu-sub {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: rgba(244, 237, 230, 0.55);
          margin-bottom: 48px;
          letter-spacing: 0.3px;
          line-height: 1.6;
        }
        .cu-sub span {
          color: #cdb89f;
          font-weight: 600;
        }

        .cu-field {
          position: relative;
          margin-bottom: 12px;
        }

        .cu-prefix {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'Montserrat', sans-serif;
          font-size: 15px;
          color: #cdb89f;
          pointer-events: none;
          transition: opacity 0.3s;
          font-weight: 600;
        }

        .cu-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(205, 184, 159, 0.15);
          border-radius: 6px;
          padding: 14px 16px 14px 40px;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          color: #F4EDE6;
          outline: none;
          transition: all 0.4s ease;
          letter-spacing: 0.3px;
          will-change: border-color, background, box-shadow;
        }
        .cu-input::placeholder {
          color: rgba(244, 237, 230, 0.2);
        }
        .cu-input:focus {
          border-color: rgba(205, 184, 159, 0.5);
          background: rgba(205, 184, 159, 0.04);
          box-shadow: 0 0 0 3px rgba(205, 184, 159, 0.06);
        }

        .cu-hint {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          color: rgba(244, 237, 230, 0.3);
          letter-spacing: 0.5px;
          margin-bottom: 20px;
          padding-left: 4px;
          font-weight: 500;
        }

        .cu-error {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #ff6b6b;
          letter-spacing: 0.3px;
          margin-bottom: 24px;
          padding-left: 4px;
          animation: shake 0.4s cubic-bezier(0.36, 0, 0.66, -0.56);
          font-weight: 500;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0) }
          25% { transform: translateX(-6px) }
          75% { transform: translateX(6px) }
        }

        .cu-btn {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #cdb89f 0%, #a89968 100%);
          border: none;
          border-radius: 6px;
          font-family: 'Montserrat', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #000;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
          will-change: transform, box-shadow;
          box-shadow: 0 4px 16px rgba(205, 184, 159, 0.15);
        }
        .cu-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(205, 184, 159, 0.25);
        }
        .cu-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .cu-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .cu-btn-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.15) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
          pointer-events: none;
        }
        .cu-btn:hover .cu-btn-shine {
          transform: translateX(100%);
        }

        .cu-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .cu-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg) } }

        .cu-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          animation: cardIn 0.6s ease both;
        }
        .cu-success-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(205, 184, 159, 0.1);
          border: 1.5px solid rgba(205, 184, 159, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #cdb89f;
          animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .cu-success-text {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(244, 237, 230, 0.6);
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 600;
        }

        /* Bottom line accent */
        .cu-line {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(205, 184, 159, 0.3), transparent);
          opacity: 0.8;
        }

        /* Responsividade */
        @media (max-width: 640px) {
          .cu-card {
            max-width: 90%;
            padding: 48px 32px;
            margin: 0 20px;
          }

          .cu-heading {
            font-size: 28px;
            margin-bottom: 12px;
          }

          .cu-sub {
            font-size: 13px;
            margin-bottom: 40px;
          }

          .cu-input {
            padding: 12px 14px 12px 36px;
            font-size: 13px;
          }

          .cu-btn {
            padding: 12px 20px;
            font-size: 12px;
          }

          .cu-success-icon {
            width: 48px;
            height: 48px;
            font-size: 24px;
          }

          .cu-eyebrow::before {
            width: 24px;
          }
        }
      `}</style>

      <div className="cu-root">
        <canvas ref={canvasRef} className="cu-canvas" />
        <div className="cu-glow" />

        <div className="cu-card">
          {submitted ? (
            <div className="cu-success">
              <div className="cu-success-icon">✓</div>
              <p className="cu-success-text">bem-vindo!</p>
            </div>
          ) : (
            <>
              <p className="cu-eyebrow">último passo</p>
              <h1 className="cu-heading">escolha seu username</h1>
              {name ? (
                <p className="cu-sub">olá, <span>{name}</span> — complete seu perfil.</p>
              ) : (
                <p className="cu-sub">como você gostaria de ser chamado?</p>
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
                <p className="cu-hint">letras, números e _ · máximo 20 caracteres</p>

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