// src/components/AudioPlayer.jsx
import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAudio } from '../context/AudioContext'

/** Rotas que usam Navbar — em telas pequenas o som fica só no menu (canto some). */
const NAVBAR_ROUTES = new Set(['/', '/about', '/contact'])

export function SoundControlBar({ variant = 'corner', className = '' }) {
  const { isPlaying, isRepeat, isShuffle, setModalOpen, play, pause, toggleRepeat, toggleShuffle } = useAudio()

  return (
    <div
      className={`global-sound-control global-sound-control--${variant} ${isPlaying ? 'is-playing' : ''} ${className}`.trim()}
    >
      <div className="label-top">
        <span className="btn-custom-playlist" onClick={() => setModalOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}>
          New
        </span>
        <span>SOUND</span>
      </div>
      <div className="line-container">
        <div className="progress-line"></div>
      </div>
      <div className="controls" style={{ alignItems: 'center' }}>
        <button type="button" className={!isPlaying ? 'active' : ''} onClick={pause}>
          OFF
        </button>
        <div className="audio-toggles">
          <button type="button" className={isRepeat ? 'active' : ''} onClick={toggleRepeat} title="Repetir">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
          </button>
          <button type="button" className={isShuffle ? 'active' : ''} onClick={toggleShuffle} title="Aleatório">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
          </button>
        </div>
        <button type="button" className={isPlaying ? 'active' : ''} onClick={() => play(0)}>
          ON
        </button>
      </div>
    </div>
  )
}

export default function AudioPlayer() {
  const { modalOpen, customFiles, setModalOpen, addFiles, clearCustom } = useAudio()
  const fileInputRef = useRef()
  const location = useLocation()
  const path = location.pathname.replace(/\/$/, '') || '/'
  const cornerHiddenOnMobile = NAVBAR_ROUTES.has(path)

  const handleFiles = (e) => {
    if (e.target.files.length > 0) addFiles(Array.from(e.target.files))
  }

  return (
    <>
      <SoundControlBar variant="corner" className={cornerHiddenOnMobile ? 'global-sound-control--hide-corner-mobile' : ''} />

      <div className={`audio-modal-overlay ${modalOpen ? 'active' : ''}`}>
        <div className="audio-modal-content">
          <button type="button" className="audio-modal-close" onClick={() => setModalOpen(false)}>
            ✕
          </button>
          <h3>My Playlist</h3>
          <p>Upload your own music (mp3/wav) to override the default tracks. Files are stored on your device.</p>
          <input type="file" ref={fileInputRef} multiple accept="audio/*" style={{ display: 'none' }} onChange={handleFiles} />
          <div className="audio-upload-area" onClick={() => fileInputRef.current?.click()}>
            <span>Click here to select audio files</span>
          </div>
          <div className="audio-playlist-list">
            {customFiles.map((f, i) => (
              <div key={i}>🎵 {f.name}</div>
            ))}
          </div>
          {customFiles.length > 0 && (
            <button type="button" className="audio-btn-clear" onClick={clearCustom}>
              Reset to Default Music
            </button>
          )}
        </div>
      </div>
    </>
  )
}
