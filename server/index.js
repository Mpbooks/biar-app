import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import session from 'express-session'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import nodemailer from 'nodemailer'

// ── Variáveis de ambiente ──────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001
const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET

if (!MONGODB_URI) {w
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
app.use(express.json({ limit: '10mb' }))
app.use(session({ secret: JWT_SECRET, resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())

// ── MongoDB ────────────────────────────────────────────────────────────────────
const client = new MongoClient(MONGODB_URI)
let usersCollection
let walletsCollection

// ── Helpers ────────────────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'unauthorized' })

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'forbidden' })
    req.user = user
    next()
  })
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}
function normalizeUsername(username) {
  return String(username || '').trim()
}
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

async function sendVerificationEmail(email, code) {
  if (!process.env.SMTP_USER) {
    console.log(`\n\n=== [SIMULATED EMAIL] VERIFICATION CODE FOR ${email}: ${code} ===\n\n`)
    return
  }
  try {
    await transporter.sendMail({
      from: `"Biar Investments" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Código de Verificação - Biar Investments',
      text: `Seu código de verificação é: ${code}\nEste código expira em 10 minutos.`,
      html: `<b>Seu código de verificação é:</b> <h2 style="color:#F4EDE6; background:#060504; padding:10px; display:inline-block; border-radius:8px;">${code}</h2><p>Este código expira em 10 minutos.</p>`,
    })
  } catch (err) {
    console.error('Falha ao enviar e-mail:', err)
  }
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
      return done(null, { existing: true, token, user: { id: user._id.toString(), username: user.username, email: user.email, createdAt: user.createdAt, avatar: user.avatar } })
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
      isVerified: true
    })

    const token = jwt.sign(
      { sub: insertedId.toString(), username, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.status(201).json({
      token,
      user: { id: insertedId.toString(), username, email, createdAt: now, avatar: null },
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
    const verificationCode = generateCode()
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

    const { insertedId } = await usersCollection.insertOne({
      username,
      email,
      passwordHash,
      createdAt: now,
      isVerified: false,
      verificationCode,
      verificationExpires
    })

    await sendVerificationEmail(email, verificationCode)

    return res.status(201).json({
      status: 'pending_verification',
      email: email,
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

    const verificationCode = generateCode()
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000)
    await usersCollection.updateOne({ _id: user._id }, { $set: { verificationCode, verificationExpires } })
    
    await sendVerificationEmail(user.email, verificationCode)

    return res.json({
      status: 'pending_verification',
      email: user.email,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server_error', message: e.message })
  }
})

app.post('/api/auth/verify', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const code = String(req.body.code || '').trim()

    if (!email || !code) return res.status(400).json({ error: 'missing_fields' })

    const user = await usersCollection.findOne({ email })
    if (!user) return res.status(404).json({ error: 'user_not_found' })

    if (user.verificationCode !== code || !user.verificationExpires || new Date() > user.verificationExpires) {
      return res.status(400).json({ error: 'invalid_or_expired_code' })
    }

    // Marca como ativado e apaga o código de verificação
    await usersCollection.updateOne({ _id: user._id }, {
      $set: { isVerified: true },
      $unset: { verificationCode: "", verificationExpires: "" }
    })

    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.json({
      token,
      user: { id: user._id.toString(), username: user.username, email: user.email, createdAt: user.createdAt || new Date(), avatar: user.avatar },
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server_error' })
  }
})

app.post('/api/auth/resend', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    if (!email) return res.status(400).json({ error: 'missing_fields' })

    const user = await usersCollection.findOne({ email })
    if (!user) return res.status(404).json({ error: 'user_not_found' })

    const verificationCode = generateCode()
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000)
    await usersCollection.updateOne({ _id: user._id }, { $set: { verificationCode, verificationExpires } })
    
    await sendVerificationEmail(user.email, verificationCode)

    return res.json({ status: 'sent' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server_error' })
  }
})

// ── User Avatar ────────────────────────────────────────────────────────────────
app.post('/api/user/avatar', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { avatar } = req.body;
    
    if (!avatar) return res.status(400).json({ error: 'missing_avatar' });

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { avatar } }
    );

    res.json({ success: true, avatar });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// ── Rotas de Carteira (Wallet) ─────────────────────────────────────────────────
app.get('/api/wallet', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub
    let wallet = await walletsCollection.findOne({ userId })
    
    if (!wallet) {
      // Cria carteira vazia com saldo inicial de teste (ex: R$ 10.000)
      const newWallet = {
        userId,
        balance: 10000.0,
        positions: {},
        history: []
      }
      await walletsCollection.insertOne(newWallet)
      wallet = newWallet
    }
    
    return res.json(wallet)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server_error' })
  }
})

app.post('/api/wallet/trade', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub
    const { symbol, qty, price, side } = req.body
    
    if (!symbol || !qty || !price || !side) {
      return res.status(400).json({ error: 'missing_fields' })
    }
    
    if (qty <= 0 || price <= 0) {
      return res.status(400).json({ error: 'invalid_values' })
    }
    
    const wallet = await walletsCollection.findOne({ userId })
    if (!wallet) {
      return res.status(404).json({ error: 'wallet_not_found' })
    }
    
    const total = qty * price
    const uppercaseSymbol = symbol.toUpperCase()
    const now = new Date()
    const dateString = now.toLocaleString('pt-BR')
    
    const historyEntry = {
      id: Date.now(),
      side: side.toUpperCase(),
      symbol: uppercaseSymbol,
      qty,
      price,
      total,
      date: dateString
    }
    
    if (side.toUpperCase() === 'BUY') {
      if (wallet.balance < total) {
        return res.status(400).json({ error: 'insufficient_funds' })
      }
      
      const newBalance = wallet.balance - total
      const positions = wallet.positions || {}
      
      let newQty = qty
      let newAvgPrice = price
      
      if (positions[uppercaseSymbol]) {
        const oldQty = positions[uppercaseSymbol].qty
        const oldAvgPrice = positions[uppercaseSymbol].avgPrice
        newQty = oldQty + qty
        newAvgPrice = ((oldQty * oldAvgPrice) + total) / newQty
      }
      
      const updateData = {
        $set: { 
          balance: newBalance,
          [`positions.${uppercaseSymbol}`]: { qty: newQty, avgPrice: newAvgPrice }
        },
        $push: { history: historyEntry }
      }
      
      await walletsCollection.updateOne({ userId }, updateData)
      return res.json({ success: true })
      
    } else if (side.toUpperCase() === 'SELL') {
      const positions = wallet.positions || {}
      if (!positions[uppercaseSymbol] || positions[uppercaseSymbol].qty < qty) {
        return res.status(400).json({ error: 'insufficient_assets' })
      }
      
      const newBalance = wallet.balance + total
      const newQty = positions[uppercaseSymbol].qty - qty
      
      const updateData = {
        $set: { balance: newBalance },
        $push: { history: historyEntry }
      }
      
      if (newQty === 0) {
        updateData.$unset = { [`positions.${uppercaseSymbol}`]: "" }
      } else {
        updateData.$set[`positions.${uppercaseSymbol}`] = { 
          qty: newQty, 
          avgPrice: positions[uppercaseSymbol].avgPrice 
        }
      }
      
      await walletsCollection.updateOne({ userId }, updateData)
      return res.json({ success: true })
      
    } else {
      return res.status(400).json({ error: 'invalid_side' })
    }
    
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server_error' })
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
  walletsCollection = db.collection('wallets')
  await walletsCollection.createIndex({ userId: 1 }, { unique: true })

  app.listen(PORT, () => {
    console.log(`API em http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Falha ao iniciar:', err.message)
  process.exit(1)
})
