// src/components/LightPillar.jsx
// Reusable Three.js Light Pillar Effect used on Login, Register, and 404 pages
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Shared fragment shader code
const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`

const buildFragmentShader = (precision, stepMultiplier, iterations, waveIterations) => `
  precision ${precision} float;
  uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse;
  uniform vec3 uTopColor; uniform vec3 uBottomColor;
  uniform float uIntensity; uniform bool uInteractive; uniform float uGlowAmount;
  uniform float uPillarWidth; uniform float uPillarHeight; uniform float uNoiseIntensity;
  uniform float uRotCos; uniform float uRotSin; uniform float uPillarRotCos; uniform float uPillarRotSin;
  uniform float uWaveSin; uniform float uWaveCos;
  varying vec2 vUv;
  const float STEP_MULT = ${stepMultiplier.toFixed(1)};
  const int MAX_ITER = ${iterations};
  const int WAVE_ITER = ${waveIterations};
  void main() {
    vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
    uv = vec2(uPillarRotCos * uv.x - uPillarRotSin * uv.y, uPillarRotSin * uv.x + uPillarRotCos * uv.y);
    vec3 ro = vec3(0.0, 0.0, -10.0); vec3 rd = normalize(vec3(uv, 1.0));
    float rotC = uRotCos; float rotS = uRotSin;
    if(uInteractive && (uMouse.x != 0.0 || uMouse.y != 0.0)) { float a = uMouse.x * 6.283185; rotC = cos(a); rotS = sin(a); }
    vec3 col = vec3(0.0); float t = 0.1;
    for(int i = 0; i < MAX_ITER; i++) {
      vec3 p = ro + rd * t; p.xz = vec2(rotC * p.x - rotS * p.z, rotS * p.x + rotC * p.z);
      vec3 q = p; q.y = p.y * uPillarHeight + uTime;
      float freq = 1.0; float amp = 1.0;
      for(int j = 0; j < WAVE_ITER; j++) {
        q.xz = vec2(uWaveCos * q.x - uWaveSin * q.z, uWaveSin * q.x + uWaveCos * q.z);
        q += cos(q.zxy * freq - uTime * float(j) * 2.0) * amp; freq *= 2.0; amp *= 0.5;
      }
      float d = length(cos(q.xz)) - 0.2; float bound = length(p.xz) - uPillarWidth;
      float k = 4.0; float h = max(k - abs(d - bound), 0.0);
      d = max(d, bound) + h * h * 0.0625 / k; d = abs(d) * 0.15 + 0.01;
      float grad = clamp((15.0 - p.y) / 30.0, 0.0, 1.0);
      col += mix(uBottomColor, uTopColor, grad) / d;
      t += d * STEP_MULT; if(t > 50.0) break;
    }
    float widthNorm = uPillarWidth / 3.0; col = tanh(col * uGlowAmount / widthNorm);
    col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`

export default function LightPillar({ topColor = '#5227FF', bottomColor = '#FF9FFC', intensity = 0.8, rotationSpeed = 0.4, interactive = false, pillarRotation = 45, pillarWidth = 3.1, pillarHeight = 0.45 }) {
  const containerRef = useRef()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isLow = isMobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    const quality = isMobile ? 'low' : isLow ? 'medium' : 'high'
    const settings = {
      low: { iterations: 24, waveIterations: 1, pixelRatio: 0.5, precision: 'mediump', stepMultiplier: 1.5 },
      medium: { iterations: 40, waveIterations: 2, pixelRatio: 0.65, precision: 'mediump', stepMultiplier: 1.2 },
      high: { iterations: 80, waveIterations: 4, pixelRatio: Math.min(window.devicePixelRatio, 2), precision: 'highp', stepMultiplier: 1.0 }
    }[quality]

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: quality === 'high' ? 'high-performance' : 'low-power', precision: settings.precision, stencil: false, depth: false })
    } catch (e) { return }

    const width = container.clientWidth, height = container.clientHeight
    renderer.setSize(width, height)
    renderer.setPixelRatio(settings.pixelRatio)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const parseColor = hex => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b) }
    const pillarRotRad = (pillarRotation * Math.PI) / 180

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: buildFragmentShader(settings.precision, settings.stepMultiplier, settings.iterations, settings.waveIterations),
      uniforms: {
        uTime: { value: 0 }, uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uTopColor: { value: parseColor(topColor) }, uBottomColor: { value: parseColor(bottomColor) },
        uIntensity: { value: intensity }, uInteractive: { value: interactive },
        uGlowAmount: { value: 0.005 }, uPillarWidth: { value: pillarWidth },
        uPillarHeight: { value: pillarHeight }, uNoiseIntensity: { value: 0.5 },
        uRotCos: { value: 1.0 }, uRotSin: { value: 0.0 },
        uPillarRotCos: { value: Math.cos(pillarRotRad) }, uPillarRotSin: { value: Math.sin(pillarRotRad) },
        uWaveSin: { value: Math.sin(0.4) }, uWaveCos: { value: Math.cos(0.4) }
      },
      transparent: true, depthWrite: false, depthTest: false
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    scene.add(mesh)

    let time = 0, lastTime = performance.now(), raf

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight
      renderer.setSize(w, h); material.uniforms.uResolution.value.set(w, h)
    }
    window.addEventListener('resize', onResize, { passive: true })

    if (interactive) {
      window.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect()
        material.uniforms.uMouse.value.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      }, { passive: true })
    }

    const animate = (currentTime = performance.now()) => {
      raf = requestAnimationFrame(animate)
      const delta = currentTime - lastTime
      const fps = quality === 'low' ? 30 : 60
      if (delta >= 1000 / fps) {
        time += 0.016 * rotationSpeed
        material.uniforms.uTime.value = time
        material.uniforms.uRotCos.value = Math.cos(time * 0.3)
        material.uniforms.uRotSin.value = Math.sin(time * 0.3)
        renderer.render(scene, camera)
        lastTime = currentTime - (delta % (1000 / fps))
      }
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
    }
  }, [topColor, bottomColor, intensity, rotationSpeed, interactive, pillarRotation, pillarWidth, pillarHeight])

  return <div ref={containerRef} className="light-pillar-container"></div>
}
