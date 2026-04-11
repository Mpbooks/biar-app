// src/pages/Contact.jsx
import { useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import Navbar from '../components/Navbar'
import '../styles/contact.css'

export default function Contact() {
  const { t } = useLanguage()
  const scrollVideoRef = useRef()
  const scrollSectionRef = useRef()
  const spotlightRef = useRef()

  // ---------- Scroll-controlled video ----------
  useEffect(() => {
    const video = scrollVideoRef.current
    const section = scrollSectionRef.current
    if (!video || !section) return

    const isMobile = window.innerWidth <= 768
    video.src = isMobile ? '/images/sla_mobile.mp4' : '/images/sla_web.mp4'
    video.load()

    let isInView = false
    let videoTicking = false

    const observer = new IntersectionObserver(
      entries => { isInView = entries[0].isIntersecting },
      { threshold: 0 }
    )
    observer.observe(section)

    const updateVideoTime = () => {
      if (isInView && video.readyState >= 1) {
        const rect = section.getBoundingClientRect()
        const scrollEnd = rect.height - window.innerHeight
        if (scrollEnd > 0) {
          const progress = Math.max(0, Math.min(1, -rect.top / scrollEnd))
          if (!isNaN(video.duration) && video.duration > 0) {
            video.currentTime = video.duration * progress
          }
        }
      }
      videoTicking = false
    }

    const onScroll = () => {
      if (isInView && !videoTicking) {
        requestAnimationFrame(updateVideoTime)
        videoTicking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // ---------- Magic Bento + Spotlight ----------
  useEffect(() => {
    const spotlight = spotlightRef.current
    const section = document.getElementById('secao2-section')
    if (!section) return
    const cards = Array.from(section.querySelectorAll('.magic-bento-card'))
    if (!cards.length) return

    const PARTICLE_COUNT = window.innerWidth < 768 ? 8 : 12
    const SPOTLIGHT_RADIUS = 400
    let mouseX = 0, mouseY = 0, spotX = 0, spotY = 0, ticking = false

    const createParticle = (card) => {
      const { width, height } = card.getBoundingClientRect()
      const el = document.createElement('div')
      el.className = 'mb-particle'
      el.style.left = Math.random() * width + 'px'
      el.style.top = Math.random() * height + 'px'
      card.appendChild(el)
      const tx = (Math.random() - 0.5) * 100
      const ty = (Math.random() - 0.5) * 100
      const dur = 1800 + Math.random() * 1800
      el.animate(
        [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 0.9, offset: 0.15 },
          { transform: `translate(${tx}px,${ty}px) scale(0.7)`, opacity: 0.5, offset: 0.7 },
          { transform: `translate(${tx * 1.2}px,${ty * 1.2}px) scale(0)`, opacity: 0 }
        ],
        { duration: dur, easing: 'ease-out', fill: 'forwards' }
      ).finished.then(() => el.remove())
    }

    const updateSpotlight = () => {
      spotX += (mouseX - spotX) * 0.1
      spotY += (mouseY - spotY) * 0.1
      if (spotlight) {
        spotlight.style.left = spotX + 'px'
        spotlight.style.top = spotY + 'px'
      }

      const sectionRect = section.getBoundingClientRect()
      const insideSection =
        mouseX >= sectionRect.left && mouseX <= sectionRect.right &&
        mouseY >= sectionRect.top && mouseY <= sectionRect.bottom

      if (!insideSection) {
        if (spotlight) spotlight.style.opacity = '0'
        cards.forEach(c => c.style.setProperty('--glow-intensity', '0'))
        ticking = false
        return
      }

      let minDist = Infinity
      cards.forEach(card => {
        const cr = card.getBoundingClientRect()
        const cx = cr.left + cr.width / 2
        const cy = cr.top + cr.height / 2
        const raw = Math.hypot(mouseX - cx, mouseY - cy) - Math.max(cr.width, cr.height) / 2
        const dist = Math.max(0, raw)
        minDist = Math.min(minDist, dist)

        const intensity = dist <= 200 ? 1 : dist <= 320 ? (320 - dist) / 120 : 0
        card.style.setProperty('--glow-x', `${((mouseX - cr.left) / cr.width) * 100}%`)
        card.style.setProperty('--glow-y', `${((mouseY - cr.top) / cr.height) * 100}%`)
        card.style.setProperty('--glow-intensity', intensity.toFixed(3))
        card.style.setProperty('--glow-radius', `${SPOTLIGHT_RADIUS}px`)
      })

      if (spotlight) {
        const targetOpacity = minDist <= 200 ? 0.85 : minDist <= 320 ? ((320 - minDist) / 120) * 0.85 : 0
        spotlight.style.opacity = targetOpacity.toFixed(3)
      }
      ticking = false
    }

    const onMove = e => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!ticking) {
        requestAnimationFrame(updateSpotlight)
        ticking = true
      }
    }
    document.addEventListener('mousemove', onMove)

    const cleanups = cards.map(card => {
      let hovering = false
      const onEnter = () => {
        hovering = true
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          setTimeout(() => { if (hovering) createParticle(card) }, i * 80)
        }
      }
      const onLeave = () => { hovering = false }
      const onClick = e => {
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const maxDist = Math.max(
          Math.hypot(x, y), Math.hypot(x - rect.width, y),
          Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height)
        )
        const ripple = document.createElement('div')
        const d = maxDist * 2
        ripple.style.cssText = `position:absolute;width:${d}px;height:${d}px;border-radius:50%;background:radial-gradient(circle,rgba(244,237,230,0.45) 0%,rgba(244,237,230,0.2) 30%,transparent 70%);left:${x - maxDist}px;top:${y - maxDist}px;pointer-events:none;z-index:1000;`
        card.appendChild(ripple)
        ripple.animate(
          [{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }],
          { duration: 700, easing: 'ease-out', fill: 'forwards' }
        ).finished.then(() => ripple.remove())
      }
      card.addEventListener('mouseenter', onEnter)
      card.addEventListener('mouseleave', onLeave)
      card.addEventListener('click', onClick)
      return () => {
        card.removeEventListener('mouseenter', onEnter)
        card.removeEventListener('mouseleave', onLeave)
        card.removeEventListener('click', onClick)
      }
    })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cleanups.forEach(fn => fn())
    }
  }, [])

  return (
    <div className="contact-page">
      <div id="global-spotlight" ref={spotlightRef}></div>

      <div className="container1">
        <Navbar />

        {/* Seção 1 — scroll video */}
        <div id="scroll-section" ref={scrollSectionRef} style={{ height: '170vh', position: 'relative' }}>
          <section
            className="secao1"
            style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', margin: 0 }}
          >
            <video ref={scrollVideoRef} muted playsInline className="video-bg" />
            <div className="overlay"></div>
            <h1>{t('contact_title')}</h1>
          </section>
        </div>

        {/* Seção 2 — cards */}
        <section
          className="secao2"
          id="secao2-section"
          style={{ backgroundColor: 'transparent', position: 'relative', top: 0 }}
        >
          <div className="left2 magic-bento-card">
            <h2>BIAR</h2>
            <div className="contact-infos">
              <p>Ulica grada Vukovara 23</p>
              <p>10000 Zagreb, Croatia</p>
              <p>+385 (1) 63 87 451</p>
              <p>info@bosqar.com</p>
            </div>
          </div>

          <div className="right2 magic-bento-card">
            <h2>{t('contact_card2_title')}</h2>
            <div className="contact-infos">
              <p>{t('contact_card2_press')}</p>
              <p>press@bosqar.com</p>
              <p>Robin-Ivan Capar</p>
              <p>+47 412 06 576</p>
              <p>Nikolina Antolić</p>
              <p>+47 412 06 576</p>
            </div>
          </div>

          <div className="down magic-bento-card">
            <h2>{t('contact_card3_title')}</h2>
            <div className="contact-infos">
              <p>Martina Jelčić</p>
              <p>+385 99 348 9579</p>
              <p>ir@bosqar.com</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer>
          <video src="/images/sla_web.mp4" autoPlay muted loop playsInline />
          <h1>Biar Invest</h1>
          <p>{t('footer_rights')}</p>
        </footer>
      </div>
    </div>
  )
}