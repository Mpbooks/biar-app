// src/components/Preloader.jsx
import { useEffect, useState } from 'react'

export default function Preloader() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 500)
    return () => clearTimeout(t)
  }, [])

  if (hidden) return null

  return (
    <div id="preloader" className={hidden ? 'preloader-hidden' : ''}>
      <div className="loader-content">
        <div className="candle-wrapper">
          <div className="candle-chart">
            {Array.from({ length: 18 }).map((_, i) => <div key={i} className="candle"></div>)}
          </div>
        </div>
        <p>Created by: Paulo Wittor</p>
      </div>
    </div>
  )
}
