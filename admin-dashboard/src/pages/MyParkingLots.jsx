import { useEffect, useState } from 'react'
import { Pencil, X, MapPin, Clock, DoorOpen, ParkingSquare } from 'lucide-react'
import api from '../api/axios'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
const CATEGORIES = ['MALL','UNIVERSITY','AIRPORT','STREET','OTHER']

export default function MyParkingLots() {
  const [lots,     setLots]     = useState([])
  const [loading,  setLoading]  = useState(true)

  // edit state
  const [editTarget, setEditTarget] = useState(null)
  const [editForm,   setEditForm]   = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [saveErr,    setSaveErr]    = useState('')
  const [amenityInput, setAmenityInput] = useState('')

  useEffect(() => {
    api.get('/api/admin/my-lots')
      .then(r => setLots(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function openEdit(lot) {
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
    setEditTarget(lot)
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
      const res = await api.put(`/api/admin/my-lots/${editTarget.id}`, {
        ...editForm,
        latitude:      parseFloat(editForm.latitude),
        longitude:     parseFloat(editForm.longitude),
        hourlyRate:    parseFloat(editForm.hourlyRate),
        numberOfGates: parseInt(editForm.numberOfGates),
      })
      setLots(l => l.map(x => x.id === editTarget.id ? res.data : x))
      setEditTarget(null)
    } catch (err) {
      setSaveErr(err.response?.data?.detail ?? 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: '#4a5568' }}>Loading...</div>

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0 }}>My Parking Lots</h1>
        <p style={{ color: '#4a5568', margin: '4px 0 0' }}>View and edit your assigned parking facilities</p>
      </div>

      {lots.length === 0 ? (
        <div style={{ color: '#4a5568' }}>No parking lots assigned to you yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {lots.map(lot => (
            <div key={lot.id} className="card">
              {lot.imageUrl && (
                <img src={lot.imageUrl} alt={lot.name} style={{
                  width: '100%', height: 140, objectFit: 'cover',
                  borderRadius: 8, marginBottom: 12
                }}/>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{lot.name}</div>
                  {lot.nameAr && <div style={{ color: '#94a3b8', fontSize: 13 }}>{lot.nameAr}</div>}
                </div>
                <button onClick={() => openEdit(lot)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#1a2540', border: '1px solid #2a3550', color: '#94a3b8',
                  padding: '7px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', flexShrink: 0
                }}>
                  <Pencil size={13}/> Edit
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#4a5568' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13}/> {lot.address}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13}/> {lot.openingTime} – {lot.closingTime}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DoorOpen size={13}/> {lot.numberOfGates} gate{lot.numberOfGates !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ParkingSquare size={13}/> {lot.hourlyRate} EGP/hr
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{
                  background: lot.availableSlots > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: lot.availableSlots > 0 ? '#22c55e' : '#ef4444',
                  padding: '3px 10px', borderRadius: 20, fontSize: 12
                }}>
                  {lot.availableSlots} / {lot.totalSlots} available
                </span>
                {lot.category && (
                  <span style={{
                    background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                    padding: '3px 10px', borderRadius: 20, fontSize: 12
                  }}>
                    {lot.category.charAt(0) + lot.category.slice(1).toLowerCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && editForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#0d1426', border: '1px solid #1a2540', borderRadius: 16,
            padding: 32, width: 600, maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>Edit — {editTarget.name}</span>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20}/>
              </button>
            </div>

            {saveErr && <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 13 }}>{saveErr}</div>}

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
                  <EField label="Latitude"         value={editForm.latitude}      onChange={e => setEditForm(f => ({...f, latitude: e.target.value}))}      required type="number" step="any"/>
                  <EField label="Longitude"        value={editForm.longitude}     onChange={e => setEditForm(f => ({...f, longitude: e.target.value}))}     required type="number" step="any"/>
                  <EField label="Hourly Rate (EGP)" value={editForm.hourlyRate}   onChange={e => setEditForm(f => ({...f, hourlyRate: e.target.value}))}    required type="number" step="0.01"/>
                  <EField label="Number of Gates"  value={editForm.numberOfGates} onChange={e => setEditForm(f => ({...f, numberOfGates: e.target.value}))} type="number" min="1"/>
                  <EField label="Opening Time"     value={editForm.openingTime}   onChange={e => setEditForm(f => ({...f, openingTime: e.target.value}))}   type="time"/>
                  <EField label="Closing Time"     value={editForm.closingTime}   onChange={e => setEditForm(f => ({...f, closingTime: e.target.value}))}   type="time"/>
                </div>
              </Section>

              <Section label="Operating Days">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DAYS.map(day => {
                    const active = editForm.operatingDays.includes(day)
                    return (
                      <button key={day} type="button" onClick={() => toggleDay(day)} style={{
                        padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                        background: active ? 'rgba(59,130,246,0.15)' : '#131c30',
                        color: active ? '#3b82f6' : '#4a5568',
                        border: `1px solid ${active ? '#3b82f6' : '#1a2540'}`,
                        fontWeight: active ? 600 : 400
                      }}>
                        {day.slice(0, 3)}
                      </button>
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
                    style={{ flex: 1, background: '#131c30', border: '1px solid #1a2540', color: '#fff', padding: '9px 12px', borderRadius: 8, fontSize: 13, outline: 'none' }}
                  />
                  <button type="button" onClick={addAmenity} style={{
                    background: '#1a2540', border: '1px solid #2a3550', color: '#94a3b8',
                    padding: '9px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13
                  }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {editForm.amenities.map(a => (
                    <span key={a} style={{
                      background: '#1a2540', color: '#94a3b8',
                      padding: '4px 10px', borderRadius: 20, fontSize: 12,
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      {a}
                      <button type="button" onClick={() => removeAmenity(a)} style={{
                        background: 'none', border: 'none', color: '#ef4444',
                        cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14
                      }}>×</button>
                    </span>
                  ))}
                </div>
              </Section>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                <input type="checkbox" checked={editForm.hasSubscriptions}
                  onChange={e => setEditForm(f => ({...f, hasSubscriptions: e.target.checked}))}/>
                Has subscription plans
              </label>

              <button type="submit" disabled={saving} style={{
                background: '#3b82f6', border: 'none', color: '#fff',
                padding: '12px', borderRadius: 10, fontSize: 15,
                fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#4a5568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  )
}

function EField({ label, value, onChange, required, type = 'text', step, min }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: '#4a5568' }}>{label}{required && ' *'}</label>
      <input
        value={value} onChange={onChange} required={required}
        type={type} step={step} min={min}
        style={{
          background: '#131c30', border: '1px solid #1a2540',
          color: '#fff', padding: '10px 12px', borderRadius: 8,
          fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box'
        }}
      />
    </div>
  )
}

function ESelectField({ label, value, onChange, options, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: '#4a5568' }}>{label}{required && ' *'}</label>
      <select
        value={value} onChange={onChange} required={required}
        style={{
          background: '#131c30', border: '1px solid #1a2540',
          color: '#fff', padding: '10px 12px', borderRadius: 8,
          fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer'
        }}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt.charAt(0) + opt.slice(1).toLowerCase()}</option>
        ))}
      </select>
    </div>
  )
}
