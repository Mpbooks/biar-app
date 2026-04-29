const base = import.meta.env.VITE_API_URL || ''

function authHeaders () {
  const token = localStorage.getItem('biar_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handle (r) {
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    const err = new Error(data.error || 'request_failed')
    err.code = data.error
    err.status = r.status
    throw err
  }
  return data
}

export async function getWallet () {
  return handle(await fetch(`${base}/api/wallet`, { headers: authHeaders() }))
}

export async function executeOrder (side, symbol, qty, price) {
  return handle(await fetch(`${base}/api/wallet/order`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ side, symbol, qty, price }),
  }))
}

export async function resetWallet () {
  return handle(await fetch(`${base}/api/wallet/reset`, {
    method: 'POST',
    headers: authHeaders(),
  }))
}

export async function getQuotes (symbols) {
  return handle(await fetch(`${base}/api/stocks/quotes?symbols=${symbols.join(',')}`))
}
