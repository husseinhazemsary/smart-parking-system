import { useEffect, useState } from 'react'
import { Plus, X, User, Pencil } from 'lucide-react'
import api from '../api/axios'
import PasswordField from '../components/PasswordField'

const emptyCreate = { fullName: '', email: '', password: '', phoneNumber: '', assignedLotId: '' }
const emptyEdit   = { fullName: '', email: '', password: '', phoneNumber: '', assignedLotId: '' }

const TEXT_FIELDS = [
  { label: 'Full Name',    name: 'fullName',    type: 'text',  required: true  },
  { label: 'Email',        name: 'email',       type: 'email', required: true  },
  { label: 'Phone Number', name: 'phoneNumber', type: 'tel',   required: false },
]

function AdminForm({ form, onChange, onSubmit, submitLabel, isEdit, lots, saving }) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {TEXT_FIELDS.map(f => (
        <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, color: '#4a5568' }}>{f.label}{f.required ? ' *' : ''}</label>
          <input
            name={f.name} type={f.type} value={form[f.name]}
            onChange={onChange} required={f.required}
            style={{
              background: '#131c30', border: '1px solid #1a2540',
              color: '#fff', padding: '10px 12px', borderRadius: 8,
              fontSize: 13, outline: 'none'
            }}
          />
        </div>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 12, color: '#4a5568' }}>
          {isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}
        </label>
        <PasswordField
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder={isEdit ? 'Leave blank to keep current' : 'Password'}
          required={!isEdit}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 12, color: '#4a5568' }}>Assigned Parking Lot *</label>
        <select
          name="assignedLotId" value={form.assignedLotId}
          onChange={onChange} required
          style={{
            background: '#131c30', border: '1px solid #1a2540',
            color: form.assignedLotId ? '#fff' : '#4a5568',
            padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none'
          }}
        >
          <option value="">Select a parking lot</option>
          {lots.map(lot => (
            <option key={lot.id} value={lot.id}>{lot.name}</option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={saving} style={{
        background: '#3b82f6', border: 'none', color: '#fff',
        padding: '12px', borderRadius: 10, fontSize: 15,
        fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 8,
        opacity: saving ? 0.6 : 1
      }}>
        {saving ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}

function Modal({ title, onClose, error, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#0d1426', border: '1px solid #1a2540', borderRadius: 16,
        padding: 32, width: 440, maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20}/>
          </button>
        </div>
        {error && <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 13 }}>{error}</div>}
        {children}
      </div>
    </div>
  )
}

export default function LotAdmins() {
  const [admins, setAdmins]         = useState([])
  const [lots, setLots]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [editForm, setEditForm]     = useState(emptyEdit)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/lot-admins'),
      api.get('/api/parking-lots'),
    ]).then(([adminsRes, lotsRes]) => {
      setAdmins(adminsRes.data)
      setLots(lotsRes.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function openEdit(admin) {
    setEditTarget(admin)
    setEditForm({
      fullName:      admin.fullName,
      email:         admin.email,
      phoneNumber:   admin.phoneNumber ?? '',
      assignedLotId: admin.assignedLotId ?? '',
      password:      '',
    })
    setError('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/api/admin/lot-admins', createForm)
      setAdmins(a => [...a, res.data])
      setShowCreate(false)
      setCreateForm(emptyCreate)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to create lot admin')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.put(`/api/admin/lot-admins/${editTarget.id}`, editForm)
      setAdmins(a => a.map(x => x.id === editTarget.id ? res.data : x))
      setEditTarget(null)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to update lot admin')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0 }}>Lot Admins</h1>
          <p style={{ color: '#4a5568', margin: '4px 0 0' }}>Manage parking lot administrators</p>
        </div>
        <button onClick={() => { setShowCreate(true); setError('') }} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#3b82f6', border: 'none', color: '#fff',
          padding: '10px 18px', borderRadius: 10, fontSize: 14,
          fontWeight: 600, cursor: 'pointer'
        }}>
          <Plus size={16}/> Create Lot Admin
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#4a5568' }}>Loading...</div>
      ) : admins.length === 0 ? (
        <div style={{ color: '#4a5568' }}>No lot admins yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {admins.map(admin => (
            <div key={admin.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
              <div style={{
                width: 44, height: 44, background: '#1a2540', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <User size={20} color="#3b82f6"/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{admin.fullName}</div>
                <div style={{ color: '#4a5568', fontSize: 13 }}>{admin.email}</div>
                {admin.phoneNumber && (
                  <div style={{ color: '#4a5568', fontSize: 12, marginTop: 2 }}>{admin.phoneNumber}</div>
                )}
              </div>
              <div style={{ textAlign: 'right', marginRight: 12 }}>
                <div style={{ fontSize: 12, color: '#4a5568' }}>Assigned lot</div>
                <div style={{ fontSize: 14, color: '#3b82f6', fontWeight: 600 }}>
                  {admin.assignedLotName ?? '—'}
                </div>
              </div>
              <button onClick={() => openEdit(admin)} style={{
                background: '#1a2540', border: '1px solid #2a3550', color: '#94a3b8',
                padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13
              }}>
                <Pencil size={14}/> Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Create Lot Admin" onClose={() => setShowCreate(false)} error={error}>
          <AdminForm
            form={createForm}
            onChange={e => setCreateForm(f => ({ ...f, [e.target.name]: e.target.value }))}
            onSubmit={handleCreate}
            submitLabel="Create Lot Admin"
            isEdit={false}
            lots={lots}
            saving={saving}
          />
        </Modal>
      )}

      {editTarget && (
        <Modal title={`Edit — ${editTarget.fullName}`} onClose={() => setEditTarget(null)} error={error}>
          <AdminForm
            form={editForm}
            onChange={e => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }))}
            onSubmit={handleEdit}
            submitLabel="Save Changes"
            isEdit={true}
            lots={lots}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  )
}
