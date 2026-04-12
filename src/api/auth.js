const base = import.meta.env.VITE_API_URL || ''

export async function register({ username, email, password }) {
  const r = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const err = new Error(data.error || 'request_failed')
    err.code = data.error
    err.status = r.status
    throw err
  }
  return data
}

export async function login({ username, email, password }) {
  const r = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const err = new Error(data.error || 'request_failed')
    err.code = data.error
    err.status = r.status
    throw err
  }
  return data
}

export async function verifyCode({ email, code }) {
  const r = await fetch(`${base}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const err = new Error(data.error || 'request_failed')
    err.code = data.error
    err.status = r.status
    throw err
  }
  return data
}

export async function resendCode({ email }) {
  const r = await fetch(`${base}/api/auth/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const err = new Error(data.error || 'request_failed')
    err.code = data.error
    err.status = r.status
    throw err
  }
  return data
}
