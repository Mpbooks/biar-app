// src/pages/Home.jsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Cookies from '../components/cookies'
import { useLanguage } from '../context/LanguageContext'
import '../styles/home.css'
import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl'

export default function Home() {
  const { t, lang } = useLanguage()
  const canvasRef = useRef()
  const dotCanvasRef = useRef()
  const particlesContainerRef = useRef()
  const [btcPrice, setBtcPrice] = useState('Carregando...')
  const [btcCurrency, setBtcCurrency] = useState('')
  const [dateStr, setDateStr] = useState('')

  // Date
  useEffect(() => {
    const d = new Date()
    setDateStr(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }))
  }, [])

  // BTC Price — reactive to language change
  useEffect(() => {
    const currencyMap = { pt: 'brl', en: 'usd', es: 'eur' }
    const localeMap   = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }
    const currency = currencyMap[lang] || 'brl'
    const locale   = localeMap[lang]   || 'pt-BR'
    const cacheKey = 'lastPrice_' + currency

    // 1. Mostrar imediatamente o cache da nova moeda (ou indicador de loading)
    const cached = localStorage.getItem(cacheKey)
    setBtcPrice(cached || 'Carregando...')
    setBtcCurrency(currency.toUpperCase())

    let cancelled = false

    const fetchPrice = async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency}`
        )
        if (!res.ok) throw new Error('API limit')
        const data = await res.json()
        const price = data.bitcoin[currency]
        if (!cancelled && price) {
          const formatted = price.toLocaleString(locale, {
            style: 'currency',
            currency: currency.toUpperCase(),
          })
          setBtcPrice(formatted)
          localStorage.setItem(cacheKey, formatted)
        }
      } catch {
        if (!cancelled) {
          // Mantém o cache que já foi exibido
          if (!cached) setBtcPrice('Indisponível')
        }
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 60000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [lang])

  // Dot canvas effect
  useEffect(() => {
    const canvas = dotCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const container = canvas.parentElement
    const dotConfig = { dotSize: 2, gap: 20, baseColor: '#555555', activeColor: '#F4EDE6', proximity: 100 }
    const hexToRgb = hex => { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : { r:85, g:85, b:85 } }
    const baseRgb = hexToRgb(dotConfig.baseColor), activeRgb = hexToRgb(dotConfig.activeColor)
    let dots = [], mouseLocal = { x: -1000, y: -1000 }, raf

    const init = () => {
      canvas.width = container.offsetWidth; canvas.height = container.offsetHeight; dots = []
      for (let x = 0; x < canvas.width; x += dotConfig.gap)
        for (let y = 0; y < canvas.height; y += dotConfig.gap)
          dots.push({ x, y })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      dots.forEach(dot => {
        const dx = mouseLocal.x - dot.x, dy = mouseLocal.y - dot.y, dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < dotConfig.proximity) {
          const ratio = 1 - dist / dotConfig.proximity
          ctx.fillStyle = `rgb(${Math.round(baseRgb.r+(activeRgb.r-baseRgb.r)*ratio)},${Math.round(baseRgb.g+(activeRgb.g-baseRgb.g)*ratio)},${Math.round(baseRgb.b+(activeRgb.b-baseRgb.b)*ratio)})`
        } else ctx.fillStyle = dotConfig.baseColor
        ctx.beginPath(); ctx.arc(dot.x, dot.y, dotConfig.dotSize, 0, Math.PI*2); ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }

    const onMove = e => { const rect = container.getBoundingClientRect(); mouseLocal.x = e.clientX-rect.left; mouseLocal.y = e.clientY-rect.top }
    window.addEventListener('mousemove', onMove); window.addEventListener('resize', init)
    init(); draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove); window.removeEventListener('resize', init) }
  }, [])


  // Particles (OGL)
  useEffect(() => {
    const container = particlesContainerRef.current
    if (!container) return
    const config = { particleCount: 200, particleSpread: 10, speed: 0.1, particleColors: ['#F4EDE6'], alphaParticles: true, particleBaseSize: 100, sizeRandomness: 1, cameraDistance: 20, disableRotation: false, pixelRatio: window.devicePixelRatio || 1 }
    const hexToRgb = hex => { hex=hex.replace(/^#/,''); if(hex.length===3)hex=hex.split('').map(c=>c+c).join(''); const int=parseInt(hex,16); return [((int>>16)&255)/255,((int>>8)&255)/255,(int&255)/255] }
    const vertex = `attribute vec3 position;attribute vec4 random;attribute vec3 color;uniform mat4 modelMatrix;uniform mat4 viewMatrix;uniform mat4 projectionMatrix;uniform float uTime;uniform float uSpread;uniform float uBaseSize;uniform float uSizeRandomness;varying vec4 vRandom;varying vec3 vColor;void main(){vRandom=random;vColor=color;vec3 pos=position*uSpread;pos.z*=10.0;vec4 mPos=modelMatrix*vec4(pos,1.0);float t=uTime;mPos.x+=sin(t*random.z+6.28*random.w)*mix(0.1,1.5,random.x);mPos.y+=sin(t*random.y+6.28*random.x)*mix(0.1,1.5,random.w);mPos.z+=sin(t*random.w+6.28*random.y)*mix(0.1,1.5,random.z);vec4 mvPos=viewMatrix*mPos;gl_PointSize=(uBaseSize*(1.0+uSizeRandomness*(random.x-0.5)))/length(mvPos.xyz);gl_Position=projectionMatrix*mvPos;}`
    const fragment = `precision highp float;uniform float uTime;uniform float uAlphaParticles;varying vec4 vRandom;varying vec3 vColor;void main(){vec2 uv=gl_PointCoord.xy;float d=length(uv-vec2(0.5));if(uAlphaParticles<0.5){if(d>0.5)discard;gl_FragColor=vec4(vColor+0.2*sin(uv.yxx+uTime+vRandom.y*6.28),1.0);}else{float circle=smoothstep(0.5,0.4,d)*0.8;gl_FragColor=vec4(vColor+0.2*sin(uv.yxx+uTime+vRandom.y*6.28),circle);}}`

    const renderer = new Renderer({ dpr: config.pixelRatio, depth: false, alpha: true })
    const gl = renderer.gl
    container.appendChild(gl.canvas)
    const camera = new Camera(gl, { fov: 15 })
    camera.position.set(0, 0, config.cameraDistance)

    const resize = () => { renderer.setSize(window.innerWidth, window.innerHeight); camera.perspective({ aspect: gl.canvas.width/gl.canvas.height }) }
    window.addEventListener('resize', resize); resize()

    const count = config.particleCount
    const positions = new Float32Array(count*3), randoms = new Float32Array(count*4), colors = new Float32Array(count*3)
    for(let i=0;i<count;i++){let x,y,z,len;do{x=Math.random()*2-1;y=Math.random()*2-1;z=Math.random()*2-1;len=x*x+y*y+z*z}while(len>1||len===0);const r=Math.cbrt(Math.random());positions.set([x*r,y*r,z*r],i*3);randoms.set([Math.random(),Math.random(),Math.random(),Math.random()],i*4);colors.set(hexToRgb(config.particleColors[0]),i*3)}

    const geometry = new Geometry(gl,{position:{size:3,data:positions},random:{size:4,data:randoms},color:{size:3,data:colors}})
    const program = new Program(gl,{vertex,fragment,uniforms:{uTime:{value:0},uSpread:{value:config.particleSpread},uBaseSize:{value:config.particleBaseSize*config.pixelRatio},uSizeRandomness:{value:config.sizeRandomness},uAlphaParticles:{value:1}},transparent:true,depthTest:false})
    const particles = new Mesh(gl,{mode:gl.POINTS,geometry,program})
    let lastTime=performance.now(),elapsed=0,raf

    const update = t => {
      raf=requestAnimationFrame(update)
      const delta=t-lastTime;lastTime=t;elapsed+=delta*config.speed
      program.uniforms.uTime.value=elapsed*0.001
      if(!config.disableRotation){particles.rotation.x=Math.sin(elapsed*0.0002)*0.1;particles.rotation.y=Math.cos(elapsed*0.0005)*0.15;particles.rotation.z+=0.01*config.speed}
      renderer.render({scene:particles,camera})
    }
    raf=requestAnimationFrame(update)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); if(container.contains(gl.canvas))container.removeChild(gl.canvas) }
  }, [])

  return (
    <>
      <div id="particles-container" ref={particlesContainerRef}></div>

      <div className="container">
        <div className="video-background">
          <div className="overlay"></div>
          <video autoPlay muted loop playsInline id="bg-video">
            <source src="/images/modelo.mp4" type="video/mp4" />
          </video>
        </div>

        <Navbar />

        <div className="left">
          <div className="texts">
            <h1 className="title text-blur">{t('title')}</h1>
            <p className="info text-left">{t('main_text')}</p>
          </div>
        </div>

        <div className="right">
          <div className="cripto-card aparecer">
            <canvas ref={dotCanvasRef} id="dot-canvas"></canvas>
            <h2>{t('card_title')}</h2>
            <span id="btc-price">
              {btcPrice}
              {btcCurrency && (
                <small style={{ fontSize: '0.5em', marginLeft: '6px', opacity: 0.5 }}>
                  {btcCurrency}
                </small>
              )}
            </span>
            <p id="current-date">{dateStr}</p>
          </div>
        </div>

        <div className="icons">
          <a href="https://github.com/Mpbooks" target="_blank" rel="noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
            </svg>
          </a>
          <a href="/">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/>
            </svg>
          </a>
        </div>

       <Cookies />
      </div>
    </>
  )
}
