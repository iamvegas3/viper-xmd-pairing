import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(null);
  const [qr, setQr] = useState(null);
  const [method, setMethod] = useState('code');
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    let interval;
    if (sessionId && !sessionId.includes('done')) {
      interval = setInterval(async () => {
        const { data } = await axios.get(`/api/status?id=${sessionId}`);
        if (data.session) {
          setStatus('✅ PAIRED! Session sent to WhatsApp');
          setSessionId(sessionId + '-done');
          setLoading(false);
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [sessionId]);

  const generate = async () => {
    if (method === 'code' && (!phone || phone.length < 10)) {
      return alert('Valid phone number required');
    }
    setLoading(true);
    setCode(null);
    setQr(null);
    setStatus('');
    
    const { data } = await axios.post('/api/pair', { phone, method });
    if (data.qr) setQr(data.qr);
    if (data.pairingCode) setCode(data.pairingCode);
    setSessionId(data.sessionId);
    setStatus(`⏳ ${method === 'qr' ? 'Scan QR' : 'Enter code'} in WhatsApp...`);
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#0f0', fontFamily: 'monospace', padding: 20 }}>
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: '#0f0' }}>🐍 VIPER XMD</h1>
        <p>WhatsApp Session Generator</p>
        
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setMethod('code')} style={{ padding: 10, margin: 5, background: method === 'code' ? '#0f0' : '#333', color: '#000', border: 'none', cursor: 'pointer' }}>📱 Code</button>
          <button onClick={() => setMethod('qr')} style={{ padding: 10, margin: 5, background: method === 'qr' ? '#0f0' : '#333', color: '#000', border: 'none', cursor: 'pointer' }}>📷 QR</button>
        </div>
        
        {!sessionId ? (
          <>
            {method === 'code' && (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="254718180267"
                style={{ width: '100%', padding: 10, background: '#111', border: '1px solid #0f0', color: '#0f0', marginBottom: 10 }}
                disabled={loading}
              />
            )}
            <button onClick={generate} disabled={loading} style={{ width: '100%', padding: 10, background: loading ? '#333' : '#0f0', color: '#000', border: 'none', cursor: 'pointer' }}>
              {loading ? 'GENERATING...' : 'GENERATE'}
            </button>
          </>
        ) : (
          <div style={{ padding: 20, border: '1px solid #0f0', marginTop: 20 }}>
            <h3>{status}</h3>
          </div>
        )}
        
        {code && (<div style={{ marginTop: 20, padding: 20, border: '1px solid #0f0' }}><p>Code:</p><h2 style={{ fontSize: 40 }}>{code}</h2></div>)}
        {qr && (<div style={{ marginTop: 20, padding: 20, border: '1px solid #0f0' }}><p>Scan QR:</p><img src={qr} style={{ width: 200, height: 200 }} /></div>)}
      </div>
    </div>
  );
}
