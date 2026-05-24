import { useEffect, useState } from 'react'
import { Plus, X, User, Pencil, Trash2, Mail, AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react'
import api from '../api/axios'
import PasswordField from '../components/PasswordField'
import { T } from '../constants/theme'

const emptyCreate = { fullName: '', email: '', phoneNumber: '', assignedLotIds: [] }
const emptyEdit   = { fullName: '', email: '', password: '', phoneNumber: '', assignedLotIds: [] }

function LotCheckboxes({ form, onChange, lots }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: T.textMuted }}>Assigned Parking Lots *</label>
      <div style={{
        background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8,
        padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6,
        maxHeight: 160, overflowY: 'auto',
      }}>
        {lots.map(lot => {
          const checked = form.assignedLotIds.includes(lot.id)
          return (
            <label key={lot.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: checked ? '#fff' : T.textSecondary }}>
              <input
                type="checkbox" checked={checked}
                onChange={e => {
                  const next = e.target.checked
                    ? [...form.assignedLotIds, lot.id]
                    : form.assignedLotIds.filter(id => id !== lot.id)
                  onChange({ target: { name: 'assignedLotIds', value: next } })
                }}
              />
              {lot.name}
            </label>
          )
        })}
      </div>
      {form.assignedLotIds.length === 0 && (
        <span style={{ fontSize: 11, color: T.danger }}>Select at least one lot</span>
      )}
    </div>
  )
}

function Modal({ title, onClose, error, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32, width: 440, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textSecondary, cursor: 'pointer' }}><X size={20}/></button>
        </div>
        {error && <div style={{ color: T.danger, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        {children}
      </div>
    </div>
  )
}

function ConfirmDialog({ message, detail, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28, width: 380 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{message}</div>
        {detail && <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 20, lineHeight: 1.5 }}>{detail}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ background: T.border, border: `1px solid ${T.borderHover}`, color: T.textSecondary, padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ background: danger ? T.danger : T.accent, border: 'none', color: '#fff', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ onClose, lots, onSuccess }) {
  const [step,   setStep]   = useState(1)
  const [form,   setForm]   = useState(emptyCreate)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleNext(e) {
    e.preventDefault()
    setError('')
    setStep(2)
  }

  async function handleConfirm() {
    setSaving(true)
    setError('')
    try {
      await api.post('/api/admin/lot-admins', form)
      onSuccess(form.email)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to send invitation')
      setStep(1)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { background: T.bgInput, border: `1px solid ${T.border}`, color: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none' }

  return (
    <Modal title="Invite Lot Admin" onClose={onClose} error={error}>
      {step === 1 ? (
        <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Full Name',    name: 'fullName',    type: 'text',  required: true  },
            { label: 'Email',        name: 'email',       type: 'email', required: true  },
            { label: 'Phone Number', name: 'phoneNumber', type: 'tel',   required: false },
          ].map(f => (
            <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: T.textMuted }}>{f.label}{f.required ? ' *' : ''}</label>
              <input name={f.name} type={f.type} value={form[f.name]} onChange={handleChange} required={f.required} style={inputStyle}/>
            </div>
          ))}
          <LotCheckboxes form={form} onChange={handleChange} lots={lots}/>
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(125,57,235,0.07)', border: '1px solid rgba(125,57,235,0.2)', fontSize: 12, color: T.textSecondary }}>
            An invitation email will be sent so the admin can set their own password.
          </div>
          <button type="submit" disabled={form.assignedLotIds.length === 0} style={{ background: T.accent, border: 'none', color: '#fff', padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: form.assignedLotIds.length === 0 ? 'not-allowed' : 'pointer', marginTop: 8, opacity: form.assignedLotIds.length === 0 ? 0.5 : 1 }}>
            Review & Send
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: T.textSecondary, margin: 0 }}>Please confirm the invitation details before sending.</p>

          <div style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Name',  value: form.fullName },
              { label: 'Phone', value: form.phoneNumber || '—' },
              { label: 'Lots',  value: lots.filter(l => form.assignedLotIds.includes(l.id)).map(l => l.name).join(', ') },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                <span style={{ color: T.textMuted, width: 48, flexShrink: 0 }}>{row.label}</span>
                <span style={{ color: '#fff' }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: 10, border: `2px solid rgba(125,57,235,0.4)`, background: 'rgba(125,57,235,0.07)', padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Invitation will be sent to</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.accentLight, wordBreak: 'break-all' }}>{form.email}</div>
          </div>

          <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>Double-check the email address — the recipient will receive a link to access the admin dashboard.</p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, background: T.border, border: `1px solid ${T.borderHover}`, color: T.textSecondary, padding: '12px', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>
              Back
            </button>
            <button onClick={handleConfirm} disabled={saving} style={{ flex: 2, background: T.accent, border: 'none', color: '#fff', padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Sending…' : 'Confirm & Send'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ContactModal({ inv, onClose }) {
  const [copied, setCopied] = useState(false)

  const subject = `EzRakna Admin Invitation — Follow-up`
  const body =
`Hi ${inv.fullName},

We noticed that your invitation to manage parking lots on EzRakna has expired without being accepted.

Please let us know if you experienced any issues or if you'd like us to send a new invitation.

Best regards,
EzRakna Team`

  function copyMessage() {
    navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(inv.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Contact Lot Admin</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textSecondary, cursor: 'pointer' }}><X size={20}/></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>To</span>
            <span style={{ fontSize: 14, color: T.accentLight, fontWeight: 600 }}>{inv.email}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Subject</span>
            <span style={{ fontSize: 13, color: T.textPrimary }}>{subject}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Message</span>
            <div style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 13, color: T.textSecondary, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {body}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={copyMessage} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: copied ? 'rgba(34,197,94,.1)' : T.border, border: `1px solid ${copied ? 'rgba(34,197,94,.3)' : T.borderHover}`, color: copied ? T.success : T.textSecondary, padding: '10px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              {copied ? <><Check size={14}/> Copied!</> : <><Copy size={14}/> Copy Message</>}
            </button>
            <a href={gmailUrl} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: T.accent, border: 'none', color: '#fff', padding: '10px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              <Mail size={14}/> Open in Gmail
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LotAdmins() {
  const [admins,            setAdmins]            = useState([])
  const [invitations,       setInvitations]       = useState([])
  const [expiredInvitations,setExpiredInvitations] = useState([])
  const [lots,              setLots]              = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showCreate,   setShowCreate]   = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [editForm,     setEditForm]     = useState(emptyEdit)
  const [saving,       setSaving]       = useState(false)
  const [editError,    setEditError]    = useState('')
  const [invitedEmail, setInvitedEmail] = useState('')

  useEffect(() => {
    if (!invitedEmail) return
    const t = setTimeout(() => setInvitedEmail(''), 5000)
    return () => clearTimeout(t)
  }, [invitedEmail])
  const [confirm,      setConfirm]      = useState(null)
  const [contactTarget,setContactTarget] = useState(null)

  function load() {
    return Promise.all([
      api.get('/api/admin/lot-admins'),
      api.get('/api/admin/invitations'),
      api.get('/api/admin/invitations/expired'),
      api.get('/api/parking-lots'),
    ]).then(([adminsRes, invRes, expiredRes, lotsRes]) => {
      setAdmins(adminsRes.data)
      setInvitations(invRes.data)
      setExpiredInvitations(expiredRes.data)
      setLots(lotsRes.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openEdit(admin) {
    setEditTarget(admin)
    setEditForm({ fullName: admin.fullName, email: admin.email, phoneNumber: admin.phoneNumber ?? '', assignedLotIds: admin.assignedLotIds ?? [], password: '' })
    setEditError('')
  }

  async function handleEdit(e) {
    e.preventDefault()
    setSaving(true)
    setEditError('')
    try {
      const res = await api.put(`/api/admin/lot-admins/${editTarget.id}`, editForm)
      setAdmins(a => a.map(x => x.id === editTarget.id ? res.data : x))
      setEditTarget(null)
    } catch (err) {
      setEditError(err.response?.data?.detail ?? 'Failed to update lot admin')
    } finally {
      setSaving(false)
    }
  }

  function askDeleteAdmin(admin) {
    setConfirm({
      message: `Delete ${admin.fullName}?`,
      detail: `This permanently deletes their account and revokes dashboard access immediately. Email: ${admin.email}`,
      confirmLabel: 'Delete Admin',
      danger: true,
      onConfirm: async () => {
        setConfirm(null)
        await api.delete(`/api/admin/lot-admins/${admin.id}`)
        setAdmins(a => a.filter(x => x.id !== admin.id))
      },
    })
  }

  function askRevokeInvitation(inv) {
    setConfirm({
      message: 'Cancel this invitation?',
      detail: `The link sent to ${inv.email} will stop working immediately.`,
      confirmLabel: 'Cancel Invitation',
      danger: true,
      onConfirm: async () => {
        setConfirm(null)
        await api.delete(`/api/admin/invitations/${inv.id}`)
        setInvitations(list => list.filter(x => x.id !== inv.id))
      },
    })
  }

  const [resendingId, setResendingId] = useState(null)

  async function handleResend(inv) {
    setResendingId(inv.id)
    try {
      await api.post(`/api/admin/invitations/${inv.id}/resend`)
      setExpiredInvitations(list => list.filter(x => x.id !== inv.id))
      setInvitedEmail(inv.email)
      load()
    } catch (err) {
      console.error(err)
    } finally {
      setResendingId(null)
    }
  }

  function askDismissExpired(inv) {
    setConfirm({
      message: 'Remove this expired invitation?',
      detail: `This removes the record for ${inv.email}. You can send a new invitation afterwards.`,
      confirmLabel: 'Remove',
      danger: true,
      onConfirm: async () => {
        setConfirm(null)
        await api.delete(`/api/admin/invitations/${inv.id}`)
        setExpiredInvitations(list => list.filter(x => x.id !== inv.id))
      },
    })
  }

  const inputStyle = { background: T.bgInput, border: `1px solid ${T.border}`, color: '#fff', padding: '10px 12px', borderRadius: 8, fontSize: 13, outline: 'none' }

  return (
    <div>
      {contactTarget && (
        <ContactModal inv={contactTarget} onClose={() => setContactTarget(null)}/>
      )}

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          detail={confirm.detail}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0 }}>Lot Admins</h1>
          <p style={{ color: T.textMuted, margin: '4px 0 0' }}>Manage parking lot administrators</p>
        </div>
        <button onClick={() => { setShowCreate(true); setInvitedEmail('') }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.accent, border: 'none', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={16}/> Invite Lot Admin
        </button>
      </div>

      {invitedEmail && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
          <Mail size={18} color={T.success}/>
          <div style={{ flex: 1, fontSize: 14 }}>
            Invitation sent to <strong>{invitedEmail}</strong>. They have 48 hours to set up their password.
          </div>
          <button onClick={() => setInvitedEmail('')} style={{ background: 'none', border: 'none', color: T.textSecondary, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {loading ? <div style={{ color: T.textMuted }}>Loading...</div> : (
        <>
          {/* ── Active admins ── */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: T.textSecondary, margin: '0 0 12px' }}>Active ({admins.length})</h2>
            {admins.length === 0
              ? <div style={{ color: T.textMuted, fontSize: 13 }}>No active lot admins yet.</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {admins.map(admin => (
                    <div key={admin.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
                      <div style={{ width: 40, height: 40, background: 'rgba(125,57,235,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={18} color={T.accent}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{admin.fullName}</div>
                        <div style={{ color: T.textMuted, fontSize: 12 }}>{admin.email}</div>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: 12, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>Lots</div>
                        {admin.assignedLotNames?.map(n => (
                          <div key={n} style={{ fontSize: 12, color: T.accent, fontWeight: 500 }}>{n}</div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => openEdit(admin)} style={{ background: T.border, border: `1px solid ${T.borderHover}`, color: T.textSecondary, padding: '7px 11px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                          <Pencil size={13}/> Edit
                        </button>
                        <button onClick={() => askDeleteAdmin(admin)} style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', color: T.danger, padding: '7px 11px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                          <Trash2 size={13}/> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* ── Pending invitations ── */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: T.textSecondary, margin: '0 0 12px' }}>Pending Invitations ({invitations.length})</h2>
            {invitations.length === 0
              ? <div style={{ color: T.textMuted, fontSize: 13 }}>No pending invitations.</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {invitations.map(inv => {
                    const expiresIn = Math.max(0, Math.round((new Date(inv.expiresAt) - Date.now()) / 3600000))
                    return (
                      <div key={inv.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderColor: 'rgba(245,158,11,.2)' }}>
                        <div style={{ width: 40, height: 40, background: 'rgba(245,158,11,.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Mail size={18} color={T.warning}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.fullName}</div>
                          <div style={{ color: T.textMuted, fontSize: 12 }}>{inv.email}</div>
                          <div style={{ fontSize: 11, color: T.warning, marginTop: 2 }}>Expires in ~{expiresIn}h</div>
                        </div>
                        <div style={{ textAlign: 'right', marginRight: 12, flexShrink: 0 }}>
                          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>Lots</div>
                          {inv.assignedLotNames?.map(n => (
                            <div key={n} style={{ fontSize: 12, color: T.accent, fontWeight: 500 }}>{n}</div>
                          ))}
                        </div>
                        <button onClick={() => askRevokeInvitation(inv)} style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', color: T.danger, padding: '7px 11px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, flexShrink: 0 }}>
                          <X size={13}/> Revoke
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </div>

          {/* ── Expired invitations ── */}
          {expiredInvitations.length > 0 && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: T.textSecondary, margin: '0 0 12px' }}>
                Expired Invitations ({expiredInvitations.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {expiredInvitations.map(inv => {
                  const totalMins = Math.round((Date.now() - new Date(inv.expiresAt)) / 60000)
                  const expiredAgo = totalMins < 60
                    ? `${totalMins}m`
                    : `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`
                  return (
                    <div key={inv.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderColor: 'rgba(239,68,68,.2)', background: 'rgba(239,68,68,.03)' }}>
                      <div style={{ width: 40, height: 40, background: 'rgba(239,68,68,.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={18} color={T.danger}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.fullName}</div>
                        <div style={{ color: T.textMuted, fontSize: 12 }}>{inv.email}</div>
                        <div style={{ fontSize: 11, color: T.danger, marginTop: 2 }}>Expired {expiredAgo} ago</div>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: 12, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>Lots</div>
                        {inv.assignedLotNames?.map(n => (
                          <div key={n} style={{ fontSize: 12, color: T.accent, fontWeight: 500 }}>{n}</div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => setContactTarget(inv)} style={{ background: T.border, border: `1px solid ${T.borderHover}`, color: T.textSecondary, padding: '7px 11px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                          <Mail size={13}/> Contact
                        </button>
                        <button onClick={() => handleResend(inv)} disabled={resendingId === inv.id} style={{ background: 'rgba(125,57,235,.08)', border: '1px solid rgba(125,57,235,.25)', color: T.accentLight, padding: '7px 11px', borderRadius: 7, cursor: resendingId === inv.id ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, opacity: resendingId === inv.id ? 0.6 : 1 }}>
                          <RefreshCw size={13}/> {resendingId === inv.id ? 'Sending…' : 'Resend'}
                        </button>
                        <button onClick={() => askDismissExpired(inv)} style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', color: T.danger, padding: '7px 11px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                          <Trash2 size={13}/> Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateModal
          lots={lots}
          onClose={() => setShowCreate(false)}
          onSuccess={email => { setShowCreate(false); setInvitedEmail(email); setInvitations(list => list); load() }}
        />
      )}

      {editTarget && (
        <Modal title={`Edit — ${editTarget.fullName}`} onClose={() => setEditTarget(null)} error={editError}>
          <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Full Name',    name: 'fullName',    type: 'text',  required: true  },
              { label: 'Email',        name: 'email',       type: 'email', required: true  },
              { label: 'Phone Number', name: 'phoneNumber', type: 'tel',   required: false },
            ].map(f => (
              <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: T.textMuted }}>{f.label}{f.required ? ' *' : ''}</label>
                <input name={f.name} type={f.type} value={editForm[f.name]} onChange={e => setEditForm(f2 => ({ ...f2, [e.target.name]: e.target.value }))} required={f.required} style={inputStyle}/>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: T.textMuted }}>Reset Password (leave blank to keep current)</label>
              <PasswordField name="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave blank to keep current"/>
            </div>
            <LotCheckboxes form={editForm} onChange={e => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }))} lots={lots}/>
            <button type="submit" disabled={saving} style={{ background: T.accent, border: 'none', color: '#fff', padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 8, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
