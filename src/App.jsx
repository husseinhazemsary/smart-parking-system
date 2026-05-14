import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar    from './components/Sidebar'
import Overview   from './pages/Overview'
import ParkingSlots from './pages/ParkingSlots'
import LiveFeed   from './pages/LiveFeed'
import Reservations from './pages/Reservations'
import Sessions   from './pages/Sessions'

function ProtectedLayout() {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace/>

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main-content">
        <Routes>
          <Route path="/"             element={<Overview/>}/>
          <Route path="/slots"        element={<ParkingSlots/>}/>
          <Route path="/live-feed"    element={<LiveFeed/>}/>
          <Route path="/reservations" element={<Reservations/>}/>
          <Route path="/sessions"     element={<Sessions/>}/>
        </Routes>
      </main>
    </div>
  )
}

function Login() {
  function handleLogin(e) {
    e.preventDefault()
    const email    = e.target.email.value
    const password = e.target.password.value

    fetch('http://localhost:8081/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(r => r.json())
    .then(data => {
      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken)
        window.location.href = '/'
      } else {
        alert('Invalid credentials')
      }
    })
    .catch(() => alert('Server error'))
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
            name="email"
            type="email"
            placeholder="Email"
            defaultValue="admin@parking.com"
            style={{
              background: '#131c30', border: '1px solid #1a2540',
              color: '#fff', padding: '12px 16px', borderRadius: 10,
              fontSize: 14, outline: 'none'
            }}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            defaultValue="Admin@1234"
            style={{
              background: '#131c30', border: '1px solid #1a2540',
              color: '#fff', padding: '12px 16px', borderRadius: 10,
              fontSize: 14, outline: 'none'
            }}
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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/*"     element={<ProtectedLayout/>}/>
      </Routes>
    </BrowserRouter>
  )
}