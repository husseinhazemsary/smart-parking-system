import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import PasswordField from './components/PasswordField'
import Sidebar      from './components/Sidebar'
import Overview       from './pages/Overview'
import ParkingSlots   from './pages/ParkingSlots'
import LiveFeed       from './pages/LiveFeed'
import Reservations   from './pages/Reservations'
import Sessions       from './pages/Sessions'
import ParkingLots      from './pages/ParkingLots'
import ParkingLotDetail from './pages/ParkingLotDetail'
import LotAdmins        from './pages/LotAdmins'
import MyParkingLots       from './pages/MyParkingLots'
import MyParkingLotDetail  from './pages/MyParkingLotDetail'
import SetupPassword        from './pages/SetupPassword'

function ProtectedLayout() {
  const { user, isSuperAdmin, isLotAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  if (!user) return <Navigate to="/login" replace/>

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)}/>
      <main className="main-content">
        <Routes>
          <Route path="/"             element={<Overview/>}/>
          <Route path="/slots"        element={<ParkingSlots/>}/>
          <Route path="/live-feed"    element={<LiveFeed/>}/>
          <Route path="/reservations" element={<Reservations/>}/>
          <Route path="/sessions"     element={<Sessions/>}/>
          {isLotAdmin  && <Route path="/my-lots"          element={<MyParkingLots/>}/>}
          {isLotAdmin  && <Route path="/my-lots/:id"      element={<MyParkingLotDetail/>}/>}
          {isSuperAdmin && <Route path="/parking-lots"     element={<ParkingLots/>}/>}
          {isSuperAdmin && <Route path="/parking-lots/:id" element={<ParkingLotDetail/>}/>}
          {isSuperAdmin && <Route path="/lot-admins"       element={<LotAdmins/>}/>}
        </Routes>
      </main>
    </div>
  )
}

function Login() {
  const { login } = useAuth()
  const [password, setPassword] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    const email = e.target.email.value

    try {
      const res  = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!data.accessToken) { alert('Invalid credentials'); return }

      const profileRes = await fetch('http://localhost:8081/api/users/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` }
      })
      const profile = await profileRes.json()

      if (profile.role !== 'ROLE_ADMIN' && profile.role !== 'ROLE_LOT_ADMIN') {
        alert('Access denied. This dashboard is for admins only.')
        return
      }

      login(data.accessToken, profile)
      window.location.href = '/'
    } catch {
      alert('Server error')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#080d1a'
    }}>
      <div style={{
        background: '#0d1426', border: '1px solid #1a2540',
        borderRadius: 16, padding: 40, width: 380
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🅿</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>EzRakna</div>
          <div style={{ color: '#4a5568', fontSize: 13, marginTop: 4 }}>Admin Dashboard</div>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            name="email" type="email" placeholder="Email"
            style={{
              background: '#131c30', border: '1px solid #1a2540',
              color: '#fff', padding: '12px 16px', borderRadius: 10,
              fontSize: 14, outline: 'none'
            }}
          />
          <PasswordField
            name="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={{ padding: '12px 40px 12px 16px', borderRadius: 10, fontSize: 14 }}
          />
          <button type="submit" style={{
            background: '#3b82f6', border: 'none', color: '#fff',
            padding: '12px', borderRadius: 10, fontSize: 15,
            fontWeight: 600, cursor: 'pointer', marginTop: 8
          }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"          element={<Login/>}/>
          <Route path="/setup-password" element={<SetupPassword/>}/>
          <Route path="/*"              element={<ProtectedLayout/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
