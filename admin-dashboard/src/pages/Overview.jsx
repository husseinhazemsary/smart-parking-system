import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Car, Activity, AlertCircle } from 'lucide-react'
import api from '../api/axios'
import { T } from '../constants/theme'

const mockTrend = [
  { time: '08:00', value: 32 }, { time: '10:00', value: 45 },
  { time: '12:00', value: 80 }, { time: '14:00', value: 65 },
  { time: '16:00', value: 70 }, { time: '18:00', value: 75 },
  { time: '20:00', value: 40 },
]

export default function Overview() {
  const [stats, setStats]           = useState(null)
  const [sessionStats, setSession]  = useState(null)
  const [recent, setRecent]         = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/reservations/stats'),
      api.get('/api/admin/sessions/stats'),
      api.get('/api/admin/sessions/recent?hours=24'),
    ]).then(([resStats, sesStats, recentRes]) => {
      setStats(resStats.data)
      setSession(sesStats.data)
      setRecent(recentRes.data.slice(0, 5))
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    {
      icon: TrendingUp,
      color: T.accent,
      bg: `rgba(125,57,235,0.1)`,
      value: stats ? `${stats.totalRevenue?.toLocaleString() ?? 0} EGP` : '— EGP',
      label: 'Total Revenue/EGP',
      badge: '+12% today',
      badgeClass: 'badge-green'
    },
    {
      icon: Car,
      color: T.accent,
      bg: `rgba(125,57,235,0.1)`,
      value: sessionStats ? sessionStats.activeSessions : '—',
      label: 'Current Occupancy',
      badge: '85% full',
      badgeClass: 'badge-red'
    },
    {
      icon: Activity,
      color: T.accent,
      bg: `rgba(125,57,235,0.1)`,
      value: sessionStats ? sessionStats.completedSessions : '—',
      label: 'Total Parked',
      badge: '+24% today',
      badgeClass: 'badge-green'
    },
    {
      icon: AlertCircle,
      color: T.accent,
      bg: `rgba(125,57,235,0.1)`,
      value: '2',
      label: 'Active Alerts',
      badge: 'Needs Attention',
      badgeClass: 'badge-red'
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1>Dashboard Overview</h1>
        <p>Real-time parking statistics and system status</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {statCards.map((s, i) => (
          <div key={i} className="card">
            <div style={{
              width: 52, height: 52, borderRadius: 10,
              background: s.bg, display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: 16
            }}>
              <s.icon size={24} color={s.color}/>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{loading ? '...' : s.value}</div>
            <div style={{ fontSize: 13, color: T.textMuted, margin: '4px 0 10px' }}>{s.label}</div>
            <span className={`badge ${s.badgeClass}`}>{s.badge}</span>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

        {/* Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Occupancy Trends</span>
            <select style={{
              background: T.border, border: `1px solid ${T.borderHover}`,
              color: T.textPrimary, padding: '6px 12px', borderRadius: 8, fontSize: 13
            }}>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockTrend}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.accent} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={T.accent} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke={T.borderHover} tick={{ fill: T.textMuted, fontSize: 12 }}/>
              <YAxis stroke={T.borderHover} tick={{ fill: T.textMuted, fontSize: 12 }}/>
              <Tooltip contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8 }}/>
              <Area type="monotone" dataKey="value" stroke={T.accent} strokeWidth={2} fill="url(#grad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Detentions */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Recent Detentions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent.length === 0 ? (
              <div style={{ color: T.textMuted, fontSize: 13 }}>No recent sessions</div>
            ) : (
              recent.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: T.bgInput, borderRadius: 8, padding: '10px 14px'
                }}>
                  <div style={{
                    width: 36, height: 36, background: T.border,
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Car size={16} color={T.accent}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.slotNumber}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{s.userEmail}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
