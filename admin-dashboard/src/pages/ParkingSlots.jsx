import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X, Car } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const statusColor = {
  AVAILABLE:   { border: '#22c55e', bg: 'rgba(34,197,94,0.08)',  text: '#22c55e' },
  OCCUPIED:    { border: '#ef4444', bg: 'rgba(239,68,68,0.08)',  text: '#ef4444' },
  RESERVED:    { border: '#eab308', bg: 'rgba(234,179,8,0.08)',  text: '#eab308' },
  MAINTENANCE: { border: '#64748b', bg: 'rgba(100,116,139,0.08)', text: '#64748b' },
}

export default function ParkingSlots() {
  const location = useLocation()
  const { user, isSuperAdmin } = useAuth()

  const [lots,      setLots]      = useState([])
  const [selectedLotId, setSelectedLotId] = useState(location.state?.lotId ?? '')
  const [slots,     setSlots]     = useState([])
  const [selected,  setSelected]  = useState(null)
  const [loadingLots,  setLoadingLots]  = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    if (isSuperAdmin) {
      api.get('/api/parking-lots')
        .then(r => setLots(r.data))
        .catch(console.error)
        .finally(() => setLoadingLots(false))
    } else {
      // lot admin: only their assigned lot
      if (user?.assignedLotId) {
        setLots([{ id: user.assignedLotId, name: user.assignedLotName ?? 'My Lot' }])
        setSelectedLotId(s => s || user.assignedLotId)
      }
      setLoadingLots(false)
    }
  }, [isSuperAdmin, user])

  // load slots whenever selected lot changes
  useEffect(() => {
    if (!selectedLotId) { setSlots([]); return }
    setLoadingSlots(true)
    setSelected(null)
    api.get(`/api/parking-lots/${selectedLotId}/slots`)
      .then(r => setSlots(r.data))
      .catch(console.error)
      .finally(() => setLoadingSlots(false))
  }, [selectedLotId])

  const selectedLot = lots.find(l => l.id === selectedLotId)
  const available   = slots.filter(s => s.status === 'AVAILABLE').length
  const occupied    = slots.filter(s => s.status === 'OCCUPIED').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div className="page-header">
          <h1>Parking Slots</h1>
          <p>Visual grid and status per parking lot</p>
        </div>

        {/* Lot selector */}
        <select
          value={selectedLotId}
          onChange={e => setSelectedLotId(e.target.value)}
          style={{
            background: '#0d1426', border: '1px solid #1a2540',
            color: selectedLotId ? '#fff' : '#4a5568',
            padding: '10px 16px', borderRadius: 8, fontSize: 14, minWidth: 220
          }}
        >
          <option value="">Select a parking lot</option>
          {lots.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {!selectedLotId ? (
        <div style={{
          textAlign: 'center', padding: '60px 0', color: '#4a5568', fontSize: 15
        }}>
          Select a parking lot from the dropdown to view its slots.
        </div>
      ) : loadingSlots ? (
        <div style={{ color: '#4a5568' }}>Loading slots...</div>
      ) : (
        <>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}/>
              <span style={{ fontSize: 14 }}><b>{available}</b> Available</span>
            </div>
            <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}/>
              <span style={{ fontSize: 14 }}><b>{occupied}</b> Occupied</span>
            </div>
            <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#94a3b8' }}/>
              <span style={{ fontSize: 14 }}><b>{slots.length}</b> Total</span>
            </div>
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

          {slots.length === 0 ? (
            <div style={{ color: '#4a5568', fontSize: 14 }}>No slots found for this parking lot.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12, marginBottom: 24 }}>
              {slots.map(slot => {
                const c = statusColor[slot.status] || statusColor.AVAILABLE
                return (
                  <div
                    key={slot.id}
                    onClick={() => slot.status !== 'AVAILABLE' && setSelected(slot)}
                    style={{
                      border: `2px solid ${c.border}`, background: c.bg,
                      borderRadius: 10, padding: '14px 8px', textAlign: 'center',
                      cursor: slot.status !== 'AVAILABLE' ? 'pointer' : 'default',
                      transition: 'transform 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{slot.slotLabel}</div>
                    <div style={{ fontSize: 10, color: c.text, marginTop: 4 }}>{slot.slotType}</div>
                    {slot.status !== 'AVAILABLE' ? (
                      <Car size={18} color={c.text} style={{ margin: '4px auto 0' }}/>
                    ) : (
                      <div style={{ fontSize: 10, color: c.text, marginTop: 4 }}>Free</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
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
                <div style={{ fontWeight: 700, fontSize: 16 }}>Slot {selected.slotLabel} Details</div>
                <div style={{ fontSize: 12, color: '#4a5568' }}>{selectedLot?.name}</div>
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
              ['STATUS', selected.status],
              ['TYPE',   selected.slotType],
              ['LOT',    selectedLot?.name ?? '—'],
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
