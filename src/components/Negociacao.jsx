// src/components/Negociacao.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getWallet, executeOrder, resetWallet, getQuotes } from '../api/wallet'
import '../styles/negociacao.css'

const STOCKS = [
  { symbol: 'PETR4', name: 'Petrobras' },
  { symbol: 'VALE3', name: 'Vale' },
  { symbol: 'ITUB4', name: 'Itaú Unibanco' },
  { symbol: 'BBDC4', name: 'Bradesco' },
  { symbol: 'ABEV3', name: 'Ambev' },
  { symbol: 'WEGE3', name: 'WEG' },
  { symbol: 'BBAS3', name: 'Banco do Brasil' },
  { symbol: 'RENT3', name: 'Localiza' },
  { symbol: 'EGIE3', name: 'Engie Brasil' },
  { symbol: 'B3SA3', name: 'B3 S.A.' },
]

const SYMBOLS = STOCKS.map(s => s.symbol)
const POLL_INTERVAL = 30000

function CountdownRing({ seconds, total = 30, size = 36, error }) {
  const r = (size - 4) / 2
  const circ = 2 * Math.PI * r
  const progress = circ - (seconds / total) * circ
  const color = error ? '#f87171' : seconds <= 5 ? '#facc15' : '#4ade80'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(244,237,230,0.08)" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={progress}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        fontSize="10" fontWeight="700" fill={color}
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px`, transition: 'fill 0.3s' }}
      >
        {seconds}
      </text>
    </svg>
  )
}

function fmt (n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildSparkline (currentPrice, changePercent, points = 20) {
  const prices = []
  let p = currentPrice / (1 + changePercent / 100)
  for (let i = 0; i < points - 1; i++) {
    prices.push(p + (Math.random() - 0.5) * p * 0.003)
    p = prices[prices.length - 1]
  }
  prices.push(currentPrice)
  return prices
}

function Sparkline ({ prices, width = 100, height = 36, positive }) {
  if (!prices || prices.length < 2) return <div style={{ width, height }} />
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const pts = prices.map((p, i) => [
    (i / (prices.length - 1)) * width,
    height - ((p - min) / range) * (height - 4) - 2,
  ])
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} fill="none" stroke={positive ? '#4ade80' : '#f87171'} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export default function Negociacao () {
  const [wallet, setWallet] = useState(null)
  const [walletLoading, setWalletLoading] = useState(true)
  const [walletError, setWalletError] = useState(null)

  const [quotes, setQuotes] = useState({})
  const [sparklines, setSparklines] = useState({})
  const [quotesLoading, setQuotesLoading] = useState(true)
  const [quotesError, setQuotesError] = useState(null)
  const [countdown, setCountdown] = useState(30)

  const [selected, setSelected] = useState('PETR4')
  const [qty, setQty] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [flash, setFlash] = useState(null)
  const [activeTab, setActiveTab] = useState('posicoes')

  const prevPrices = useRef({})

  const isLoggedIn = Boolean(localStorage.getItem('biar_token'))

  // ── Carregar carteira do backend ───────────────────────────
  useEffect(() => {
    if (!isLoggedIn) { setWalletLoading(false); return }
    getWallet()
      .then(w => { setWallet(w); setWalletLoading(false) })
      .catch(e => { setWalletError(e.code || 'error'); setWalletLoading(false) })
  }, [])

  // ── Buscar cotações via proxy backend ──────────────────────
  const fetchQuotes = useCallback(async () => {
    setCountdown(30)
    try {
      const data = await getQuotes(SYMBOLS)
      if (!data.results) throw new Error('sem resultados')

      const newQuotes = {}
      const newSparks = {}
      data.results.forEach(r => {
        const prev = prevPrices.current[r.symbol]
        newQuotes[r.symbol] = {
          price: r.regularMarketPrice,
          change: r.regularMarketChange,
          changePct: r.regularMarketChangePercent,
          name: r.shortName || r.longName || r.symbol,
          volume: r.regularMarketVolume,
          high: r.regularMarketDayHigh,
          low: r.regularMarketDayLow,
          open: r.regularMarketOpen,
          direction: prev
            ? r.regularMarketPrice > prev ? 'up'
              : r.regularMarketPrice < prev ? 'down' : 'same'
            : 'same',
        }
        newSparks[r.symbol] = buildSparkline(r.regularMarketPrice, r.regularMarketChangePercent)
        prevPrices.current[r.symbol] = r.regularMarketPrice
      })
      setQuotes(newQuotes)
      setSparklines(newSparks)
      setQuotesError(null)
    } catch {
      setQuotesError('Falha ao carregar cotações')
    } finally {
      setQuotesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuotes()
    const id = setInterval(fetchQuotes, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchQuotes])

  useEffect(() => {
    if (quotesLoading) return
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [quotesLoading])

  const showFlash = (msg, ok) => {
    setFlash({ msg, ok })
    setTimeout(() => setFlash(null), 3500)
  }

  // ── Executar ordem ─────────────────────────────────────────
  const handleOrder = async (side) => {
    const q = parseInt(qty, 10)
    if (!q || q <= 0) return showFlash('Quantidade inválida', false)
    const quote = quotes[selected]
    if (!quote) return showFlash('Cotação indisponível', false)

    setOrdering(true)
    try {
      const updated = await executeOrder(side, selected, q, quote.price)
      setWallet(updated)
      setQty('')
      showFlash(
        `${side === 'buy' ? 'Compra' : 'Venda'} executada: ${q}x ${selected} @ R$ ${fmt(quote.price)}`,
        true
      )
    } catch (e) {
      const msgs = {
        insufficient_balance: 'Saldo insuficiente',
        insufficient_position: 'Posição insuficiente para venda',
        unauthorized: 'Sessão expirada. Faça login novamente.',
      }
      showFlash(msgs[e.code] || 'Erro ao executar ordem', false)
    } finally {
      setOrdering(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Resetar carteira para R$ 10.000?')) return
    try {
      const fresh = await resetWallet()
      setWallet(fresh)
      showFlash('Carteira resetada com sucesso!', true)
    } catch {
      showFlash('Erro ao resetar carteira', false)
    }
  }

  // ── Estados derivados ──────────────────────────────────────
  const positions = wallet?.positions || {}
  const history = wallet?.history || []
  const balance = wallet?.balance ?? 0

  // valor de mercado atual das posições (usa preço real se quotes carregou, avgPrice como fallback)
  const totalPatrimony = Object.entries(positions).reduce((acc, [sym, pos]) => {
    const q = quotes[sym]
    return acc + (q ? q.price * pos.qty : pos.avgPrice * pos.qty)
  }, 0)
  // quanto foi investido pelo preço de compra
  const totalInvested = Object.entries(positions).reduce((acc, [, pos]) => acc + pos.avgPrice * pos.qty, 0)
  // P&L não realizado = diferença entre valor de mercado e custo
  const unrealizedPL = totalPatrimony - totalInvested
  const unrealizedPLPct = totalInvested > 0 ? (unrealizedPL / totalInvested) * 100 : 0
  // patrimônio total = caixa disponível + valor de mercado das posições
  const totalEquity = balance + totalPatrimony
  const totalPLAbs = totalEquity - 10000
  const totalPLPct = (totalPLAbs / 10000) * 100

  const selectedQuote = quotes[selected]
  const selectedStock = STOCKS.find(s => s.symbol === selected)
  const selectedPos = positions[selected]

  // ── Não logado ─────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="neg-unauthenticated">
        <div className="neg-unauth-icon">📈</div>
        <h2>Acesso restrito</h2>
        <p>Faça login para acessar a simulação de negociação.</p>
        <Link to="/login" className="neg-unauth-btn">Entrar</Link>
      </div>
    )
  }

  // ── Erro de carteira ───────────────────────────────────────
  if (!walletLoading && walletError) {
    return (
      <div className="neg-unauthenticated">
        <div className="neg-unauth-icon">⚠️</div>
        <h2>Erro ao carregar carteira</h2>
        <p>Verifique sua conexão ou faça login novamente.</p>
        <Link to="/login" className="neg-unauth-btn">Entrar</Link>
      </div>
    )
  }

  return (
    <div className="neg-root">
      {/* ── Flash toast ─────────────────────── */}
      {flash && (
        <div className={`neg-flash ${flash.ok ? 'neg-flash--ok' : 'neg-flash--err'}`}>
          {flash.msg}
        </div>
      )}

      {/* ── Header Stats ────────────────────── */}
      <div className="neg-topbar">
        {walletLoading ? (
          <div className="neg-skeleton-row" style={{ width: 300, height: 40 }} />
        ) : (
          <>
            <div className="neg-topbar-item">
              <span className="neg-topbar-label">Saldo Disponível</span>
              <span className="neg-topbar-value">R$ {fmt(balance)}</span>
            </div>
            <div className="neg-topbar-divider" />
            <div className="neg-topbar-item">
              <span className="neg-topbar-label">Patrimônio Total</span>
              <span className="neg-topbar-value">R$ {fmt(totalEquity)}</span>
            </div>
            <div className="neg-topbar-divider" />
            <div className="neg-topbar-item">
              <span className="neg-topbar-label">Resultado Geral</span>
              <span className={`neg-topbar-value ${totalPLAbs >= 0 ? 'neg-pos' : 'neg-neg'}`}>
                {totalPLAbs >= 0 ? '+' : ''}R$ {fmt(totalPLAbs)}
              </span>
              <span className={`neg-topbar-sub ${totalPLPct >= 0 ? 'neg-pos' : 'neg-neg'}`}>
                {totalPLPct >= 0 ? '+' : ''}{totalPLPct.toFixed(3)}%
              </span>
            </div>
            <div className="neg-topbar-divider" />
            <div className="neg-topbar-item">
              <span className="neg-topbar-label">P&L Posições</span>
              {totalInvested > 0 ? (
                <>
                  <span className={`neg-topbar-value ${unrealizedPL >= 0 ? 'neg-pos' : 'neg-neg'}`}>
                    {unrealizedPL >= 0 ? '+' : ''}R$ {fmt(unrealizedPL)}
                  </span>
                  <span className={`neg-topbar-sub ${unrealizedPLPct >= 0 ? 'neg-pos' : 'neg-neg'}`}>
                    {unrealizedPLPct >= 0 ? '+' : ''}{unrealizedPLPct.toFixed(2)}%
                  </span>
                </>
              ) : (
                <span className="neg-topbar-value" style={{ color: 'rgba(244,237,230,0.3)', fontSize: 13 }}>sem posições</span>
              )}
            </div>
          </>
        )}
        <div className="neg-pulse-wrap">
          {quotesLoading ? (
            <>
              <div className="neg-pulse neg-pulse--loading" />
              <span className="neg-pulse-label">Carregando</span>
            </>
          ) : (
            <>
              <CountdownRing seconds={countdown} error={!!quotesError} />
              <span className="neg-pulse-label">{quotesError ? 'Erro' : 'AO VIVO'}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Main Grid ───────────────────────── */}
      <div className="neg-grid">

        {/* Watchlist */}
        <div className="neg-watchlist prf-card">
          <div className="neg-section-header">
            <span className="prf-label-mono">Mercado B3</span>
            {!quotesLoading && !quotesError && <span className="neg-update-badge">↻ {countdown}s</span>}
          </div>
          {quotesLoading ? (
            <div className="neg-skeleton-list">
              {STOCKS.map(s => <div key={s.symbol} className="neg-skeleton-row" />)}
            </div>
          ) : quotesError ? (
            <p className="neg-empty" style={{ padding: '20px 0' }}>{quotesError}</p>
          ) : (
            <div className="neg-watch-list">
              {STOCKS.map(s => {
                const q = quotes[s.symbol]
                const pct = q?.changePct ?? 0
                return (
                  <button
                    key={s.symbol}
                    className={`neg-watch-item ${selected === s.symbol ? 'neg-watch-item--active' : ''} ${q?.direction === 'up' ? 'neg-flash-up' : q?.direction === 'down' ? 'neg-flash-down' : ''}`}
                    onClick={() => setSelected(s.symbol)}
                  >
                    <div className="neg-watch-left">
                      <span className="neg-watch-symbol">{s.symbol}</span>
                      <span className="neg-watch-name">{s.name}</span>
                    </div>
                    <div className="neg-watch-right">
                      <span className="neg-watch-price">{q ? `R$ ${fmt(q.price)}` : '--'}</span>
                      <span className={`neg-watch-pct ${pct >= 0 ? 'neg-pos' : 'neg-neg'}`}>
                        {q ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : '--'}
                      </span>
                    </div>
                    <div className="neg-watch-spark">
                      <Sparkline prices={sparklines[s.symbol]} width={70} height={26} positive={pct >= 0} />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Center */}
        <div className="neg-center">

          {/* Detail card */}
          <div className="prf-card neg-detail-card">
            {!selectedQuote ? (
              <div className="neg-detail-loading">Carregando {selected}...</div>
            ) : (
              <>
                <div className="neg-detail-top">
                  <div>
                    <div className="neg-detail-symbol">{selected}</div>
                    <div className="neg-detail-name">{selectedQuote.name}</div>
                  </div>
                  <div className="neg-detail-prices">
                    <div className="neg-detail-price">R$ {fmt(selectedQuote.price)}</div>
                    <div className={`neg-detail-change ${selectedQuote.changePct >= 0 ? 'neg-pos' : 'neg-neg'}`}>
                      {selectedQuote.changePct >= 0 ? '▲' : '▼'} R$ {fmt(Math.abs(selectedQuote.change))} ({selectedQuote.changePct >= 0 ? '+' : ''}{selectedQuote.changePct.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                <div className="neg-sparkline-big">
                  <Sparkline prices={sparklines[selected]} width={400} height={80} positive={selectedQuote.changePct >= 0} />
                </div>

                <div className="neg-detail-stats">
                  {[
                    ['Abertura', selectedQuote.open],
                    ['Mínima', selectedQuote.low],
                    ['Máxima', selectedQuote.high],
                    ['Volume', selectedQuote.volume ? (selectedQuote.volume / 1e6).toFixed(1) + 'M' : null],
                  ].map(([label, val]) => (
                    <div key={label} className="neg-detail-stat">
                      <span>{label}</span>
                      <strong>{val ? (label === 'Volume' ? val : `R$ ${fmt(val)}`) : '--'}</strong>
                    </div>
                  ))}
                </div>

                {selectedPos && (
                  <div className="neg-my-position">
                    <span className="prf-label-mono">Sua Posição</span>
                    <div className="neg-pos-row">
                      <div>
                        <div className="neg-pos-qty">{selectedPos.qty} ações</div>
                        <div className="neg-pos-avg">PM: R$ {fmt(selectedPos.avgPrice)}</div>
                      </div>
                      {(() => {
                        const pl = (selectedQuote.price - selectedPos.avgPrice) * selectedPos.qty
                        const plPct = ((selectedQuote.price - selectedPos.avgPrice) / selectedPos.avgPrice) * 100
                        return (
                          <div className="neg-pos-pl-wrap">
                            <div className={`neg-pos-pl ${pl >= 0 ? 'neg-pos' : 'neg-neg'}`}>
                              {pl >= 0 ? '+' : ''}R$ {fmt(pl)} ({plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%)
                            </div>
                            <div className="neg-pos-total">= R$ {fmt(selectedQuote.price * selectedPos.qty)}</div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Positions + History */}
          <div className="prf-card neg-bottom-card">
            <div className="neg-tabs">
              <button className={`neg-tab ${activeTab === 'posicoes' ? 'neg-tab--active' : ''}`} onClick={() => setActiveTab('posicoes')}>
                Posições Abertas
              </button>
              <button className={`neg-tab ${activeTab === 'historico' ? 'neg-tab--active' : ''}`} onClick={() => setActiveTab('historico')}>
                Histórico ({history.length})
              </button>
            </div>

            {activeTab === 'posicoes' && (
              <div className="neg-table-wrap">
                {Object.keys(positions).length === 0 ? (
                  <p className="neg-empty">Nenhuma posição aberta. Comece comprando uma ação!</p>
                ) : (
                  <table className="neg-table">
                    <thead>
                      <tr><th>Ativo</th><th>Qtd</th><th>P.M.</th><th>Atual</th><th>P&L</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(positions).map(([sym, pos]) => {
                        const q = quotes[sym]
                        const cur = q?.price ?? pos.avgPrice
                        const pl = (cur - pos.avgPrice) * pos.qty
                        const plPct = ((cur - pos.avgPrice) / pos.avgPrice) * 100
                        return (
                          <tr key={sym} onClick={() => setSelected(sym)} className="neg-table-row-click">
                            <td><strong>{sym}</strong></td>
                            <td>{pos.qty}</td>
                            <td>R$ {fmt(pos.avgPrice)}</td>
                            <td>R$ {fmt(cur)}</td>
                            <td className={pl >= 0 ? 'neg-pos' : 'neg-neg'}>
                              {pl >= 0 ? '+' : ''}R$ {fmt(pl)}<br />
                              <small>{plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%</small>
                            </td>
                            <td>R$ {fmt(cur * pos.qty)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'historico' && (
              <div className="neg-table-wrap">
                {history.length === 0 ? (
                  <p className="neg-empty">Nenhuma operação realizada ainda.</p>
                ) : (
                  <table className="neg-table">
                    <thead>
                      <tr><th>Data</th><th>Tipo</th><th>Ativo</th><th>Qtd</th><th>Preço</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 50).map(h => (
                        <tr key={h.id}>
                          <td>{h.date}</td>
                          <td><span className={`neg-badge ${h.side === 'BUY' ? 'neg-badge--buy' : 'neg-badge--sell'}`}>{h.side === 'BUY' ? 'COMPRA' : 'VENDA'}</span></td>
                          <td><strong>{h.symbol}</strong></td>
                          <td>{h.qty}</td>
                          <td>R$ {fmt(h.price)}</td>
                          <td className={h.side === 'BUY' ? 'neg-neg' : 'neg-pos'}>
                            {h.side === 'BUY' ? '-' : '+'}R$ {fmt(h.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Order Panel */}
        <div className="prf-card neg-order-card">
          <span className="prf-label-mono">Ordem — {selectedStock?.name || selected}</span>

          <div className="neg-order-price">
            {selectedQuote ? (
              <>
                <div className="neg-order-cur">R$ {fmt(selectedQuote.price)}</div>
                <div className={`neg-order-pct ${selectedQuote.changePct >= 0 ? 'neg-pos' : 'neg-neg'}`}>
                  {selectedQuote.changePct >= 0 ? '+' : ''}{selectedQuote.changePct.toFixed(2)}% hoje
                </div>
              </>
            ) : (
              <div className="neg-order-cur">--</div>
            )}
          </div>

          <div className="neg-order-field">
            <label className="neg-order-label">Quantidade de ações</label>
            <input
              className="neg-order-input"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={qty}
              onChange={e => setQty(e.target.value)}
              disabled={ordering}
            />
          </div>

          {qty && selectedQuote && parseInt(qty) > 0 && (
            <div className="neg-order-total">
              <span>Total estimado</span>
              <strong>R$ {fmt(selectedQuote.price * parseInt(qty))}</strong>
            </div>
          )}

          <div className="neg-order-presets">
            {[1, 10, 100].map(n => (
              <button key={n} className="neg-preset-btn" onClick={() => setQty(String(n))} disabled={ordering}>{n}</button>
            ))}
            {selectedQuote && balance > 0 && (
              <button
                className="neg-preset-btn"
                disabled={ordering}
                onClick={() => setQty(String(Math.floor(balance / selectedQuote.price)))}
              >MAX</button>
            )}
          </div>

          <div className="neg-order-btns">
            <button
              className="neg-btn neg-btn--buy"
              onClick={() => handleOrder('buy')}
              disabled={!selectedQuote || !qty || ordering || walletLoading}
            >
              {ordering ? '...' : 'COMPRAR'}
            </button>
            <button
              className="neg-btn neg-btn--sell"
              onClick={() => handleOrder('sell')}
              disabled={!selectedQuote || !qty || ordering || !selectedPos || walletLoading}
            >
              {ordering ? '...' : 'VENDER'}
            </button>
          </div>

          <div className="neg-order-info">
            <div className="neg-order-info-row">
              <span>Saldo</span>
              <strong>{walletLoading ? '...' : `R$ ${fmt(balance)}`}</strong>
            </div>
            {selectedPos && (
              <div className="neg-order-info-row">
                <span>Em carteira</span>
                <strong>{selectedPos.qty} ações</strong>
              </div>
            )}
          </div>

          <button className="neg-reset-btn" onClick={handleReset} disabled={ordering}>
            Resetar Carteira
          </button>
        </div>
      </div>
    </div>
  )
}
