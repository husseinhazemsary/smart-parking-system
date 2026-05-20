import { useEffect, useState } from 'react'
import { MapPin, Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']

const empty = {
  name: '', nameAr: '', address: '', addressAr: '', phoneNumber: '',
  latitude: '', longitude: '', hourlyRate: '', openingTime: '07:00',
  closingTime: '23:00', numberOfGates: 1, imageUrl: '', hasSubscriptions: false,
  amenities: [], operatingDays: [...DAYS],
}

export default function ParkingLots() {
  const navigate = useNavigate()
  const [lots, setLots]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(empty)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [amenityInput, setAmenityInput] = useState('')

  useEffect(() => {
    api.get('/api/parking-lots')
      .then(r => setLots(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  function toggleDay(day) {
    setForm(f => ({
      ...f,
      operatingDays: f.operatingDays.includes(day)
        ? f.operatingDays.filter(d => d !== day)
        : [...f.operatingDays, day]
    }))
  }

  function addAmenity() {
    const val = amenityInput.trim()
    if (!val || form.amenities.includes(val)) return
    setForm(f => ({ ...f, amenities: [...f.amenities, val] }))
    setAmenityInput('')
  }

  function removeAmenity(a) {
    setForm(f => ({ ...f, amenities: f.amenities.filter(x => x !== a) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/api/parking-lots', {
        ...form,
        latitude:      parseFloat(form.latitude),
        longitude:     parseFloat(form.longitude),
        hourlyRate:    parseFloat(form.hourlyRate),
        numberOfGates: parseInt(form.numberOfGates),
      })
      setLots(l => [...l, res.data])
      setShowForm(false)
      setForm(empty)
      setAmenityInput('')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to create parking lot')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0 }}>Parking Lots</h1>
          <p style={{ color: '#4a5568', margin: '4px 0 0' }}>Manage all parking facilities</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#3b82f6', border: 'none', color: '#fff',
          padding: '10px 18px', borderRadius: 10, fontSize: 14,
          fontWeight: 600, cursor: 'pointer'
        }}>
          <Plus size={16}/> Add Parking Lot
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#4a5568' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {lots.map(lot => (
            <div key={lot.id} className="card" onClick={() => navigate(`/parking-lots/${lot.id}`)}
              style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = ''}
            >
              {lot.imageUrl && (
                <img src={lot.imageUrl} alt={lot.name} style={{
                  width: '100%', height: 140, objectFit: 'cover',
                  borderRadius: 8, marginBottom: 12
                }}/>
              )}
              <div style={{ fontWeight: 700, fontSize: 15 }}>{lot.name}</div>
              {lot.nameAr && <div style={{ color: '#94a3b8', fontSize: 13 }}>{lot.nameAr}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4a5568', fontSize: 13, marginTop: 6 }}>
                <MapPin size={13}/> {lot.address}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 13 }}>
                <span style={{ color: '#3b82f6' }}>{lot.hourlyRate} EGP/hr</span>
                <span style={{ color: '#4a5568' }}>{lot.openingTime} – {lot.closingTime}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <span style={{
                  background: lot.availableSlots > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: lot.availableSlots > 0 ? '#22c55e' : '#ef4444',
                  padding: '3px 10px', borderRadius: 20, fontSize: 12
                }}>
                  {lot.availableSlots ?? '—'} / {lot.totalSlots ?? '—'} available
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Lot Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#0d1426', border: '1px solid #1a2540', borderRadius: 16,
            padding: 32, width: 600, maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>Add Parking Lot</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20}/>
              </button>
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 13 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <Section label="Basic Info">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Name (EN)" name="name" value={form.name} onChange={handleChange} required/>
                  <Field label="Name (AR)" name="nameAr" value={form.nameAr} onChange={handleChange}/>
                  <Field label="Address (EN)" name="address" value={form.address} onChange={handleChange} required/>
                  <Field label="Address (AR)" name="addressAr" value={form.addressAr} onChange={handleChange}/>
                  <Field label="Phone Number" name="phoneNumber" value={form.phoneNumber} onChange={handleChange}/>
                  <Field label="Image URL" name="imageUrl" value={form.imageUrl} onChange={handleChange}/>
                </div>
              </Section>

              <Section label="Location & Pricing">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Latitude"  name="latitude"  value={form.latitude}  onChange={handleChange} required type="number" step="any"/>
                  <Field label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} required type="number" step="any"/>
                  <Field label="Hourly Rate (EGP)" name="hourlyRate" value={form.hourlyRate} onChange={handleChange} required type="number" step="0.01"/>
                  <Field label="Number of Gates" name="numberOfGates" value={form.numberOfGates} onChange={handleChange} type="number" min="1"/>
                  <Field label="Opening Time" name="openingTime" value={form.openingTime} onChange={handleChange} type="time"/>
                  <Field label="Closing Time" name="closingTime" value={form.closingTime} onChange={handleChange} type="time"/>
                </div>
              </Section>

              <Section label="Operating Days">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DAYS.map(day => {
                    const active = form.operatingDays.includes(day)
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
                  {form.amenities.map(a => (
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
                <input type="checkbox" name="hasSubscriptions" checked={form.hasSubscriptions} onChange={handleChange}/>
                Has subscription plans
              </label>

              <button type="submit" disabled={saving} style={{
                background: '#3b82f6', border: 'none', color: '#fff',
                padding: '12px', borderRadius: 10, fontSize: 15,
                fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}>
                {saving ? 'Creating...' : 'Create Parking Lot'}
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

function Field({ label, name, value, onChange, required, type = 'text', step, min }) {
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
