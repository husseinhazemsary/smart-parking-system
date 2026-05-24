import { useEffect, useState } from 'react'
import { Car } from 'lucide-react'
import api from '../api/axios'
import { T } from '../constants/theme'

const statusBadge = {
  CONFIRMED:  'badge-green',
  PENDING:    'badge-yellow',
  CANCELLED:  'badge-red',
  COMPLETED:  'badge-blue',
}

export default function Reservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    api.get('/api/admin/reservations')
      .then(r => setReservations(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function formatDate(dt) {
    if (!dt) return '—'
    const d = new Date(dt)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1>Reservations</h1>
        <p>Active and upcoming bookings</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['VEHICLE', 'USER', 'TIME', 'STATUS', 'AMOUNT', 'ACCESS CODE'].map(h => (
                <th key={h} style={{
                  padding: '14px 20px', textAlign: 'left',
                  fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: '0.05em'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: T.textMuted }}>Loading...</td></tr>
            ) : reservations.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: T.textMuted }}>No reservations found</td></tr>
            ) : (
              reservations.map((r, i) => (
                <tr key={r.id} style={{
                  borderBottom: `1px solid ${T.bgDeep}`,
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, background: 'rgba(125,57,235,0.1)',
                        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Car size={16} color={T.accent}/>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{r.slotNumber}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: T.textSecondary }}>
                    {r.userFullName}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: 13 }}>{formatDate(r.startTime)}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>→ {formatDate(r.endTime)}</div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className={`badge ${statusBadge[r.status] || 'badge-gray'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: T.textSecondary }}>
                    {r.totalAmount} EGP
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{
                      background: T.border, padding: '6px 12px',
                      borderRadius: 8, fontSize: 13, fontWeight: 700,
                      display: 'inline-block', letterSpacing: '0.05em'
                    }}>
                      RES-{r.id?.slice(-4)?.toUpperCase()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
