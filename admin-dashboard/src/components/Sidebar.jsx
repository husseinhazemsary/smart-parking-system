import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ParkingSquare, Radio,
  CalendarCheck, Clock, MapPin, Users, LogOut, Settings
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const baseLinks = [
  { to: '/',             icon: LayoutDashboard, label: 'Overview'      },
  { to: '/slots',        icon: ParkingSquare,   label: 'Parking Slots' },
  { to: '/reservations', icon: CalendarCheck,   label: 'Reservations'  },
  { to: '/sessions',     icon: Clock,           label: 'Sessions'      },
]

const lotAdminLinks = [
  { to: '/live-feed', icon: Radio, label: 'Live Feed' },
]

const adminOnlyLinks = [
  { to: '/parking-lots', icon: MapPin,  label: 'Parking Lots' },
  { to: '/lot-admins',   icon: Users,   label: 'Lot Admins'   },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, logout, isSuperAdmin } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const links = isSuperAdmin
    ? [baseLinks[0], adminOnlyLinks[0], ...baseLinks.slice(1), adminOnlyLinks[1]]
    : [...baseLinks, ...lotAdminLinks]

  return (
    <aside style={{
      width: '260px', minHeight: '100vh', background: '#0a0f1e',
      borderRight: '1px solid #1a2540', display: 'flex',
      flexDirection: 'column', padding: '24px 16px'
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{
          width: 44, height: 44, background: '#1a2540',
          borderRadius: 10, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 20
        }}>🅿</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Admin Dashboard</div>
          <div style={{ fontSize: 11, color: '#4a5568' }}>Your Spot, Ready Before You Arrive</div>
        </div>
      </div>

      {/* Role badge + lot info */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={13}/>
          {isSuperAdmin ? 'All Locations' : 'Your Location'}
        </div>
        <div style={{
          background: '#0d1426', border: '1px solid #1a2540',
          borderRadius: 8, padding: '10px 14px', fontSize: 13
        }}>
          {isSuperAdmin
            ? <span style={{ color: '#3b82f6', fontWeight: 600 }}>Super Admin</span>
            : <span>{user?.assignedLotName ?? 'Lot Admin'}</span>}
          <div style={{ color: '#4a5568', fontSize: 11, marginTop: 2 }}>{user?.email}</div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 8, textDecoration: 'none',
            fontSize: 14, fontWeight: 500,
            background: isActive ? '#1a2540' : 'transparent',
            color: isActive ? '#3b82f6' : '#94a3b8',
            transition: 'all 0.2s'
          })}>
            <Icon size={17}/> {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <NavLink to="/settings" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 14px', borderRadius: 8, textDecoration: 'none',
          fontSize: 14, color: '#94a3b8'
        }}>
          <Settings size={17}/> Settings
        </NavLink>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 14px', borderRadius: 8, border: 'none',
          background: 'transparent', cursor: 'pointer',
          fontSize: 14, color: '#ef4444', width: '100%'
        }}>
          <LogOut size={17}/> Logout
        </button>
      </div>
    </aside>
  )
}
