import { useEffect, useState } from 'react'
import { X, Car } from 'lucide-react'
import api from '../api/axios'

const statusColor = {
  AVAILABLE:   { border: '#22c55e', bg: 'rgba(34,197,94,0.08)',   text: '#22c55e' },
  OCCUPIED:    { border: '#ef4444', bg: 'rgba(239,68,68,0.08)',    text: '#ef4444' },
  RESERVED:    { border: '#eab308', bg: 'rgba(234,179,8,0.08)',    text: '#eab308' },
  MAINTENANCE: { border: '#64748b', bg: 'rgba(100,116,139,0.08)',  text: '#64748b' },
}

export default function ParkingSlots() {
  const [slots, setSlots]       = useState([])
  const [selected, setSelected] = useState(null)
  const [floor, setFloor]       = useState('Ground')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/api/admin/slots')
      .then(r => setSlots(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const floors = [...new Set(slots.map(s => s.floor).filter(Boolean))]
  const filtered = slots.filter(s => s.floor === floor || floors.length === 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div className="page-header">
          <h1>Parking Slots</h1>
          <p>Visual grid and status management</p>
        </div>
        <select
          value={floor}
          onChange={e => setFloor(e.target.value)}
          style={{
            background: '#0d1426', border: '1px solid #1a2540',
            color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 14
          }}>
          {floors.map(f => <option key={f}>{f}</option>)}
        </select>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {Object.entries(statusColor).map(([status, c]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.border }}/>
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ color: '#4a5568' }}>Loading slots...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12, marginBottom: 24 }}>
          {filtered.map(slot => {
            const c = statusColor[slot.status] || statusColor.AVAILABLE
            return (
              <div
                key={slot.id}
                onClick={() => slot.status !== 'AVAILABLE' && setSelected(slot)}
                style={{
                  border: `2px solid ${c.border}`,
                  background: c.bg, borderRadius: 10,
                  padding: '14px 8px', textAlign: 'center',
                  cursor: slot.status !== 'AVAILABLE' ? 'pointer' : 'default',
                  transition: 'transform 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{slot.slotNumber}</div>
                {slot.status !== 'AVAILABLE' ? (
                  <Car size={20} color={c.text} style={{ margin: '6px auto' }}/>
                ) : (
                  <div style={{ fontSize: 10, color: c.text, marginTop: 6 }}>Free</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Detail popup */}
      {selected && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          width: '700px', background: '#0d1426', border: '1px solid #1a2540',
          borderRadius: 16, padding: 24, zIndex: 100, boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <Car size={24} color="#3b82f6"/>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Slot {selected.slotNumber} Occupancy Details</div>
                <div style={{ fontSize: 12, color: '#4a5568' }}>Current occupant information</div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{
              background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'
            }}>
              <X size={20}/>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              ['STATUS',       selected.status],
              ['TYPE',         selected.type],
              ['PRICE/HOUR',   `${selected.pricePerHour} EGP`],
            ].map(([label, val]) => (
              <div key={label} style={{ background: '#131c30', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: '#4a5568', marginBottom: 6 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}