// src/pages/About.jsx
// Laser shader removido para performance — About usa scroll-video + team bento + journey video
import { useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import Navbar from '../components/Navbar'
import '../styles/about.css'

export default function About() {
  const { t } = useLanguage()
  const scrollVideoRef = useRef()
  const scrollSectionRef = useRef()
  const spotlightRef = useRef()

  // ---------- Scroll-controlled video (igual Contact.jsx) ----------
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

  // ---------- Magic Bento (team cards) ----------
  useEffect(() => {
    const spotlight = spotlightRef.current
    const cards = Array.from(document.querySelectorAll('.parte2 .magic-bento-card'))
    if (!cards.length) return

    const PARTICLE_COUNT = window.innerWidth < 768 ? 6 : 12
    let mouseX = 0, mouseY = 0, spotX = 0, spotY = 0, ticking = false

    const createParticle = (card) => {
      const { width, height } = card.getBoundingClientRect()
      const el = document.createElement('div')
      el.className = 'mb-particle'
      el.style.left = Math.random() * width + 'px'
      el.style.top = Math.random() * height + 'px'
      card.appendChild(el)
      const tx = (Math.random() - 0.5) * 90
      const ty = (Math.random() - 0.5) * 90
      const dur = 1800 + Math.random() * 1800
      el.animate(
        [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 0.9, offset: 0.15 },
          { transform: `translate(${tx}px,${ty}px) scale(0.8)`, opacity: 0.4, offset: 0.7 },
          { transform: `translate(${tx * 1.3}px,${ty * 1.3}px) scale(0)`, opacity: 0 }
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

      let minDist = Infinity
      cards.forEach(card => {
        const cr = card.getBoundingClientRect()
        const dist = Math.max(
          0,
          Math.hypot(mouseX - (cr.left + cr.width / 2), mouseY - (cr.top + cr.height / 2))
          - Math.max(cr.width, cr.height) / 2
        )
        minDist = Math.min(minDist, dist)
        const intensity = dist <= 200 ? 1 : dist <= 320 ? (320 - dist) / 120 : 0
        card.style.setProperty('--glow-x', `${((mouseX - cr.left) / cr.width) * 100}%`)
        card.style.setProperty('--glow-y', `${((mouseY - cr.top) / cr.height) * 100}%`)
        card.style.setProperty('--glow-intensity', intensity.toFixed(3))
      })

      if (spotlight) {
        spotlight.style.opacity = (
          minDist <= 200 ? 0.85 : minDist <= 320 ? ((320 - minDist) / 120) * 0.85 : 0
        ).toFixed(3)
      }
      ticking = false
    }

    const onMove = e => {
      mouseX = e.clientX; mouseY = e.clientY
      if (!ticking) { requestAnimationFrame(updateSpotlight); ticking = true }
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
      card.addEventListener('mouseenter', onEnter)
      card.addEventListener('mouseleave', onLeave)
      return () => { card.removeEventListener('mouseenter', onEnter); card.removeEventListener('mouseleave', onLeave) }
    })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cleanups.forEach(fn => fn())
    }
  }, [])

  const teamMembers = [
    { nameKey: 'about_p1_name', descKey: 'about_p1_desc' },
    { nameKey: 'about_p2_name', descKey: 'about_p2_desc' },
    { nameKey: 'about_p3_name', descKey: 'about_p3_desc' },
    { nameKey: 'about_p4_name', descKey: 'about_p4_desc' },
  ]

  return (
    <div className="about-container">
      <div id="global-spotlight" ref={spotlightRef}></div>
      <Navbar />

      {/* === SECTION 1: Scroll-video header (mesmo padrão que Contact) === */}
      <div id="scroll-section" ref={scrollSectionRef} style={{ position: 'relative' }}>
        <section
          className="secao1"
          style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', margin: 0 }}
        >
          <video ref={scrollVideoRef} muted playsInline className="video-bg" />
          <div className="overlay"></div>
          <h1>{t('about_title')}</h1>
        </section>
      </div>

      {/* === SECTION 2: Mission & Values === */}
      <section className="mission-values">
        <div className="mission-content">
          <div className="mission-left">
            <p className="tagline">{t('about_purpose_tag')}</p>
            <h2 className="title-large">
              {t('about_purpose_title_1')}{' '}
              <span className="highlight">{t('about_purpose_title_2')}</span>{' '}
              {t('about_purpose_title_3')}{' '}
              <span className="highlight">{t('about_purpose_title_4')}</span>
            </h2>
          </div>
          <div className="mission-right">
            <div className="value-item">
              <h3>{t('about_val1_title')}</h3>
              <p>{t('about_val1_desc')}</p>
            </div>
            <div className="value-item">
              <h3>{t('about_val2_title')}</h3>
              <p>{t('about_val2_desc')}</p>
            </div>
            <div className="value-item">
              <h3>{t('about_val3_title')}</h3>
              <p>{t('about_val3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* === SECTION 3: Team Bento === */}
      <section className="section2" id="secao2-section">
        <div className="parte1">
          <div className="left2">
            <p>{t('about_team_tag')}</p>
            <h1>{t('about_team_title')}</h1>
          </div>
          <div className="right2">
            <p>{t('about_team_desc')}</p>
          </div>
        </div>

        <div className="parte2">
          {teamMembers.map((person, idx) => (
            <div key={idx} className="card magic-bento-card">
              <div className="text"><h2>{t(person.nameKey)}</h2></div>
              <div className="icon">
                <img src="/images/Exeplo-pessoa.jpg" alt={t(person.nameKey)} />
              </div>
              <div className="card-infos"><p>{t(person.descKey)}</p></div>
            </div>
          ))}
        </div>

        {/* === Journey video === */}
        <div className="parte3">
          <video src="/images/background.mp4" autoPlay muted loop playsInline />
          <div className="history-overlay">
            <div className="history-content">
              <p className="tagline">{t('about_journey_tag')}</p>
              <h2 className="history-title">
                {t('about_journey_title1')}{' '}
                <span className="highlight">{t('about_journey_title2')}</span>{' '}
                {t('about_journey_title3')}
              </h2>
              <p className="history-text">{t('about_journey_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="about-footer">
        <video src="/images/sla_web.mp4" autoPlay muted loop playsInline />
        <p>{t('footer_rights')}</p>
        <h1>Biar Invest</h1>
      </footer>
    </div>
  )
}
