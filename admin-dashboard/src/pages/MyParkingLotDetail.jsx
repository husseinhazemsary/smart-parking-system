import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, Phone, DoorOpen, ParkingSquare, Pencil, X } from 'lucide-react'
import api from '../api/axios'
import { T } from '../constants/theme'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
const CATEGORIES = ['MALL','UNIVERSITY','AIRPORT','STREET','OTHER']
const statusColor = { AVAILABLE: T.success, OCCUPIED: T.danger, RESERVED: T.warning }
const statusBg    = { AVAILABLE: 'rgba(34,197,94,0.1)', OCCUPIED: 'rgba(239,68,68,0.1)', RESERVED: 'rgba(245,158,11,0.1)' }

export default function MyParkingLotDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [lot,     setLot]     = useState(location.state?.lot ?? null)
  const [slots,   setSlots]   = useState([])
  const [loading, setLoading] = useState(true)

  const [showEdit,     setShowEdit]     = useState(false)
  const [editForm,     setEditForm]     = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [saveErr,      setSaveErr]      = useState('')
  const [amenityInput, setAmenityInput] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/my-lots'),
      api.get(`/api/parking-lots/${id}/slots`).catch(() => ({ data: [] })),
    ]).then(([lotsRes, slotsRes]) => {
      const found = lotsRes.data.find(l => l.id === id)
      if (found) setLot(found)
      setSlots(slotsRes.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  function openEdit() {
    setEditForm({
      name:             lot.name            ?? '',
      nameAr:           lot.nameAr          ?? '',
      address:          lot.address         ?? '',
      addressAr:        lot.addressAr       ?? '',
      phoneNumber:      lot.phoneNumber     ?? '',
      latitude:         lot.latitude        ?? '',
      longitude:        lot.longitude       ?? '',
      hourlyRate:       lot.hourlyRate      ?? '',
      openingTime:      lot.openingTime     ?? '07:00',
      closingTime:      lot.closingTime     ?? '23:00',
      numberOfGates:    lot.numberOfGates   ?? 1,
      imageUrl:         lot.imageUrl        ?? '',
      hasSubscriptions: lot.hasSubscriptions ?? false,
      amenities:        lot.amenities       ? [...lot.amenities] : [],
      operatingDays:    lot.operatingDays   ? [...lot.operatingDays] : [...DAYS],
      category:         lot.category        ?? 'OTHER',
    })
    setAmenityInput('')
    setSaveErr('')
    setShowEdit(true)
  }

  function toggleDay(day) {
    setEditForm(f => ({
      ...f,
      operatingDays: f.operatingDays.includes(day)
        ? f.operatingDays.filter(d => d !== day)
        : [...f.operatingDays, day]
    }))
  }

  function addAmenity() {
    const val = amenityInput.trim()
    if (!val || editForm.amenities.includes(val)) return
    setEditForm(f => ({ ...f, amenities: [...f.amenities, val] }))
    setAmenityInput('')
  }

  function removeAmenity(a) {
    setEditForm(f => ({ ...f, amenities: f.amenities.filter(x => x !== a) }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveErr('')
    try {
      const res = await api.put(`/api/admin/my-lots/${id}`, {
        ...editForm,
        latitude:      parseFloat(editForm.latitude),
        longitude:     parseFloat(editForm.longitude),
        hourlyRate:    parseFloat(editForm.hourlyRate),
        numberOfGates: parseInt(editForm.numberOfGates),
      })
      setLot(res.data)
      setShowEdit(false)
    } catch (err) {
      setSaveErr(err.response?.data?.detail ?? 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !lot) return <div style={{ color: T.textMuted }}>Loading...</div>
  if (!lot)            return <div style={{ color: T.danger }}>Lot not found.</div>

  const byStatus = slots.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button onClick={() => navigate('/my-lots')} style={{
          background: T.border, border: `1px solid ${T.borderHover}`, color: T.textSecondary,
          padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
        }}>
          <ArrowLeft size={15}/> Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>{lot.name}</h1>
          {lot.nameAr && <div style={{ color: T.textSecondary, fontSize: 14, marginTop: 2 }}>{lot.nameAr}</div>}
        </div>
        <button onClick={openEdit} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: T.accent, border: 'none', color: '#fff',
          padding: '9px 16px', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer'
        }}>
          <Pencil size={14}/> Edit Lot
        </button>
      </div>

      {/* Image */}
      {lot.imageUrl && (
        <img src={lot.imageUrl} alt={lot.name} style={{
          width: '100%', maxHeight: 240, objectFit: 'cover',
          borderRadius: 12, marginBottom: 24
        }}/>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Info */}
        <div className="card">
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <InfoRow icon={<MapPin size={14}/>}      label="Address"     value={lot.address}/>
            {lot.addressAr && <InfoRow icon={<MapPin size={14}/>} label="Address (AR)" value={lot.addressAr}/>}
            <InfoRow icon={<Clock size={14}/>}       label="Hours"       value={`${lot.openingTime} – ${lot.closingTime}`}/>
            <InfoRow icon={<DoorOpen size={14}/>}    label="Gates"       value={`${lot.numberOfGates} gate${lot.numberOfGates !== 1 ? 's' : ''}`}/>
            <InfoRow icon={<ParkingSquare size={14}/>} label="Rate"      value={`${lot.hourlyRate} EGP / hr`}/>
            {lot.phoneNumber && <InfoRow icon={<Phone size={14}/>} label="Phone" value={lot.phoneNumber}/>}
            {lot.category && <InfoRow icon={null} label="Category" value={lot.category.charAt(0) + lot.category.slice(1).toLowerCase()}/>}
            <InfoRow icon={null} label="Subscriptions" value={lot.hasSubscriptions ? 'Yes' : 'No'}/>
          </div>
        </div>

        {/* Slots summary */}
        <div className="card">
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Slot Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['AVAILABLE', 'OCCUPIED', 'RESERVED'].map(s => (
              <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: T.textSecondary }}>{s.charAt(0) + s.slice(1).toLowerCase()}</span>
                <span style={{
                  background: statusBg[s], color: statusColor[s],
                  padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600
                }}>{byStatus[s] ?? 0}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: T.textSecondary }}>Total</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{slots.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operating days */}
      {lot.operatingDays?.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Operating Days</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DAYS.map(day => {
              const active = lot.operatingDays.includes(day)
              return (
                <span key={day} style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 13,
                  background: active ? 'rgba(125,57,235,0.15)' : T.bgInput,
                  color: active ? T.accent : T.textMuted,
                  border: `1px solid ${active ? T.accent : T.border}`,
                  fontWeight: active ? 600 : 400
                }}>{day.slice(0, 3)}</span>
              )
            })}
          </div>
        </div>
      )}

      {/* Amenities */}
      {lot.amenities?.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Amenities</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {lot.amenities.map(a => (
              <span key={a} style={{
                background: T.border, color: T.textSecondary,
                padding: '4px 12px', borderRadius: 20, fontSize: 12
              }}>{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && editForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, width: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>Edit — {lot.name}</span>
              <button onClick={() => setShowEdit(false)} style={{ background: 'none', border: 'none', color: T.textSecondary, cursor: 'pointer' }}><X size={20}/></button>
            </div>
            {saveErr && <div style={{ color: T.danger, marginBottom: 16, fontSize: 13 }}>{saveErr}</div>}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Section label="Basic Info">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <EField label="Name (EN)"    value={editForm.name}        onChange={e => setEditForm(f => ({...f, name: e.target.value}))}        required/>
                  <EField label="Name (AR)"    value={editForm.nameAr}      onChange={e => setEditForm(f => ({...f, nameAr: e.target.value}))}/>
                  <EField label="Address (EN)" value={editForm.address}     onChange={e => setEditForm(f => ({...f, address: e.target.value}))}     required/>
                  <EField label="Address (AR)" value={editForm.addressAr}   onChange={e => setEditForm(f => ({...f, addressAr: e.target.value}))}/>
                  <EField label="Phone"        value={editForm.phoneNumber} onChange={e => setEditForm(f => ({...f, phoneNumber: e.target.value}))}/>
                  <EField label="Image URL"    value={editForm.imageUrl}    onChange={e => setEditForm(f => ({...f, imageUrl: e.target.value}))}/>
                  <ESelectField label="Category" value={editForm.category} options={CATEGORIES} onChange={e => setEditForm(f => ({...f, category: e.target.value}))}/>
                </div>
              </Section>
              <Section label="Location & Pricing">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <EField label="Latitude"          value={editForm.latitude}      onChange={e => setEditForm(f => ({...f, latitude: e.target.value}))}      required type="number" step="any"/>
                  <EField label="Longitude"         value={editForm.longitude}     onChange={e => setEditForm(f => ({...f, longitude: e.target.value}))}     required type="number" step="any"/>
                  <EField label="Hourly Rate (EGP)" value={editForm.hourlyRate}    onChange={e => setEditForm(f => ({...f, hourlyRate: e.target.value}))}    required type="number" step="0.01"/>
                  <EField label="Number of Gates"   value={editForm.numberOfGates} onChange={e => setEditForm(f => ({...f, numberOfGates: e.target.value}))} type="number" min="1"/>
                  <EField label="Opening Time"      value={editForm.openingTime}   onChange={e => setEditForm(f => ({...f, openingTime: e.target.value}))}   type="time"/>
                  <EField label="Closing Time"      value={editForm.closingTime}   onChange={e => setEditForm(f => ({...f, closingTime: e.target.value}))}   type="time"/>
                </div>
              </Section>
              <Section label="Operating Days">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DAYS.map(day => {
                    const active = editForm.operatingDays.includes(day)
                    return (
                      <button key={day} type="button" onClick={() => toggleDay(day)} style={{
                        padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                        background: active ? 'rgba(125,57,235,0.15)' : T.bgInput,
                        color: active ? T.accent : T.textMuted,
                        border: `1px solid ${active ? T.accent : T.border}`,
                        fontWeight: active ? 600 : 400
                      }}>{day.slice(0, 3)}</button>
                    )
                  })}
                </div>
              </Section>
              <Section label="Amenities">
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={amenityInput}
                    onChange={e => setAmenityInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
                    placeholder="Type an amenity and press Enter"
                    style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, color: '#fff', padding: '9px 12px', borderRadius: 8, fontSize: 13, outline: 'none' }}
                  />
                  <button type="button" onClick={addAmenity} style={{ background: T.border, border: `1px solid ${T.borderHover}`, color: T.textSecondary, padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {editForm.amenities.map(a => (
                    <span key={a} style={{ background: T.border, color: T.textSecondary, padding: '4px 10px', borderRadius: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {a}
                      <button type="button" onClick={() => removeAmenity(a)} style={{ background: 'none', border: 'none', color: T.danger, cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
                    </span>
                  ))}
                </div>
              </Section>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textSecondary, cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.hasSubscriptions} onChange={e => setEditForm(f => ({...f, hasSubscriptions: e.target.checked}))}/>
                Has subscription plans
              </label>
              <button type="submit" disabled={saving} style={{ background: T.accent, border: 'none', color: '#fff', padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon && <span style={{ color: T.textMuted, flexShrink: 0 }}>{icon}</span>}
      <span style={{ color: T.textMuted, minWidth: 100, flexShrink: 0 }}>{label}</span>
      <span style={{ color: T.textPrimary }}>{value}</span>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  )
}

function EField({ label, value, onChange, required, type = 'text', step, min }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: T.textMuted }}>{label}{required && ' *'}</label>
      <input value={value} onChange={onChange} required={required} type={type} step={step} min={min}
        style={{ background: T.bgInput, border: `1px solid ${T.border}`, color: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }}/>
    </div>
  )
}

function ESelectField({ label, value, onChange, options, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: T.textMuted }}>{label}{required && ' *'}</label>
      <select value={value} onChange={onChange} required={required}
        style={{ background: T.bgInput, border: `1px solid ${T.border}`, color: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}>
        {options.map(opt => <option key={opt} value={opt}>{opt.charAt(0) + opt.slice(1).toLowerCase()}</option>)}
      </select>
    </div>
  )
}
