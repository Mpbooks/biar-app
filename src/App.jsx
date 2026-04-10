// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AudioProvider } from './context/AudioContext'
import AudioPlayer from './components/AudioPlayer'
import Preloader from './components/Preloader'

import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import ChooseUsername from './pages/ChooseUsername'
import Profile from './pages/Profile'

// Dentro das suas <Routes>:

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AudioProvider>
          <Preloader />
          <AudioPlayer />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/escolher-username" element={<ChooseUsername />} />
            <Route path='/profile' element={< Profile/>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AudioProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
