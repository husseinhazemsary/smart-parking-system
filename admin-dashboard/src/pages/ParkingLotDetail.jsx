import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, Phone, DoorOpen, ParkingSquare, Pencil, X, Plus, Trash2, ExternalLink } from 'lucide-react'
import api from '../api/axios'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
const CATEGORIES = ['MALL','UNIVERSITY','AIRPORT','STREET','OTHER']
const statusColor = { AVAILABLE: '#22c55e', OCCUPIED: '#ef4444', RESERVED: '#f59e0b' }
const statusBg    = { AVAILABLE: 'rgba(34,197,94,0.1)', OCCUPIED: 'rgba(239,68,68,0.1)', RESERVED: 'rgba(245,158,11,0.1)' }
const typeColor   = { REGULAR: '#94a3b8', DISABLED: '#a78bfa', EV: '#34d399' }

export default function ParkingLotDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [lot,     setLot]     = useState(null)
  const [slots,   setSlots]   = useState([])
  const [gates,   setGates]   = useState([])
  const [loading, setLoading] = useState(true)

  // edit lot
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [saveErr,  setSaveErr]  = useState('')

  // add gate
  const [newGate,    setNewGate]    = useState({ name: '', location: '' })
  const [addingGate, setAddingGate] = useState(false)
  const [showGateForm, setShowGateForm] = useState(false)

  // amenity input
  const [amenityInput, setAmenityInput] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/api/parking-lots/${id}`),
      api.get(`/api/parking-lots/${id}/slots`),
      api.get(`/api/parking-lots/${id}/gates`),
    ]).then(([lotRes, slotsRes, gatesRes]) => {
      setLot(lotRes.data)
      setSlots(slotsRes.data)
      setGates(gatesRes.data)
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
      const res = await api.put(`/api/parking-lots/${id}`, {
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

  async function handleAddGate(e) {
    e.preventDefault()
    setAddingGate(true)
    try {
      const res = await api.post(`/api/parking-lots/${id}/gates`, newGate)
      setGates(g => [...g, res.data])
      setNewGate({ name: '', location: '' })
      setShowGateForm(false)
    } catch (err) {
      alert(err.response?.data?.detail ?? 'Failed to add gate')
    } finally {
      setAddingGate(false)
    }
  }

  async function handleRemoveGate(gateId) {
    if (!confirm('Remove this gate?')) return
    try {
      await api.delete(`/api/parking-lots/${id}/gates/${gateId}`)
      setGates(g => g.filter(x => x.id !== gateId))
    } catch {
      alert('Failed to remove gate')
    }
  }

  if (loading) return <div style={{ color: '#4a5568' }}>Loading...</div>
  if (!lot)    return <div style={{ color: '#ef4444' }}>Lot not found.</div>

  const available = slots.filter(s => s.status === 'AVAILABLE').length
  const occupied  = slots.filter(s => s.status === 'OCCUPIED').length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button onClick={() => navigate('/parking-lots')} style={{
          background: '#1a2540', border: 'none', color: '#94a3b8',
          width: 38, height: 38, borderRadius: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ArrowLeft size={18}/>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>{lot.name}</h1>
        </div>
        <button onClick={openEdit} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#1a2540', border: '1px solid #2a3550', color: '#94a3b8',
          padding: '9px 16px', borderRadius: 8, fontSize: 14, cursor: 'pointer'
        }}>
          <Pencil size={15}/> Edit
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Info card */}
          <div className="card">
            {lot.imageUrl && (
              <img src={lot.imageUrl} alt={lot.name} style={{
                width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 20
              }}/>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InfoRow icon={<MapPin size={15}/>}        label="Address"      value={lot.address}/>
              {lot.addressAr && <InfoRow icon={<MapPin size={15}/>} label="Address (AR)" value={lot.addressAr}/>}
              <InfoRow icon={<Clock size={15}/>}         label="Hours"        value={`${lot.openingTime?.slice(0,5)} – ${lot.closingTime?.slice(0,5)}`}/>
              {lot.phoneNumber && <InfoRow icon={<Phone size={15}/>} label="Phone" value={lot.phoneNumber}/>}
              <InfoRow icon={<DoorOpen size={15}/>}      label="Gates"        value={lot.numberOfGates}/>
              <InfoRow icon={<ParkingSquare size={15}/>} label="Hourly Rate"  value={`${lot.hourlyRate} EGP/hr`}/>
            </div>
            {lot.amenities?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: '#4a5568', marginBottom: 8 }}>Amenities</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {lot.amenities.map(a => (
                    <span key={a} style={{
                      background: '#1a2540', color: '#94a3b8',
                      padding: '4px 12px', borderRadius: 20, fontSize: 12
                    }}>{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Slots */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Parking Slots</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#22c55e' }}>{available} available</span>
                <span style={{ fontSize: 13, color: '#ef4444' }}>{occupied} occupied</span>
                <button onClick={() => navigate('/slots', { state: { lotId: id, lotName: lot.name } })} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#1a2540', border: '1px solid #2a3550', color: '#94a3b8',
                  padding: '5px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer'
                }}>
                  <ExternalLink size={12}/> View Slots
                </button>
              </div>
            </div>
            {slots.length === 0 ? (
              <div style={{ color: '#4a5568', fontSize: 13 }}>No slots added yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                {slots.map(slot => (
                  <div key={slot.id} style={{
                    background: statusBg[slot.status] ?? '#1a2540',
                    border: `1px solid ${statusColor[slot.status] ?? '#2a3550'}`,
                    borderRadius: 8, padding: '10px 8px', textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{slot.slotLabel}</div>
                    <div style={{ fontSize: 11, color: typeColor[slot.slotType] ?? '#94a3b8', marginTop: 2 }}>{slot.slotType}</div>
                    <div style={{ fontSize: 11, color: statusColor[slot.status], marginTop: 2 }}>{slot.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Availability */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Availability</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: available > 0 ? '#22c55e' : '#ef4444' }}>{available}</div>
            <div style={{ color: '#4a5568', fontSize: 13 }}>of {slots.length} slots available</div>
            <div style={{ marginTop: 16, background: '#1a2540', borderRadius: 8, height: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 8,
                width: slots.length > 0 ? `${(available / slots.length) * 100}%` : '0%',
                background: available / slots.length > 0.5 ? '#22c55e' : available / slots.length > 0.2 ? '#f59e0b' : '#ef4444',
                transition: 'width 0.3s'
              }}/>
            </div>
          </div>

          {/* Gates */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Gates</span>
              <button onClick={() => setShowGateForm(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: '#1a2540', border: '1px solid #2a3550', color: '#94a3b8',
                padding: '5px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer'
              }}>
                <Plus size={12}/> Add
              </button>
            </div>

            {showGateForm && (
              <form onSubmit={handleAddGate} style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input placeholder="Gate name *" value={newGate.name} required
                  onChange={e => setNewGate(g => ({...g, name: e.target.value}))}
                  style={{ background: '#131c30', border: '1px solid #1a2540', color: '#fff', padding: '8px 10px', borderRadius: 6, fontSize: 13, outline: 'none' }}/>
                <input placeholder="Location (optional)" value={newGate.location}
                  onChange={e => setNewGate(g => ({...g, location: e.target.value}))}
                  style={{ background: '#131c30', border: '1px solid #1a2540', color: '#fff', padding: '8px 10px', borderRadius: 6, fontSize: 13, outline: 'none' }}/>
                <button type="submit" disabled={addingGate} style={{
                  background: '#3b82f6', border: 'none', color: '#fff', padding: '8px',
                  borderRadius: 6, fontSize: 13, cursor: 'pointer', opacity: addingGate ? 0.6 : 1
                }}>
                  {addingGate ? 'Adding...' : 'Add Gate'}
                </button>
              </form>
            )}

            {gates.length === 0 ? (
              <div style={{ color: '#4a5568', fontSize: 13 }}>No gates yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {gates.map(gate => (
                  <div key={gate.id} style={{
                    background: '#131c30', borderRadius: 8, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}>
                    <DoorOpen size={16} color="#3b82f6"/>
                    <span style={{ flex: 1, fontSize: 14 }}>{gate.name}</span>
                    <button onClick={() => handleRemoveGate(gate.id)} style={{
                      background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer',
                      padding: 4, display: 'flex', alignItems: 'center'
                    }}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operating days */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Operating Days</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DAYS.map(day => {
                const active = lot.operatingDays?.includes(day)
                return (
                  <span key={day} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12,
                    background: active ? 'rgba(59,130,246,0.15)' : '#131c30',
                    color: active ? '#3b82f6' : '#4a5568',
                    border: `1px solid ${active ? '#3b82f6' : '#1a2540'}`
                  }}>
                    {day.slice(0, 3)}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && editForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#0d1426', border: '1px solid #1a2540', borderRadius: 16,
            padding: 32, width: 600, maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>Edit Parking Lot</span>
              <button onClick={() => setShowEdit(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20}/>
              </button>
            </div>

            {saveErr && <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 13 }}>{saveErr}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Basic info */}
              <Section label="Basic Info">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <EField label="Name (EN)" name="name" value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} required/>
                  <EField label="Name (AR)" name="nameAr" value={editForm.nameAr} onChange={e => setEditForm(f => ({...f, nameAr: e.target.value}))}/>
                  <EField label="Address (EN)" name="address" value={editForm.address} onChange={e => setEditForm(f => ({...f, address: e.target.value}))} required/>
                  <EField label="Address (AR)" name="addressAr" value={editForm.addressAr} onChange={e => setEditForm(f => ({...f, addressAr: e.target.value}))}/>
                  <EField label="Phone Number" name="phoneNumber" value={editForm.phoneNumber} onChange={e => setEditForm(f => ({...f, phoneNumber: e.target.value}))}/>
                  <EField label="Image URL" name="imageUrl" value={editForm.imageUrl} onChange={e => setEditForm(f => ({...f, imageUrl: e.target.value}))}/>
                  <ESelectField label="Category" value={editForm.category} onChange={e => setEditForm(f => ({...f, category: e.target.value}))} options={CATEGORIES}/>
                </div>
              </Section>

              {/* Location & pricing */}
              <Section label="Location & Pricing">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <EField label="Latitude"  name="latitude"   value={editForm.latitude}   onChange={e => setEditForm(f => ({...f, latitude: e.target.value}))}   required type="number" step="any"/>
                  <EField label="Longitude" name="longitude"  value={editForm.longitude}  onChange={e => setEditForm(f => ({...f, longitude: e.target.value}))}  required type="number" step="any"/>
                  <EField label="Hourly Rate (EGP)" name="hourlyRate" value={editForm.hourlyRate} onChange={e => setEditForm(f => ({...f, hourlyRate: e.target.value}))} required type="number" step="0.01"/>
                  <EField label="Number of Gates" name="numberOfGates" value={editForm.numberOfGates} onChange={e => setEditForm(f => ({...f, numberOfGates: e.target.value}))} type="number" min="1"/>
                  <EField label="Opening Time" name="openingTime" value={editForm.openingTime} onChange={e => setEditForm(f => ({...f, openingTime: e.target.value}))} type="time"/>
                  <EField label="Closing Time" name="closingTime" value={editForm.closingTime} onChange={e => setEditForm(f => ({...f, closingTime: e.target.value}))} type="time"/>
                </div>
              </Section>

              {/* Operating days */}
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

              {/* Amenities */}
              <Section label="Amenities">
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={amenityInput}
                    onChange={e => setAmenityInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
                    placeholder="Type an amenity and press Enter"
                    style={{
                      flex: 1, background: '#131c30', border: '1px solid #1a2540',
                      color: '#fff', padding: '9px 12px', borderRadius: 8,
                      fontSize: 13, outline: 'none'
                    }}
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

              {/* Subscription toggle */}
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

function EField({ label, name, value, onChange, required, type = 'text', step, min }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: '#4a5568' }}>{label}{required && ' *'}</label>
      <input
        name={name} value={value} onChange={onChange} required={required}
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

function InfoRow({ icon, label, value, rtl }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 14, direction: rtl ? 'rtl' : 'ltr' }}>{value}</div>
    </div>
  )
}
