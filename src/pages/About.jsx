// src/pages/About.jsx
import { useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import Navbar from '../components/Navbar'
import '../styles/about.css'

export default function About() {
  const { t } = useLanguage()
  const scrollVideoRef = useRef()
  const scrollSectionRef = useRef()

  // ---------- Scroll-controlled video (mantido) ----------
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

  // ---------- Intersection Observer para animações de entrada ----------
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!els.length) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
      }),
      { threshold: 0.12 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  // ---------- Hover spotlight nos cards ----------
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll('.team-card'))
    if (!cards.length) return

    const onMove = (e, card) => {
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      card.style.setProperty('--my', `${e.clientY - rect.top}px`)
    }

    const handlers = cards.map(card => {
      const fn = e => onMove(e, card)
      card.addEventListener('mousemove', fn)
      return { card, fn }
    })

    return () => handlers.forEach(({ card, fn }) => card.removeEventListener('mousemove', fn))
  }, [])

  const teamMembers = [
  { nameKey: 'about_p1_name', descKey: 'about_p1_desc', index: '01', image: '/images/animal.jpg' },
  { nameKey: 'about_p2_name', descKey: 'about_p2_desc', index: '02', image: '/images/animal2.jpg' },
  { nameKey: 'about_p3_name', descKey: 'about_p3_desc', index: '03', image: '/images/animal3.jpg' },
  { nameKey: 'about_p4_name', descKey: 'about_p4_desc', index: '04', image: '/images/animal4.jpg' },
  { nameKey: 'about_p5_name', descKey: 'about_p5_desc', index: '04', image: '/images/animal5.jpg' },
  { nameKey: 'about_p6_name', descKey: 'about_p6_desc', index: '04', image: '/images/animal6.jpg' },
  { nameKey: 'about_p7_name', descKey: 'about_p7_desc', index: '04', image: '/images/animal7.jpg' },
  { nameKey: 'about_p8_name', descKey: 'about_p8_desc', index: '04', image: '/images/animal8.jpg' },
]

  const values = [
    { titleKey: 'about_val1_title', descKey: 'about_val1_desc' },
    { titleKey: 'about_val2_title', descKey: 'about_val2_desc' },
    { titleKey: 'about_val3_title', descKey: 'about_val3_desc' },
  ]

  return (
    <div className="about-container">
      <Navbar />

      {/* ── HERO: scroll-controlled video (mantido) ── */}
      <div id="scroll-section" ref={scrollSectionRef}>
        <section className="hero-section">
          <video ref={scrollVideoRef} muted playsInline className="video-bg" />
          <div className="video-overlay" />
          <div className="hero-content">
            <span className="hero-eyebrow reveal">{t('about_purpose_tag')}</span>
            <h1 className="hero-title reveal">{t('about_title')}</h1>
          </div>
          <div className="hero-scroll-hint">
            <span />
          </div>
        </section>
      </div>

      {/* ── MANIFESTO ── */}
      <section className="manifesto-section">
        <div className="manifesto-inner">
          <div className="manifesto-label reveal">{t('about_purpose_tag')}</div>
          <h2 className="manifesto-headline reveal">
            {t('about_purpose_title_1')}{' '}
            <em>{t('about_purpose_title_2')}</em>{' '}
            {t('about_purpose_title_3')}{' '}
            <em>{t('about_purpose_title_4')}</em>
          </h2>

          {/* Stats strip */}
          <div className="stats-strip reveal">
            <div className="stat-item">
              <span className="stat-num">2021</span>
              <span className="stat-label">{t('about_stat1_label') || 'Fundação'}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">4</span>
              <span className="stat-label">{t('about_stat2_label') || 'Fundadores'}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">100%</span>
              <span className="stat-label">{t('about_stat3_label') || 'Independente'}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">BR</span>
              <span className="stat-label">{t('about_stat4_label') || 'Origem'}</span>
            </div>
          </div>

          <div className="values-grid">
            {values.map((v, i) => (
              <div key={i} className="value-block reveal" style={{ '--delay': `${i * 120}ms` }}>
                <div className="value-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="value-divider" />
                <h3 className="value-title">{t(v.titleKey)}</h3>
                <p className="value-desc">{t(v.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="team-section">
        <div className="team-header reveal">
          <div className="team-header-left">
            <span className="section-label">{t('about_team_tag')}</span>
            <h2 className="section-title">{t('about_team_title')}</h2>
          </div>
          <p className="team-desc">{t('about_team_desc')}</p>
        </div>

        <div className="team-grid">
          {teamMembers.map((person, idx) => (
            <div
              key={idx}
              className="team-card reveal"
              style={{ '--delay': `${idx * 80}ms` }}
            >
              <div className="card-spotlight" />
              <div className="card-image-wrap">
                <img src={person.image} alt={t(person.nameKey)} />
                <div className="card-image-overlay" />
              </div>
              <div className="card-body">
                <span className="card-index">{person.index}</span>
                <h3 className="card-name">{t(person.nameKey)}</h3>
                <p className="card-desc">{t(person.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── JOURNEY VIDEO ── */}
      <section className="journey-section">
        <video src="/images/background.mp4" autoPlay muted loop playsInline className="journey-video" />
        <div className="journey-overlay" />
        <div className="journey-content">
          <span className="section-label reveal">{t('about_journey_tag')}</span>
          <h2 className="journey-title reveal">
            {t('about_journey_title1')}{' '}
            <em>{t('about_journey_title2')}</em>{' '}
            {t('about_journey_title3')}
          </h2>
          <p className="journey-text reveal">{t('about_journey_desc')}</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="about-footer">
        <video src="/images/sla_web.mp4" autoPlay muted loop playsInline className="footer-video" />
        <div className="footer-overlay" />
        <div className="footer-content">
          <h1 className="footer-wordmark">Biar Invest</h1>
          <p className="footer-copy">{t('footer_rights')}</p>
        </div>
      </footer>
    </div>
  )
}