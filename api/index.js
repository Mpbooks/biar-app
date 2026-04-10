// api/index.js  — Express rodando como Serverless Function no Vercel
// O Vercel detecta automaticamente este arquivo via vercel.json
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import session from 'express-session'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

// ── Variáveis de ambiente ──────────────────────────────────
const MONGODB_URI   = process.env.MONGODB_URI
const JWT_SECRET    = process.env.JWT_SECRET
const FRONTEND_URL  = process.env.FRONTEND_URL || ''

if (!MONGODB_URI)  throw new Error('MONGODB_URI não definida nas env vars do Vercel.')
if (!JWT_SECRET || JWT_SECRET.length < 16) throw new Error('JWT_SECRET muito curta ou ausente.')

// ── MongoDB (conexão persistida entre chamadas serverless) ─
let cachedClient = null
let usersCollection = null

async function getDb () {
  if (cachedClient) return usersCollection
  cachedClient = new MongoClient(MONGODB_URI)
  await cachedClient.connect()
  const db = cachedClient.db()
  usersCollection = db.collection('users')
  await usersCollection.createIndex({ email: 1 }, { unique: true })
  await usersCollection.createIndex({ username: 1 }, { unique: true })
  return usersCollection
}

// ── Helpers ────────────────────────────────────────────────
const normalizeEmail    = e => String(e || '').trim().toLowerCase()
const normalizeUsername = u => String(u || '').trim()

// ── App ────────────────────────────────────────────────────
const app = express()
app.set('trust proxy', 1)

app.use(cors({
  origin: FRONTEND_URL || true,
  credentials: true,
}))
app.use(express.json())
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  // Em produção use um store externo (ex: connect-mongo), mas para autenticação
  // básica JWT a session só é usada durante o fluxo OAuth.
}))
app.use(passport.initialize())
app.use(passport.session())

// ── Passport Google OAuth ──────────────────────────────────
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  `${FRONTEND_URL}/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const col = await getDb()
    const email    = profile.emails[0].value
    const googleId = profile.id
    const name     = profile.displayName

    let user = await col.findOne({ googleId })
    if (!user) user = await col.findOne({ email })

    if (user) {
      const token = jwt.sign(
        { sub: user._id.toString(), username: user.username, email: user.email },
        JWT_SECRET, { expiresIn: '7d' }
      )
      return done(null, { existing: true, token, user: { id: user._id.toString(), username: user.username, email: user.email } })
    }
    return done(null, { existing: false, email, googleId, name })
  } catch (e) { return done(e) }
}))

// ── Google OAuth routes ────────────────────────────────────
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
)

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/cadastro?error=google` }),
  (req, res) => {
    const user = req.user
    if (user.existing) {
      return res.redirect(`${FRONTEND_URL}/?token=${user.token}&user=${encodeURIComponent(JSON.stringify(user.user))}`)
    }
    const params = new URLSearchParams({ email: user.email, googleId: user.googleId, name: user.name })
    res.redirect(`${FRONTEND_URL}/escolher-username?${params}`)
  }
)

app.post('/api/auth/google/finish', async (req, res) => {
  try {
    const col      = await getDb()
    const username = normalizeUsername(req.body.username)
    const email    = normalizeEmail(req.body.email)
    const googleId = String(req.body.googleId || '')

    if (!username || !email || !googleId)
      return res.status(400).json({ error: 'missing_fields' })

    const { insertedId } = await col.insertOne({ username, email, googleId, passwordHash: null, createdAt: new Date() })
    const token = jwt.sign({ sub: insertedId.toString(), username, email }, JWT_SECRET, { expiresIn: '7d' })
    return res.status(201).json({ token, user: { id: insertedId.toString(), username, email } })
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'duplicate_user' })
    console.error(e)
    return res.status(500).json({ error: 'server_error' })
  }
})

// ── Register ───────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const col          = await getDb()
    const username     = normalizeUsername(req.body.username)
    const email        = normalizeEmail(req.body.email)
    const password     = String(req.body.password || '')

    if (!username || !email || !password)
      return res.status(400).json({ error: 'missing_fields' })
    if (password.length < 6)
      return res.status(400).json({ error: 'password_too_short' })

    const passwordHash = await bcrypt.hash(password, 10)
    const { insertedId } = await col.insertOne({ username, email, passwordHash, createdAt: new Date() })
    const token = jwt.sign({ sub: insertedId.toString(), username, email }, JWT_SECRET, { expiresIn: '7d' })
    return res.status(201).json({ token, user: { id: insertedId.toString(), username, email } })
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'duplicate_user' })
    console.error(e)
    return res.status(500).json({ error: 'server_error' })
  }
})

// ── Login ──────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const col      = await getDb()
    const email    = normalizeEmail(req.body.email)
    const username = normalizeUsername(req.body.username)
    const password = String(req.body.password || '')

    if (!password || (!email && !username))
      return res.status(400).json({ error: 'missing_fields' })

    let user = null
    if (email && username)  user = await col.findOne({ email, username })
    else if (email)         user = await col.findOne({ email })
    else                    user = await col.findOne({ username })

    if (!user) return res.status(401).json({ error: 'invalid_credentials' })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok)  return res.status(401).json({ error: 'invalid_credentials' })

    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, email: user.email },
      JWT_SECRET, { expiresIn: '7d' }
    )
    return res.json({ token, user: { id: user._id.toString(), username: user.username, email: user.email } })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server_error' })
  }
})

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))

// ── Export para Vercel Serverless ──────────────────────────
export default app
