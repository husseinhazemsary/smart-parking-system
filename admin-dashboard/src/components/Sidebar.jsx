import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ParkingSquare, Radio,
  CalendarCheck, Clock, MapPin, Users, LogOut, Settings, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const baseLinks = [
  { to: '/',             icon: LayoutDashboard, label: 'Overview'      },
  { to: '/slots',        icon: ParkingSquare,   label: 'Parking Slots' },
  { to: '/reservations', icon: CalendarCheck,   label: 'Reservations'  },
  { to: '/sessions',     icon: Clock,           label: 'Sessions'      },
]

const lotAdminLinks = [
  { to: '/my-lots',   icon: MapPin,  label: 'My Parking Lots' },
  { to: '/live-feed', icon: Radio,   label: 'Live Feed'       },
]

const adminOnlyLinks = [
  { to: '/parking-lots', icon: MapPin,  label: 'Parking Lots' },
  { to: '/lot-admins',   icon: Users,   label: 'Lot Admins'   },
]

export default function Sidebar({ open, onToggle }) {
  const navigate = useNavigate()
  const { user, logout, isSuperAdmin } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const links = isSuperAdmin
    ? [baseLinks[0], adminOnlyLinks[0], ...baseLinks.slice(1), adminOnlyLinks[1]]
    : [baseLinks[0], lotAdminLinks[0], ...baseLinks.slice(1), lotAdminLinks[1]]

  const w = open ? '260px' : '64px'

  return (
    <aside style={{
      width: w, minHeight: '100vh', background: '#0a0f1e',
      borderRight: '1px solid #1a2540', display: 'flex',
      flexDirection: 'column', padding: open ? '24px 16px' : '24px 10px',
      transition: 'width 0.2s, padding 0.2s', overflow: 'hidden', flexShrink: 0
    }}>

      {/* Logo + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center', marginBottom: 32, minHeight: 44 }}>
        {open && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, background: '#1a2540',
              borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20, flexShrink: 0
            }}>🅿</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>Admin Dashboard</div>
              <div style={{ fontSize: 11, color: '#4a5568', whiteSpace: 'nowrap' }}>Your Spot, Ready Before You Arrive</div>
            </div>
          </div>
        )}
        <button onClick={onToggle} style={{
          background: '#1a2540', border: '1px solid #2a3550', color: '#94a3b8',
          borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', flexShrink: 0
        }}>
          {open ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
        </button>
      </div>

      {/* Role badge */}
      {open && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: '#0d1426', border: '1px solid #1a2540',
            borderRadius: 8, padding: '10px 14px', fontSize: 13
          }}>
            {isSuperAdmin
              ? <span style={{ color: '#3b82f6', fontWeight: 600 }}>Super Admin</span>
              : <span style={{ color: '#94a3b8', fontWeight: 500 }}>Lot Admin</span>}
            <div style={{ color: '#4a5568', fontSize: 11, marginTop: 2 }}>{user?.email}</div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} title={!open ? label : undefined} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: open ? 12 : 0,
            justifyContent: open ? 'flex-start' : 'center',
            padding: open ? '11px 14px' : '11px', borderRadius: 8, textDecoration: 'none',
            fontSize: 14, fontWeight: 500,
            background: isActive ? '#1a2540' : 'transparent',
            color: isActive ? '#3b82f6' : '#94a3b8',
            transition: 'all 0.2s'
          })}>
            <Icon size={17}/>
            {open && label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <NavLink to="/settings" title={!open ? 'Settings' : undefined} style={{
          display: 'flex', alignItems: 'center', gap: open ? 12 : 0,
          justifyContent: open ? 'flex-start' : 'center',
          padding: open ? '11px 14px' : '11px', borderRadius: 8, textDecoration: 'none',
          fontSize: 14, color: '#94a3b8'
        }}>
          <Settings size={17}/> {open && 'Settings'}
        </NavLink>
        <button onClick={handleLogout} title={!open ? 'Logout' : undefined} style={{
          display: 'flex', alignItems: 'center', gap: open ? 12 : 0,
          justifyContent: open ? 'flex-start' : 'center',
          padding: open ? '11px 14px' : '11px', borderRadius: 8, border: 'none',
          background: 'transparent', cursor: 'pointer',
          fontSize: 14, color: '#ef4444', width: '100%'
        }}>
          <LogOut size={17}/> {open && 'Logout'}
        </button>
      </div>
    </aside>
  )
}
