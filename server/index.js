import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import session from 'express-session'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

// ── Variáveis de ambiente ──────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001
const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET

if (!MONGODB_URI) {
  console.error('Defina MONGODB_URI no arquivo .env (string de conexão do MongoDB).')
  process.exit(1)
}
if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('Defina JWT_SECRET no .env com pelo menos 16 caracteres aleatórios.')
  process.exit(1)
}

// ── App e middlewares ──────────────────────────────────────────────────────────
const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(session({ secret: JWT_SECRET, resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())

// ── MongoDB ────────────────────────────────────────────────────────────────────
const client = new MongoClient(MONGODB_URI)
let usersCollection

// ── Helpers ────────────────────────────────────────────────────────────────────
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}
function normalizeUsername(username) {
  return String(username || '').trim()
}

// ── Passport Google ────────────────────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value
    const googleId = profile.id
    const name = profile.displayName

    let user = await usersCollection.findOne({ googleId })
    if (!user) user = await usersCollection.findOne({ email })

    if (user) {
      const token = jwt.sign(
        { sub: user._id.toString(), username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      )
      return done(null, { existing: true, token, user: { id: user._id.toString(), username: user.username, email: user.email, createdAt: user.createdAt } })
    }

    return done(null, { existing: false, email, googleId, name })
  } catch (e) {
    return done(e)
  }
}))

// ── Rotas Google OAuth ─────────────────────────────────────────────────────────
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
)

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/cadastro?error=google` }),
  (req, res) => {
    const user = req.user

    if (user.existing) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/?token=${user.token}&user=${encodeURIComponent(JSON.stringify(user.user))}`
      )
    }

    const params = new URLSearchParams({
      email: user.email,
      googleId: user.googleId,
      name: user.name,
    })
    res.redirect(`${process.env.FRONTEND_URL}/escolher-username?${params}`)
  }
)

app.post('/api/auth/google/finish', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username)
    const email = normalizeEmail(req.body.email)
    const googleId = String(req.body.googleId || '')
    const password = String(req.body.password || '')

    if (!username || !email || !googleId || !password) {
      return res.status(400).json({ error: 'missing_fields' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password_too_short' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const now = new Date()
    const { insertedId } = await usersCollection.insertOne({
      username,
      email,
      googleId,
      passwordHash,
      createdAt: now,
    })

    const token = jwt.sign(
      { sub: insertedId.toString(), username, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.status(201).json({
      token,
      user: { id: insertedId.toString(), username, email, createdAt: now },
    })
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'duplicate_user' })
    console.error(e)
    return res.status(500).json({ error: 'server_error' })
  }
})

// ── Rotas de autenticação normal ───────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username)
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'missing_fields' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password_too_short' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const now = new Date()

    const { insertedId } = await usersCollection.insertOne({
      username,
      email,
      passwordHash,
      createdAt: now,
    })

    const token = jwt.sign(
      { sub: insertedId.toString(), username, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.status(201).json({
      token,
      user: { id: insertedId.toString(), username, email, createdAt: now },
    })
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'duplicate_user' })
    console.error(e)
    return res.status(500).json({ error: 'server_error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const username = normalizeUsername(req.body.username)
    const password = String(req.body.password || '')

    if (!password || (!email && !username)) {
      return res.status(400).json({ error: 'missing_fields' })
    }

    let user = null
    if (email && username) {
      user = await usersCollection.findOne({ email, username })
    } else if (email) {
      user = await usersCollection.findOne({ email })
    } else {
      user = await usersCollection.findOne({ username })
    }

    if (!user) return res.status(401).json({ error: 'invalid_credentials' })
    if (!user.passwordHash) return res.status(401).json({ error: 'invalid_credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' })

    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.json({
      token,
      user: { id: user._id.toString(), username: user.username, email: user.email, createdAt: user.createdAt || new Date() },
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server_error', message: e.message })
  }
})

// ── Proxy CoinGecko ────────────────────────────────────────
app.get('/api/price/bitcoin/:currency', async (req, res) => {
  try {
    const currency = req.params.currency || 'usd'
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency}`)
    if (!response.ok) throw new Error('API limit')
    const data = await response.json()
    return res.json(data)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'failed to fetch price' })
  }
})

// ── Inicialização ──────────────────────────────────────────────────────────────
async function start() {
  await client.connect()
  const db = client.db()
  usersCollection = db.collection('users')
  await usersCollection.createIndex({ email: 1 }, { unique: true })
  await usersCollection.createIndex({ username: 1 }, { unique: true })

  app.listen(PORT, () => {
    console.log(`API em http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Falha ao iniciar:', err.message)
  process.exit(1)
})