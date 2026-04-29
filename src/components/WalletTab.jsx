import { useState, useEffect } from 'react';

const base = import.meta.env.VITE_API_URL || '';

export default function WalletTab() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Formulário de Trade
  const [symbol, setSymbol] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMsg, setTradeMsg] = useState('');

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('biar_token');
      if (!token) throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
      
      const res = await fetch(`${base}/api/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao carregar os dados da carteira.');
      
      const data = await res.json();
      setWallet(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTrade = async (side) => {
    try {
      setTradeMsg('');
      setTradeLoading(true);
      const token = localStorage.getItem('biar_token');
      
      const payload = {
        symbol,
        qty: Number(qty),
        price: Number(price),
        side
      };
      
      if (!payload.symbol || payload.qty <= 0 || payload.price <= 0) {
        throw new Error('Preencha os campos com valores válidos.');
      }

      const res = await fetch(`${base}/api/wallet/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na transação. Verifique seu saldo ou posições.');
      
      setTradeMsg('✅ Transação realizada com sucesso!');
      setSymbol(''); setQty(''); setPrice('');
      fetchWallet(); // Recarrega a carteira para atualizar o saldo e histórico
    } catch (err) {
      setTradeMsg(`❌ Erro: ${err.message}`);
    } finally {
      setTradeLoading(false);
    }
  };

  if (loading && !wallet) return <div className="prf-card" style={{ textAlign: 'center' }}>Carregando sua carteira...</div>;
  if (error) return <div className="prf-card" style={{ color: '#E6B8A2' }}>{error}</div>;

  const positionsList = wallet?.positions ? Object.entries(wallet.positions) : [];
  const historyList = wallet?.history ? [...wallet.history].reverse() : [];

  // Estilos inline reutilizáveis baseados no Login e Profile
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(244, 237, 230, 0.1)',
    borderRadius: '9px',
    color: '#F4EDE6',
    fontFamily: '"Syne", sans-serif',
    fontSize: '13px',
    outline: 'none',
    marginBottom: '14px',
    marginTop: '6px'
  };

  const btnStyle = {
    padding: '14px 20px',
    background: '#F4EDE6',
    border: 'none',
    borderRadius: '10px',
    color: '#060504',
    fontFamily: '"Syne", sans-serif',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.15s'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* ── SALDO PRINCIPAL ── */}
      <div className="prf-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="prf-label-mono">Patrimônio Total Disponível</span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#F4EDE6', marginTop: '10px', fontFamily: '"Cinzel", serif' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wallet?.balance || 0)}
          </h2>
        </div>
        <button style={{ ...btnStyle, background: 'rgba(205, 184, 159, 0.15)', color: '#cdb89f', border: '1px solid rgba(205, 184, 159, 0.3)' }}>
          Depositar Fundos
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        
        {/* ── FORMULÁRIO DE NEGOCIAÇÃO ── */}
        <div className="prf-card">
          <div style={{ marginBottom: '20px' }}>
            <span className="prf-label-mono">Mercado de Balcão</span>
            <h3 style={{ fontSize: '20px', color: '#F4EDE6', fontFamily: '"Cinzel", serif' }}>Nova Negociação</h3>
          </div>
          
          <div>
            <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(244, 237, 230, 0.4)', textTransform: 'uppercase' }}>Ativo (Símbolo)</label>
            <input style={inputStyle} placeholder="Ex: PETR4" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} />
          </div>
          
          <div>
            <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(244, 237, 230, 0.4)', textTransform: 'uppercase' }}>Quantidade</label>
            <input style={inputStyle} type="number" placeholder="Ex: 100" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          
          <div>
            <label style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', color: 'rgba(244, 237, 230, 0.4)', textTransform: 'uppercase' }}>Preço Unitário (R$)</label>
            <input style={inputStyle} type="number" step="0.01" placeholder="Ex: 34.50" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              style={{ ...btnStyle, background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)', flex: 1 }}
              onClick={() => handleTrade('BUY')}
              disabled={tradeLoading}
              onMouseOver={(e) => e.target.style.opacity = '0.8'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              {tradeLoading ? '...' : 'COMPRAR'}
            </button>
            <button 
              style={{ ...btnStyle, background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.3)', flex: 1 }}
              onClick={() => handleTrade('SELL')}
              disabled={tradeLoading}
              onMouseOver={(e) => e.target.style.opacity = '0.8'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              {tradeLoading ? '...' : 'VENDER'}
            </button>
          </div>
          {tradeMsg && <p style={{ marginTop: '15px', fontSize: '12px', color: tradeMsg.includes('Erro') ? '#E6B8A2' : '#cdb89f', fontFamily: '"Inter", sans-serif' }}>{tradeMsg}</p>}
        </div>

        {/* ── POSIÇÕES ATUAIS ── */}
        <div className="prf-card">
          <div style={{ marginBottom: '20px' }}>
            <span className="prf-label-mono">Portfólio</span>
            <h3 style={{ fontSize: '20px', color: '#F4EDE6', fontFamily: '"Cinzel", serif' }}>Meus Ativos</h3>
          </div>
          
          {positionsList.length === 0 ? (
            <p style={{ color: 'rgba(244,237,230,0.5)', fontSize: '13px', fontFamily: '"Inter", sans-serif' }}>Sua carteira de investimentos está vazia.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {positionsList.map(([sym, data]) => (
                <div key={sym} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(244,237,230,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(244,237,230,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '4px', height: '40px', background: '#cdb89f', borderRadius: '4px' }}></div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#F4EDE6', fontFamily: '"Cinzel", serif' }}>{sym}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(244,237,230,0.4)', fontFamily: '"DM Mono", monospace' }}>
                        PM: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.avgPrice)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', color: '#F4EDE6', fontWeight: 'bold' }}>{data.qty} <span style={{ fontSize: '12px', color: 'rgba(244,237,230,0.5)', fontWeight: 'normal' }}>cotas</span></div>
                    <div style={{ fontSize: '11px', color: '#cdb89f', fontFamily: '"DM Mono", monospace' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.qty * data.avgPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── HISTÓRICO DE TRANSAÇÕES ── */}
      <div className="prf-card">
        <div style={{ marginBottom: '20px' }}>
          <span className="prf-label-mono">Extrato</span>
          <h3 style={{ fontSize: '20px', color: '#F4EDE6', fontFamily: '"Cinzel", serif' }}>Histórico de Transações</h3>
        </div>

        {historyList.length === 0 ? (
           <p style={{ color: 'rgba(244,237,230,0.5)', fontSize: '13px', fontFamily: '"Inter", sans-serif' }}>Nenhuma transação realizada até o momento.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {historyList.map((item, idx) => (
              <div key={item.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '16px 10px', 
                borderBottom: idx === historyList.length - 1 ? 'none' : '1px solid rgba(244,237,230,0.05)' 
              }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <span style={{ 
                    padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', fontFamily: '"DM Mono", monospace',
                    background: item.side === 'BUY' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                    color: item.side === 'BUY' ? '#4ade80' : '#f87171',
                    width: '60px', textAlign: 'center'
                  }}>
                    {item.side}
                  </span>
                  <div>
                    <div style={{ color: '#F4EDE6', fontWeight: 'bold', fontSize: '16px', fontFamily: '"Cinzel", serif' }}>{item.symbol}</div>
                    <div style={{ color: 'rgba(244,237,230,0.4)', fontSize: '11px', fontFamily: '"Inter", sans-serif' }}>{item.date}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#F4EDE6', fontSize: '16px', fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                  </div>
                  <div style={{ color: 'rgba(244,237,230,0.4)', fontSize: '11px', fontFamily: '"DM Mono", monospace' }}>
                    {item.qty} un × {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
