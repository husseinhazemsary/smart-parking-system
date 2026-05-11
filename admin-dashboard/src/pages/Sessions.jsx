import { useEffect, useState } from 'react'
import { Clock, Filter } from 'lucide-react'
import api from '../api/axios'

export default function Sessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/api/admin/sessions')
      .then(r => setSessions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function formatTime(dt) {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div className="page-header">
          <h1>Parking Sessions</h1>
          <p>Historical entry/exit logs</p>
        </div>
        <button style={{
          background: '#0d1426', border: '1px solid #1a2540',
          color: '#94a3b8', padding: '10px 14px', borderRadius: 10,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
        }}>
          <Filter size={15}/> Filter
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', color: '#4a5568' }}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#4a5568' }}>No sessions found</div>
        ) : (
          sessions.map(s => (
            <div key={s.id} className="card" style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '16px 20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 40, height: 40, background: '#1a2540',
                  borderRadius: 10, display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <Clock size={18} color="#3b82f6"/>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {s.slotNumber} — {s.userFullName}
                  </div>
                  <div style={{ fontSize: 12, color: '#4a5568', marginTop: 3 }}>
                    {formatTime(s.entryTime)} → {s.exitTime ? formatTime(s.exitTime) : 'Active'}
                    {s.durationMinutes != null && (
                      <span style={{ marginLeft: 8, color: '#3b82f6' }}>
                        {s.durationMinutes} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {s.amountCharged != null && (
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{s.amountCharged} EGP</span>
                )}
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  color: s.status === 'ACTIVE' ? '#3b82f6' : '#4a5568'
                }}>
                  {s.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}