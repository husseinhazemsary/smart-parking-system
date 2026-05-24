import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PasswordField from '../components/PasswordField'
import { T } from '../constants/theme'
import logo from '../assets/logo.png'

export default function SetupPassword() {
  const [searchParams]                = useSearchParams()
  const navigate                      = useNavigate()
  const { login }                     = useAuth()

  const token                         = searchParams.get('token')

  const [info,       setInfo]         = useState(null)
  const [loadError,  setLoadError]    = useState('')
  const [password,   setPassword]     = useState('')
  const [confirm,    setConfirm]      = useState('')
  const [saving,     setSaving]       = useState(false)
  const [submitError,setSubmitError]  = useState('')

  useEffect(() => {
    if (!token) { setLoadError('No invitation token found in this link.'); return }
    fetch(`http://localhost:8081/api/auth/invitation?token=${token}`)
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.detail || 'This invitation link is invalid or has expired.')
        }
        return res.json()
      })
      .then(setInfo)
      .catch(e => setLoadError(e.message))
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setSubmitError('Passwords do not match.'); return }
    if (password.length < 8)  { setSubmitError('Password must be at least 8 characters.'); return }

    setSaving(true)
    setSubmitError('')
    try {
      const res = await fetch('http://localhost:8081/api/auth/invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to set up your account.')

      const profileRes = await fetch('http://localhost:8081/api/users/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      })
      const profile = await profileRes.json()
      login(data.accessToken, profile)
      navigate('/', { replace: true })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const pageStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bgDeep }
  const cardStyle = { background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 40, width: 400 }

  if (loadError) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: T.danger, marginBottom: 8 }}>Invalid Link</div>
            <div style={{ color: T.textSecondary, fontSize: 14 }}>{loadError}</div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: T.textMuted }}>
            Contact your system administrator to request a new invitation.
          </p>
        </div>
      </div>
    )
  }

  if (!info) {
    return (
      <div style={pageStyle}>
        <div style={{ color: T.textSecondary, fontSize: 14 }}>Validating invitation…</div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={logo} alt="EzRakna" style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 10 }}/>
          <div style={{ fontWeight: 700, fontSize: 20 }}>EzRakna</div>
          <div style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>Admin Dashboard</div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Welcome, {info.fullName}</div>
          <div style={{ fontSize: 13, color: T.textSecondary }}>
            Set a password for <span style={{ color: T.accent }}>{info.email}</span> to activate your account.
          </div>
        </div>

        {submitError && (
          <div style={{ color: T.danger, fontSize: 13, marginBottom: 14 }}>{submitError}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: T.textMuted }}>Password *</label>
            <PasswordField name="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: T.textMuted }}>Confirm Password *</label>
            <PasswordField name="confirm" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required/>
          </div>
          <button type="submit" disabled={saving} style={{
            background: T.accent, border: 'none', color: '#fff',
            padding: '12px', borderRadius: 10, fontSize: 15,
            fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            marginTop: 8, opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Setting up…' : 'Activate Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
