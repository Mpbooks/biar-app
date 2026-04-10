// src/context/AudioContext.jsx
import { createContext, useContext, useRef, useEffect, useState } from 'react'

const AudioContext = createContext()

const DEFAULT_PLAYLIST = ['/playlist/musica1.mp3', '/playlist/musica2.mp3', '/playlist/musica3.mp3']
const DB_NAME = 'BiarAudioDB'
const STORE_NAME = 'custom_playlist'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function AudioProvider({ children }) {
  const audioRef = useRef(new Audio())
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRepeat, setIsRepeat] = useState(() => localStorage.getItem('biar_audioRepeat') === 'true')
  const [isShuffle, setIsShuffle] = useState(() => localStorage.getItem('biar_audioShuffle') === 'true')
  const [currentTrack, setCurrentTrack] = useState(() => parseInt(localStorage.getItem('biar_audioTrack')) || 0)
  const [playlist, setPlaylist] = useState(DEFAULT_PLAYLIST)
  const [isCustom, setIsCustom] = useState(false)
  const [customUrls, setCustomUrls] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [customFiles, setCustomFiles] = useState([])

  const loadTrack = (index, pl) => {
    const p = pl || playlist
    const i = index >= p.length ? 0 : index
    audioRef.current.src = p[i]
    audioRef.current.load()
    return i
  }

  const play = (resumeTime) => {
    if (resumeTime > 0) audioRef.current.currentTime = resumeTime
    audioRef.current.play()
      .then(() => { setIsPlaying(true); localStorage.setItem('biar_audioPlaying', 'true') })
      .catch(() => { setIsPlaying(false); localStorage.setItem('biar_audioPlaying', 'false') })
  }

  const pause = () => {
    audioRef.current.pause()
    setIsPlaying(false)
    localStorage.setItem('biar_audioPlaying', 'false')
  }

  const toggleRepeat = () => {
    const v = !isRepeat; setIsRepeat(v); localStorage.setItem('biar_audioRepeat', v)
  }
  const toggleShuffle = () => {
    const v = !isShuffle; setIsShuffle(v); localStorage.setItem('biar_audioShuffle', v)
  }

  useEffect(() => {
    const audio = audioRef.current

    const onEnded = () => {
      let next = currentTrack
      if (isRepeat) {
        audio.currentTime = 0
      } else if (isShuffle && playlist.length > 1) {
        do { next = Math.floor(Math.random() * playlist.length) } while (next === currentTrack)
      } else {
        next = (currentTrack + 1) % playlist.length
      }
      setCurrentTrack(next)
      localStorage.setItem('biar_audioTrack', next)
      loadTrack(next)
      setTimeout(() => play(0), 100)
    }

    const onTimeUpdate = () => {
      if (!audio.paused) localStorage.setItem('biar_audioTime', audio.currentTime)
    }

    audio.addEventListener('ended', onEnded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [currentTrack, isRepeat, isShuffle, playlist])

  // Init
  useEffect(() => {
    const init = async () => {
      try {
        const db = await openDB()
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const result = await new Promise((res, rej) => {
          const r = store.getAll(); r.onsuccess = () => res(r.result); r.onerror = rej
        })
        if (result && result.length > 0) {
          const urls = result.map(f => URL.createObjectURL(f))
          setCustomUrls(urls)
          setCustomFiles(result)
          setIsCustom(true)
          setPlaylist(urls)
          const idx = parseInt(localStorage.getItem('biar_audioTrack')) || 0
          loadTrack(idx, urls)
        } else {
          loadTrack(currentTrack, DEFAULT_PLAYLIST)
        }
      } catch (e) {
        loadTrack(currentTrack, DEFAULT_PLAYLIST)
      }

      const wasPlaying = localStorage.getItem('biar_audioPlaying') === 'true'
      const savedTime = parseFloat(localStorage.getItem('biar_audioTime')) || 0
      if (wasPlaying) {
        play(savedTime)
        const unlock = () => {
          if (audioRef.current.paused && localStorage.getItem('biar_audioPlaying') === 'true')
            play(parseFloat(localStorage.getItem('biar_audioTime')) || 0)
          document.removeEventListener('click', unlock)
        }
        document.addEventListener('click', unlock, { once: true })
      }
    }
    init()
  }, [])

  const addFiles = async (files) => {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    for (const f of files) store.add(f)
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej })
    const newUrls = files.map(f => URL.createObjectURL(f))
    const merged = isCustom ? [...playlist, ...newUrls] : newUrls
    setCustomUrls(prev => [...prev, ...newUrls])
    setCustomFiles(prev => [...prev, ...files])
    setIsCustom(true)
    setPlaylist(merged)
    if (!isCustom) { setCurrentTrack(0); loadTrack(0, merged); play(0) }
    setModalOpen(false)
  }

  const clearCustom = async () => {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    customUrls.forEach(url => URL.revokeObjectURL(url))
    setCustomUrls([])
    setCustomFiles([])
    setIsCustom(false)
    setPlaylist(DEFAULT_PLAYLIST)
    setCurrentTrack(0)
    localStorage.setItem('biar_audioTrack', 0)
    localStorage.setItem('biar_audioTime', 0)
    loadTrack(0, DEFAULT_PLAYLIST)
    play(0)
    setModalOpen(false)
  }

  return (
    <AudioContext.Provider value={{
      isPlaying, isRepeat, isShuffle, modalOpen, customFiles,
      play, pause, toggleRepeat, toggleShuffle,
      setModalOpen, addFiles, clearCustom
    }}>
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => useContext(AudioContext)
