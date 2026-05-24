import { useState } from 'react'
import { Wifi, WifiOff, Plus, Trash2, RefreshCw } from 'lucide-react'
import { T } from '../constants/theme'

const mockCameras = [
  { id: '0001', name: 'Entry Gate 1', type: 'ENTRY', location: 'Arkan Plaza', online: true  },
  { id: '0002', name: 'Exit Gate 1',  type: 'EXIT',  location: 'Arkan Plaza', online: true  },
  { id: '0003', name: 'Floor 1',      type: 'FLOOR', location: 'Parking Floor 1 | Arkan Plaza', online: true  },
  { id: '0004', name: 'Floor 2',      type: 'FLOOR', location: 'Parking Floor 2 | Arkan Plaza', online: false },
]

export default function LiveFeed() {
  const [cameras, setCameras] = useState(mockCameras)

  function removeCamera(id) {
    setCameras(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div className="page-header">
          <h1>Cameras</h1>
          <p>Surveillance and detection feeds</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: T.border, border: `1px solid ${T.borderHover}`,
          color: T.textPrimary, padding: '10px 18px', borderRadius: 10,
          cursor: 'pointer', fontSize: 14, fontWeight: 500
        }}>
          <Plus size={16}/> Add Camera
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {cameras.map(cam => (
          <div key={cam.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>

            {/* Camera feed */}
            <div style={{
              height: 220, background: cam.online ? T.bgCard : T.bgDeep,
              position: 'relative', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              {cam.online ? (
                <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${T.bgInput}, ${T.bgCard})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 48 }}>📷</div>
                </div>
              ) : (
                <WifiOff size={40} color={T.borderHover}/>
              )}

              {/* Status badge */}
              <div style={{
                position: 'absolute', top: 12, right: 12,
                display: 'flex', alignItems: 'center', gap: 6,
                background: cam.online ? T.success : T.danger,
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700
              }}>
                {cam.online ? <Wifi size={11}/> : <WifiOff size={11}/>}
                {cam.online ? 'ONLINE' : 'OFFLINE'}
              </div>

              {/* ID */}
              <div style={{
                position: 'absolute', bottom: 10, left: 12,
                fontSize: 11, color: 'rgba(255,255,255,0.6)'
              }}>
                ID: {cam.id}
              </div>
            </div>

            {/* Camera info */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
                  {cam.name} <RefreshCw size={13} color={T.textMuted} style={{ cursor: 'pointer' }}/>
                </div>
                <button
                  onClick={() => removeCamera(cam.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', color: T.danger,
                    cursor: 'pointer', fontSize: 12
                  }}>
                  <Trash2 size={13}/> Remove
                </button>
              </div>
              <div style={{ fontSize: 12, color: T.textMuted }}>
                {cam.type} | {cam.location}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
