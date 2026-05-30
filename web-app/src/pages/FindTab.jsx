import React, { useState, useEffect, useRef } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import apiFetch from "../api/client";
import ProgressBar from "../components/ui/ProgressBar";
import GlowBtn from "../components/ui/GlowBtn";

// ─── Data helpers ────────────────────────────────────────────────────────────

const availColor = (available, total) => {
  const pct = total > 0 ? available / total : 0;
  return pct > 0.5 ? "#22C55E" : pct > 0.2 ? "#F59E0B" : "#EF4444";
};
const availLabel = (available, total) => {
  const pct = total > 0 ? available / total : 0;
  return pct > 0.5 ? "Available" : pct > 0.2 ? "Limited" : "Almost Full";
};

function formatHours(open, close) {
  if (!open || !close) return "24/7";
  const fmt = t => {
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    return `${(hour % 12) || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };
  return `${fmt(open)} – ${fmt(close)}`;
}

function mapLot(lot) {
  return {
    id:        lot.id,
    name:      lot.name,
    address:   lot.address,
    total:     lot.totalSlots,
    available: lot.availableSlots,
    distance:  lot.distanceKm ?? 0,
    rate:      lot.hourlyRate != null ? Number(lot.hourlyRate) : 0,
    hours:     formatHours(lot.openingTime, lot.closingTime),
    category:  normalizeCategory(lot.category),
    imageUrl:  lot.imageUrl ?? null,
  };
}

function mapSlot(s, i) {
  const label = s.slotLabel || String(i + 1);
  const m = label.match(/^([A-Za-z])(\d+)$/);
  const level   = m ? m[1].toUpperCase().charCodeAt(0) - 64 : 1;
  const slotNum = m ? parseInt(m[2], 10) : i + 1;
  return {
    id:               s.id,
    slotNum,
    level,
    type:             s.slotType === "HANDICAP" ? "accessible" : "standard",
    status:           (s.status || "available").toLowerCase(),
    predictedMinutes: ((slotNum * 7 + level * 3) % 46) + 5,
    confidence:       ((slotNum * 13 + level) % 25) + 68,
  };
}

function normalizeCategory(raw) {
  const map = { MALL:"Mall", UNIVERSITY:"University", AIRPORT:"Airport", STREET:"Street" };
  return map[raw] ?? null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CAT_COLORS = { Mall:"#C084FC", University:T.green, Airport:"#F59E0B", Street:"#38BDF8" };

const CATEGORIES = [
  { key: null,         label: "All"          },
  { key: "Mall",       label: "Malls"        },
  { key: "University", label: "Universities" },
  { key: "Airport",    label: "Airports"     },
  { key: "Street",     label: "Streets"      },
];

const SLOT_CONFIG = {
  available: { color:"#22C55E", bg:"rgba(34,197,94,.15)",  border:"rgba(34,197,94,.4)",  icon:"✓" },
  occupied:  { color:"#EF4444", bg:"rgba(239,68,68,.15)",  border:"rgba(239,68,68,.4)",  icon:"✕" },
  reserved:  { color:"#F59E0B", bg:"rgba(245,158,11,.15)", border:"rgba(245,158,11,.4)", icon:"⊡" },
};
const TYPE_BADGES = {
  ev:         { color:"#F59E0B", icon:"⚡", label:"EV Charging" },
  accessible: { color:"#60A5FA", icon:"♿", label:"Accessible"  },
  standard:   { color:"",        icon:"",   label:""            },
};

function slotTileColor(sl) {
  if (sl.type === "ev")         return { color:"#F59E0B", bg:"rgba(245,158,11,.18)", border:"rgba(245,158,11,.45)" };
  if (sl.type === "accessible") return { color:"#60A5FA", bg:"rgba(96,165,250,.18)", border:"rgba(96,165,250,.45)" };
  return SLOT_CONFIG[sl.status];
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const MapPinIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const TagIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
    <path d="M7 7h.01"/>
  </svg>
);

const NavigationIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);

const ClockIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const SmallClockIcon = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

// Category-specific SVG icons
const CAT_SVGS = {
  All: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Malls: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Universities: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  Airports: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.5-.9 1 0 .6.5 1 1 1h.1l4.4-.4 4.5 4.4H7a1 1 0 0 0-.71.3L4 14.8c-.2.2-.3.5-.3.8 0 .6.5 1 1 1h.1L9 16l4 4 4 .2c.6 0 1-.5 1-1 0-.3-.1-.6-.4-.8z"/>
    </svg>
  ),
  Streets: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
};

// ─── Global CSS ───────────────────────────────────────────────────────────────

const CSS = `
  /* ── Search bar ── */
  .ft-search-input {
    width: 100%; height: 52px; border-radius: 14px;
    border: 1.5px solid rgba(125,57,235,0.3);
    background: rgba(17,0,48,0.75);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    color: #F0EAFA; font-family: inherit;
    font-size: 14px; padding: 0 130px 0 48px;
    outline: none; box-sizing: border-box;
    transition: border-color .2s, box-shadow .2s;
  }
  .ft-search-input:focus {
    border-color: rgba(125,57,235,0.7);
    box-shadow: 0 0 0 3px rgba(125,57,235,0.1), 0 4px 24px rgba(125,57,235,0.14);
  }
  .ft-search-input::placeholder { color: #9B8EC4; }

  /* ── Recent search chips ── */
  .ft-recent-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 8px 4px 10px; border-radius: 999px;
    background: rgba(125,57,235,0.08); border: 1px solid rgba(125,57,235,0.2);
    color: #9B8EC4; font-size: 11px; cursor: pointer;
    transition: background .15s, border-color .15s; white-space: nowrap; flex-shrink: 0;
  }
  .ft-recent-chip:hover { background: rgba(125,57,235,0.16); border-color: rgba(125,57,235,0.38); color: #F0EAFA; }
  .ft-recent-dismiss {
    display: inline-flex; align-items: center; justify-content: center;
    width: 14px; height: 14px; border-radius: 50%;
    background: rgba(125,57,235,0.15); border: none; color: #9B8EC4;
    font-size: 9px; cursor: pointer; padding: 0; line-height: 1;
    transition: background .15s, color .15s;
  }
  .ft-recent-dismiss:hover { background: rgba(239,68,68,0.3); color: #EF4444; }

  /* ── Category pills ── */
  .ft-cat-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 14px; border-radius: 999px; border: 1.5px solid;
    font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all .22s cubic-bezier(.22,1,.36,1); white-space: nowrap;
  }
  .ft-cat-pill:active { transform: scale(0.95); }

  /* ── Sort buttons ── */
  .ft-sort-btn {
    padding: 6px 14px; border: none; background: transparent;
    font-family: inherit; font-size: 12px; cursor: pointer;
    position: relative; transition: color .15s; border-bottom: 2px solid transparent;
    white-space: nowrap; margin-bottom: -1px;
  }
  .ft-sort-btn.active { font-weight: 700; border-bottom-color: #7D39EB; }
  .ft-sort-btn:not(.active):hover { color: #F0EAFA !important; }

  /* ── Cards ── */
  .ft-card {
    display: flex; flex-direction: column; border-radius: 16px;
    border: 1.5px solid var(--avail-color, rgba(125,57,235,0.22));
    background: #110030; overflow: hidden; cursor: pointer;
    transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s, border-color .25s;
  }
  .ft-card:hover {
    transform: translateY(-5px);
    border-color: rgba(125,57,235,0.55);
    box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(125,57,235,0.08);
  }
  .ft-card:hover .ft-card-photo img { transform: scale(1.05); }
  .ft-card-photo { position: relative; height: 160px; overflow: hidden; }
  .ft-card-photo img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    filter: brightness(0.75) saturate(0.85);
    transition: transform .5s cubic-bezier(.22,1,.36,1);
  }
  .ft-card-photo-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(7,0,26,0) 0%, rgba(7,0,26,0.3) 50%, rgba(7,0,26,0.88) 100%);
  }
  .ft-card-photo-name {
    position: absolute; bottom: 12px; left: 14px; right: 14px;
    font-weight: 700; font-size: 17px; color: #fff; letter-spacing: -.3px; line-height: 1.2;
    text-shadow: 0 2px 12px rgba(0,0,0,0.5);
  }
  .ft-card-avail-badge {
    position: absolute; top: 12px; right: 12px;
    display: flex; align-items: center; gap: 6px;
    backdrop-filter: blur(12px); border-radius: 100px; padding: 5px 11px;
    font-family: monospace; font-size: 12px; font-weight: 500; border: 1px solid;
  }
  .ft-card-body { padding: 14px 14px 16px; }

  /* Stats row */
  .ft-card-stats {
    display: flex; align-items: stretch;
    background: rgba(125,57,235,0.05); border: 1px solid rgba(125,57,235,0.15);
    border-radius: 10px; overflow: hidden; margin-bottom: 13px;
  }
  .ft-card-stat {
    flex: 1; display: flex; align-items: center; gap: 5px;
    padding: 8px 9px; font-size: 11px; color: #9B8EC4;
    border-right: 1px solid rgba(125,57,235,0.15);
  }
  .ft-card-stat:last-child { border-right: none; }
  .ft-card-stat svg { flex-shrink: 0; color: #7D39EB; }

  /* ── Availability bar inside card ── */
  .ft-avail-bar-track {
    height: 4px; border-radius: 999px; background: rgba(255,255,255,0.06); overflow: hidden;
  }
  .ft-avail-bar-fill {
    height: 100%; border-radius: 999px; transition: width 0.8s cubic-bezier(.22,1,.36,1);
  }

  /* ── Auth banner ── */
  .ft-auth-banner {
    display: flex; align-items: center; gap: 10px; padding: 11px 14px;
    border-radius: 11px; background: rgba(125,57,235,.07);
    border: 1px solid rgba(125,57,235,.22);
  }

  /* ── Slot map modal (unchanged) ── */
  .ft-modal-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(7,0,26,.82); backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: ftFadeIn .2s ease;
  }
  .ft-modal-box {
    background: #110030; border: 1px solid rgba(125,57,235,.28);
    border-radius: 22px; width: 100%; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 32px 96px rgba(0,0,0,.7);
    animation: ftSlideUp .28s cubic-bezier(.22,1,.36,1);
  }
  .ft-slot {
    width: 54px; height: 54px; border-radius: 10px; border: 1.5px solid;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    cursor: pointer;
    transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
    position: relative; flex-shrink: 0;
  }
  .ft-slot:hover { transform: scale(1.12); }
  .ft-slot.available:hover { box-shadow: 0 4px 20px rgba(34,197,94,.35); }
  .ft-slot.occupied:hover  { box-shadow: 0 4px 14px rgba(239,68,68,.25); }

  /* ── Keyframes ── */
  @keyframes ftFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes ftSlideUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ftCardIn  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pls       { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(2.2);opacity:0} }
  @keyframes livePulse { 0%,100%{opacity:1} 60%{opacity:0.45} }
`;

// ─── FindTab ──────────────────────────────────────────────────────────────────

export default function FindTab({ onReserve, user, onAuthOpen, initialSpotId, onSpotDetailOpened, profile }) {
  const [search,        setSearch]        = useState("");
  const [category,      setCategory]      = useState(null);
  const [sort,          setSort]          = useState("distance");
  const [detailSpot,    setDetailSpot]    = useState(null);
  const [slotSpot,      setSlotSpot]      = useState(null);
  const [lots,          setLots]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState("");
  const [lotSlots,      setLotSlots]      = useState({});
  const [slotsLoading,  setSlotsLoading]  = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [animKey,       setAnimKey]       = useState(0);
  const prevSearch = useRef("");
  const { isMobile } = useBreakpoint();

  // Load parking lots from API
  useEffect(() => {
    apiFetch("/api/parking-lots")
      .then(data => setLots((data || []).map(mapLot)))
      .catch(e => setFetchError(e.message || "Failed to load parking lots"))
      .finally(() => setLoading(false));
  }, []);

  // Open detail modal when a shared lot link is followed
  useEffect(() => {
    if (initialSpotId && lots.length > 0) {
      const spot = lots.find(s => s.id === initialSpotId);
      if (spot) { setDetailSpot(spot); setSlotSpot(null); }
      onSpotDetailOpened?.();
    }
  }, [initialSpotId, lots]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-trigger stagger animation on filter / sort change
  useEffect(() => { setAnimKey(k => k + 1); }, [category, sort]);

  // Save non-empty searches to recents when user clears the field
  useEffect(() => {
    if (search === "" && prevSearch.current.trim()) {
      const term = prevSearch.current.trim();
      setRecentSearches(rs => {
        const updated = [term, ...rs.filter(r => r !== term)].slice(0, 3);
        return updated;
      });
    }
    prevSearch.current = search;
  }, [search]);

  const filtered = lots
    .filter(s =>
      (category === null || s.category === category) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
       s.address.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) =>
      sort === "distance" ? a.distance - b.distance :
      sort === "price"    ? a.rate - b.rate :
      sort === "avail"    ? b.available - a.available : 0
    );

  const totalLive = lots.reduce((sum, l) => sum + (l.available || 0), 0);

  const openDetail = s => { setDetailSpot(s); setSlotSpot(null); };

  const openSlots = async s => {
    setSlotSpot(s);
    setDetailSpot(null);
    if (lotSlots[s.id]) return;
    setSlotsLoading(true);
    try {
      const data = await apiFetch(`/api/parking-lots/${s.id}/slots`);
      setLotSlots(prev => ({ ...prev, [s.id]: (data || []).map(mapSlot) }));
    } catch {
      setLotSlots(prev => ({ ...prev, [s.id]: [] }));
    } finally {
      setSlotsLoading(false);
    }
  };

  const closeAll = () => { setDetailSpot(null); setSlotSpot(null); };

  const handleReserve = spot => {
    if (!user) { onAuthOpen?.(); return; }
    closeAll();
    onReserve(spot);
  };

  const dismissRecent = (i) =>
    setRecentSearches(rs => rs.filter((_, idx) => idx !== i));

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0, overflowY:"auto" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>

      {/* ── Header ── */}
      <div style={{ padding: isMobile ? "20px 16px 0" : "28px 28px 0", flexShrink: 0 }}>

        {/* Auth banner */}
        {!user && (
          <div className="ft-auth-banner" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🔐</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 1 }}>Sign in to reserve</div>
              <div style={{ fontSize: 11, color: T.sub }}>Browse freely — log in when you're ready to book.</div>
            </div>
            <div style={{ display:"flex", gap:7, flexShrink:0 }}>
              <GlowBtn small outline noArrow onClick={onAuthOpen}>Log In</GlowBtn>
              <GlowBtn small noArrow onClick={onAuthOpen}>Sign Up</GlowBtn>
            </div>
          </div>
        )}

        {/* ── Search bar ── */}
        <div style={{ position:"relative", marginBottom: (search === "" && recentSearches.length > 0) ? 10 : 16 }}>
          {/* Search icon */}
          <div style={{
            position:"absolute", left:15, top:"50%", transform:"translateY(-50%)",
            color:T.sub, pointerEvents:"none", display:"flex", alignItems:"center",
          }}>
            <SearchIcon/>
          </div>

          <input
            className="ft-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Where are you going?"
          />

          {/* Live spots pill */}
          {!search && (
            <div style={{
              position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
              display:"flex", alignItems:"center", gap:5,
              padding:"4px 10px", borderRadius:999,
              background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)",
              pointerEvents:"none",
            }}>
              <span style={{
                width:6, height:6, borderRadius:"50%", background:T.green, flexShrink:0,
                animation:"livePulse 2s ease-in-out infinite",
              }}/>
              <span style={{ fontSize:11, color:T.green, fontWeight:600, whiteSpace:"nowrap" }}>
                {totalLive} spots live
              </span>
            </div>
          )}

          {/* Clear button */}
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position:"absolute", right:13, top:"50%", transform:"translateY(-50%)",
                background:"rgba(255,255,255,0.07)", border:`1px solid ${T.border}`,
                color:T.sub, cursor:"pointer", width:22, height:22, borderRadius:"50%",
                fontSize:11, display:"flex", alignItems:"center", justifyContent:"center",
                padding:0, lineHeight:1, transition:"background .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.14)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.07)"}
            >✕</button>
          )}
        </div>

        {/* Recent search chips */}
        {search === "" && recentSearches.length > 0 && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {recentSearches.map((rs, i) => (
              <div
                key={i}
                className="ft-recent-chip"
                onClick={() => setSearch(rs)}
              >
                <SmallClockIcon/>
                {rs}
                <button
                  className="ft-recent-dismiss"
                  onClick={e => { e.stopPropagation(); dismissRecent(i); }}
                >×</button>
              </div>
            ))}
          </div>
        )}

        {/* ── Category pills ── */}
        <div style={{
          display:"flex", gap:7, overflowX:"auto", paddingBottom:4,
          marginBottom:12, scrollbarWidth:"none",
        }}>
          <style>{`.ft-cat-scroll::-webkit-scrollbar{display:none}`}</style>
          {CATEGORIES.map(cat => {
            const active = category === cat.key;
            const color  = cat.key ? (CAT_COLORS[cat.key] || T.purple) : T.purple;
            return (
              <button
                key={cat.label}
                className="ft-cat-pill"
                onClick={() => setCategory(active ? null : cat.key)}
                style={{
                  borderColor: active ? color : T.border,
                  background:  active ? color : "rgba(17,0,48,0.6)",
                  color:       active ? "#fff" : T.sub,
                  flexShrink:  0,
                  boxShadow:   active ? `0 0 14px ${color}50` : "none",
                }}
              >
                {CAT_SVGS[cat.label]}
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Sort row ── */}
        <div style={{
          display:"flex", alignItems:"stretch", gap:0,
          borderBottom:`1px solid ${T.border}`, marginBottom:12,
        }}>
          {[
            ["distance", "Nearest"],
            ["price",    "Best Price"],
            ["avail",    "Most Available"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={`ft-sort-btn ${sort === v ? "active" : ""}`}
              onClick={() => setSort(v)}
              style={{ color: sort === v ? T.text : T.sub }}
            >{l}</button>
          ))}
        </div>

        {/* Results count */}
        {!loading && !fetchError && (
          <div style={{ fontSize:12, color:T.sub, fontFamily:"monospace", marginBottom:14, letterSpacing:0.2 }}>
            {filtered.length} location{filtered.length !== 1 ? "s" : ""} found
            {category ? ` · ${CATEGORIES.find(c => c.key === category)?.label}` : ""}
            {search ? ` · "${search}"` : ""}
          </div>
        )}
      </div>

      {/* ── Card grid ── */}
      <div style={{
        padding: isMobile ? "4px 16px 28px" : "4px 28px 28px",
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))",
        gap:14, overflowY:"auto", flex:1,
      }}>
        {loading && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"64px 0", color:T.sub }}>
            <div style={{ fontSize:32, marginBottom:12, opacity:.5 }}>🅿️</div>
            <div style={{ fontSize:14, fontWeight:600 }}>Loading parking locations…</div>
          </div>
        )}
        {!loading && fetchError && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"48px 0" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
            <div style={{ fontSize:14, fontWeight:700, color:T.red, marginBottom:6 }}>Could not load parking lots</div>
            <div style={{ fontSize:12, color:T.sub, marginBottom:16 }}>{fetchError}</div>
            <button
              onClick={() => {
                setFetchError(""); setLoading(true);
                apiFetch("/api/parking-lots")
                  .then(data => setLots((data || []).map(mapLot)))
                  .catch(e => setFetchError(e.message || "Failed to load parking lots"))
                  .finally(() => setLoading(false));
              }}
              style={{
                padding:"8px 20px", borderRadius:9, border:`1px solid ${T.border}`,
                background:"rgba(125,57,235,.08)", color:T.purple,
                fontFamily:"inherit", fontSize:13, cursor:"pointer",
              }}
            >Retry</button>
          </div>
        )}
        {!loading && !fetchError && filtered.length === 0 && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"64px 0", color:T.sub }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>No locations found</div>
            <div style={{ fontSize:13 }}>Try a different search term or category</div>
          </div>
        )}
        {!loading && filtered.map((s, i) => (
          <SpotCard
            key={`${s.id}-${animKey}`}
            spot={s}
            index={i}
            onOpen={() => openSlots(s)}
          />
        ))}
      </div>

      {/* ── Modals ── */}
      {detailSpot && (
        <DetailModal
          spot={detailSpot} user={user}
          onClose={closeAll}
          onReserve={() => handleReserve(detailSpot)}
          onViewSlots={() => openSlots(detailSpot)}
          onAuthOpen={onAuthOpen}
        />
      )}
      {slotSpot && (
        <SlotMapModal
          spot={slotSpot}
          slots={lotSlots[slotSpot.id] || []}
          slotsLoading={slotsLoading}
          user={user}
          profile={profile}
          onClose={closeAll}
          onBack={() => { setSlotSpot(null); setDetailSpot(slotSpot); }}
          onReserve={() => handleReserve(slotSpot)}
          onAuthOpen={onAuthOpen}
        />
      )}
    </div>
  );
}

// ─── SpotCard ─────────────────────────────────────────────────────────────────

const CAT_LABEL_ICONS = {
  Mall: "🏬", University: "🎓", Airport: "✈️", Street: "🚗",
};

function CardImage({ imageUrl, category, ac, name, available, total }) {
  const [failed, setFailed] = useState(false);
  const catColor = (category && CAT_COLORS[category]) || T.purple;
  const catIcon  = (category && CAT_LABEL_ICONS[category]) || "🅿️";

  // Availability badge color class
  const pct = total > 0 ? available / total : 0;
  const badgeBg     = pct > 0.5 ? "rgba(34,197,94,0.18)"   : pct > 0.2 ? "rgba(245,158,11,0.18)"  : "rgba(239,68,68,0.18)";
  const badgeBorder = pct > 0.5 ? "rgba(34,197,94,0.45)"   : pct > 0.2 ? "rgba(245,158,11,0.45)"  : "rgba(239,68,68,0.45)";

  const overlay = (
    <>
      <div className="ft-card-photo-overlay"/>
      {/* availability badge — top right */}
      <div className="ft-card-avail-badge" style={{ background:badgeBg, borderColor:badgeBorder, color:ac }}>
        <span style={{ width:6, height:6, borderRadius:"50%", background:ac, flexShrink:0, animation:"livePulse 2s ease-in-out infinite" }}/>
        {available === 0 ? "Full" : `${available} free`}
      </div>
      {/* lot name — bottom of photo */}
      <div className="ft-card-photo-name">{name}</div>
    </>
  );

  if (imageUrl && !failed) {
    return (
      <div className="ft-card-photo">
        <img src={imageUrl} alt="" onError={() => setFailed(true)}/>
        {overlay}
      </div>
    );
  }

  // Placeholder when no image or load failed
  return (
    <div className="ft-card-photo" style={{
      background:`linear-gradient(135deg, ${catColor}14 0%, rgba(7,0,26,0.95) 100%)`,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {/* subtle dot-grid pattern */}
      <div style={{
        position:"absolute", inset:0, opacity:0.05,
        backgroundImage:"radial-gradient(rgba(125,57,235,.8) 1px, transparent 1px)",
        backgroundSize:"18px 18px",
      }}/>
      <span style={{ fontSize:36, position:"relative", opacity:0.6 }}>{catIcon}</span>
      {overlay}
    </div>
  );
}

function SpotCard({ spot: s, index, onOpen }) {
  const ac    = availColor(s.available, s.total);
  const avPct = s.total > 0 ? Math.round((s.available / s.total) * 100) : 0;

  return (
    <div
      className="ft-card"
      onClick={onOpen}
      style={{
        '--avail-color': `${ac}55`,
        animation: `ftCardIn 0.45s ${index * 60}ms both`,
      }}
    >
      {/* Image / placeholder with name + badge overlaid */}
      <CardImage
        imageUrl={s.imageUrl}
        category={s.category}
        ac={ac}
        name={s.name}
        available={s.available}
        total={s.total}
      />

      <div className="ft-card-body">
        {/* Address */}
        <div style={{
          display:"flex", alignItems:"center", gap:6,
          color:T.sub, fontSize:12, marginBottom:13,
        }}>
          <MapPinIcon size={11}/>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {s.address}
          </span>
        </div>

        {/* Three-column stats */}
        <div className="ft-card-stats">
          <div className="ft-card-stat">
            <TagIcon size={11}/>
            <strong style={{ color:T.text }}>
              {s.rate === 0 ? "Free" : `EGP ${s.rate}/hr`}
            </strong>
          </div>
          <div className="ft-card-stat">
            <NavigationIcon size={11}/>
            <strong style={{ color:T.text }}>{s.distance} km</strong>
          </div>
          <div className="ft-card-stat" style={{ minWidth:0 }}>
            <ClockIcon size={11}/>
            <strong style={{ color:T.text, overflowWrap:"break-word", lineHeight:1.35 }}>{s.hours}</strong>
          </div>
        </div>

        {/* Availability bar */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
            <span style={{ fontSize:11, color:T.sub }}>
              {s.available === 0 ? "No spots left" : `${s.available} of ${s.total} spots free`}
            </span>
            <span style={{ fontSize:11, fontFamily:"monospace", color:ac }}>{avPct}%</span>
          </div>
          <div className="ft-avail-bar-track">
            <div
              className="ft-avail-bar-fill"
              style={{ width:`${avPct}%`, background:`linear-gradient(90deg, ${ac}, ${ac}77)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DetailModal ──────────────────────────────────────────────────────────────

function DetailModal({ spot:s, user, onClose, onReserve, onViewSlots, onAuthOpen }) {
  const ac = availColor(s.available, s.total);
  const al = availLabel(s.available, s.total);
  const catColor = (s.category && CAT_COLORS[s.category]) || T.purple;
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name+" "+s.address)}`;

  useEffect(()=>{
    const h = e => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ft-modal-overlay" onClick={onClose}>
      <div className="ft-modal-box" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>

        {/* Hero */}
        <div style={{
          padding:"24px 24px 16px",
          background:"linear-gradient(135deg,rgba(125,57,235,.18),rgba(17,0,48,.9))",
          borderBottom:`1px solid ${T.border}`,position:"relative",
        }}>
          <button onClick={onClose} style={{
            position:"absolute",top:12,right:12,
            background:"rgba(255,255,255,.06)",border:`1px solid ${T.border}`,
            color:T.sub,cursor:"pointer",width:28,height:28,borderRadius:"50%",
            fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",
            transition:"background .15s",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.14)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.06)"}>✕</button>

          {s.category && (
            <span style={{fontSize:10,fontWeight:700,color:catColor,padding:"2px 8px",borderRadius:4,background:`${catColor}20`,marginBottom:10,display:"inline-block"}}>
              {s.category}
            </span>
          )}
          <h2 style={{fontSize:20,fontWeight:800,letterSpacing:-.5,marginBottom:3,lineHeight:1.2}}>{s.name}</h2>
          <div style={{fontSize:12,color:T.sub,marginBottom:10}}>📍 {s.address}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:ac,animation:"pls 1.5s infinite"}}/>
            <span style={{fontSize:13,fontWeight:700,color:ac}}>{al}</span>
            <span style={{fontSize:12,color:T.sub}}>
              · {s.available===0
                  ? "No spots available"
                  : `${s.available} of ${s.total} spots free`}
            </span>
          </div>
        </div>

        <div style={{padding:"18px 24px 24px"}}>

          {/* Info grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[
              {icon:"💰", label:"Rate",        value:s.rate===0?"Free":`EGP ${s.rate}/hr`, color:s.rate===0?T.green:T.text},
              {icon:"📏", label:"Distance",    value:`${s.distance} km away`,              color:T.text},
              {icon:"🕐", label:"Hours",       value:s.hours,                              color:T.text},
              {icon:"🅿️", label:"Total Slots", value:`${s.total} spots`,                  color:T.text},
            ].map(item=>(
              <div key={item.label} style={{padding:"10px 13px",borderRadius:10,background:"rgba(255,255,255,.03)",border:`1px solid ${T.border}`}}>
                <div style={{fontSize:11,color:T.sub,marginBottom:3}}>{item.icon} {item.label}</div>
                <div style={{fontSize:14,fontWeight:700,color:item.color}}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Occupancy */}
          <div style={{marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:12}}>
              <span style={{color:T.sub}}>Occupancy</span>
              <span style={{color:ac,fontWeight:700}}>{Math.round((1-s.available/s.total)*100)}% full</span>
            </div>
            <ProgressBar value={1-(s.available/s.total)} color={ac}/>
          </div>

          {/* Primary CTA */}
          {s.available>0
            ? <GlowBtn full onClick={onReserve} style={{marginBottom:10}}>Reserve</GlowBtn>
            : <div style={{textAlign:"center",padding:"12px",borderRadius:12,background:"rgba(239,68,68,.08)",border:`1px solid rgba(239,68,68,.2)`,color:T.red,fontWeight:700,marginBottom:10}}>
                🚫 This lot is currently full
              </div>
          }

          {/* Secondary */}
          <div style={{display:"flex",gap:10,marginBottom:!user&&s.available>0?12:0}}>
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" style={{
              flex:1,padding:"10px 12px",borderRadius:10,
              border:`1.5px solid ${T.border}`,background:"transparent",
              color:T.text,fontFamily:"inherit",fontSize:13,fontWeight:600,
              textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5,
              transition:"border-color .2s,background .2s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#34A853";e.currentTarget.style.background="rgba(52,168,83,.07)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="transparent";}}>
              🗺 Open in Maps
            </a>
            <button onClick={onViewSlots} style={{
              flex:1,padding:"10px 12px",borderRadius:10,
              border:`1.5px solid ${T.border}`,background:"transparent",
              color:T.text,fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:5,
              transition:"border-color .2s,background .2s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.purple;e.currentTarget.style.background="rgba(125,57,235,.07)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="transparent";}}>
              🅿️ View Slots
            </button>
          </div>

          {!user && s.available>0 && (
            <div className="ft-auth-banner">
              <span style={{fontSize:16}}>🔐</span>
              <span style={{fontSize:12,color:T.sub,flex:1}}>Log in to complete your reservation</span>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <GlowBtn small outline noArrow onClick={onAuthOpen}>Log In</GlowBtn>
                <GlowBtn small noArrow onClick={onAuthOpen}>Sign Up</GlowBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SlotMapModal ─────────────────────────────────────────────────────────────

function SlotMapModal({ spot:s, slots, slotsLoading, profile, onClose, onBack, onReserve }) {
  const [activeLevel,  setActiveLevel]  = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const hasEV        = profile?.vehicles?.some(v=>v.isEV) ?? false;
  const isAccessible = profile?.accessibility ?? false;

  const levels     = [...new Set(slots.map(sl=>sl.level))].sort();
  const levelSlots = slots.filter(sl=>sl.level===activeLevel);
  const rows       = [];
  for(let r=0; r<Math.ceil(levelSlots.length/10); r++){
    rows.push(levelSlots.slice(r*10,(r+1)*10));
  }

  const counts = {
    available:  slots.filter(sl=>sl.status==="available").length,
    occupied:   slots.filter(sl=>sl.status==="occupied").length,
    reserved:   slots.filter(sl=>sl.status==="reserved").length,
    ev:         slots.filter(sl=>sl.type==="ev").length,
    accessible: slots.filter(sl=>sl.type==="accessible").length,
  };

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name+" "+s.address)}`;

  useEffect(()=>{
    const h = e => {
      if(e.key==="Escape"){ if(selectedSlot) setSelectedSlot(null); else onClose(); }
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[selectedSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ft-modal-overlay" onClick={()=>{ if(selectedSlot) setSelectedSlot(null); else onClose(); }}>
      <div className="ft-modal-box" style={{maxWidth:680}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:"16px 20px 13px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
          <button onClick={onBack} style={{
            background:"rgba(255,255,255,.04)",border:`1px solid ${T.border}`,
            color:T.sub,cursor:"pointer",padding:"5px 11px",borderRadius:7,
            fontFamily:"inherit",fontSize:12,fontWeight:600,
            display:"flex",alignItems:"center",gap:4,transition:"color .15s",
          }}
            onMouseEnter={e=>e.currentTarget.style.color=T.text}
            onMouseLeave={e=>e.currentTarget.style.color=T.sub}>
            ← Details
          </button>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:14}}>{s.name}</div>
            <div style={{fontSize:11,color:T.sub}}>Slot Map · {counts.available} available</div>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,.06)",border:`1px solid ${T.border}`,
            color:T.sub,cursor:"pointer",width:27,height:27,borderRadius:"50%",
            fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",
            transition:"background .15s",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.12)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.06)"}>✕</button>
        </div>

        <div style={{padding:"14px 20px 20px"}}>

          {/* Status summary */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12,justifyContent:"center"}}>
            {[
              {label:`${counts.available} Available`, color:SLOT_CONFIG.available.color, bg:SLOT_CONFIG.available.bg},
              {label:`${counts.occupied} Occupied`,   color:SLOT_CONFIG.occupied.color,  bg:SLOT_CONFIG.occupied.bg},
              counts.ev>0         && {label:`${counts.ev} EV ⚡`,     color:"#F59E0B", bg:"rgba(245,158,11,.15)"},
              counts.accessible>0 && {label:`${counts.accessible} ♿`, color:"#60A5FA", bg:"rgba(96,165,250,.15)"},
            ].filter(Boolean).map(item=>(
              <span key={item.label} style={{padding:"3px 9px",borderRadius:5,background:item.bg,color:item.color,fontSize:11,fontWeight:700}}>
                {item.label}
              </span>
            ))}
          </div>

          {/* Legend */}
          <div style={{
            display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center", alignItems:"center",
            marginBottom:12, padding:"8px 11px", borderRadius:8,
            background:"rgba(255,255,255,.02)", border:`1px solid ${T.border}`,
          }}>
            {[
              { color:SLOT_CONFIG.available.color, label:"Available" },
              { color:SLOT_CONFIG.occupied.color,  label:"Occupied"  },
              { color:"#F59E0B", label:"EV ⚡"         },
              { color:"#60A5FA", label:"Accessible ♿" },
            ].map(l=>(
              <div key={l.label} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:T.sub}}>
                <div style={{width:10,height:10,borderRadius:3,background:l.color}}/>
                {l.label}
              </div>
            ))}
          </div>

          {/* Level tabs */}
          {levels.length > 1 && (
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginBottom:6}}>
                {levels.map(lv=>{
                  const lvAvail = slots.filter(sl=>sl.level===lv&&sl.status==="available").length;
                  return(
                    <button key={lv} onClick={()=>{setActiveLevel(lv);setSelectedSlot(null);}} style={{
                      padding:"6px 14px",borderRadius:8,
                      border:`1.5px solid ${activeLevel===lv?T.purple:T.border}`,
                      background:activeLevel===lv?"rgba(125,57,235,.12)":"transparent",
                      color:activeLevel===lv?T.purple:T.sub,
                      fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer",
                      transition:"all .2s",
                    }}>
                      Level {lv}
                      <span style={{marginLeft:5,fontSize:10,color:lvAvail>0?T.green:T.red}}>
                        {lvAvail} free
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={{textAlign:"center",fontSize:11,color:T.sub,opacity:.8,fontStyle:"italic"}}>
                Tap a slot to view details or navigate
              </div>
            </div>
          )}

          {/* Slot grid */}
          {slotsLoading && (
            <div style={{textAlign:"center",padding:"36px 0",color:T.sub,fontSize:13}}>
              Loading slots…
            </div>
          )}
          {!slotsLoading && slots.length===0 && (
            <div style={{textAlign:"center",padding:"36px 0",color:T.sub,fontSize:13}}>
              No slot data available for this lot.
            </div>
          )}
          <div style={{
            display:slotsLoading||slots.length===0?"none":undefined,
            background:"rgba(7,0,26,.6)",borderRadius:12,padding:"13px 10px",
            border:`1px solid ${T.border}`,marginBottom:14,overflowX:"auto",
          }}>
            <div style={{textAlign:"center",fontSize:9,color:T.sub,letterSpacing:1,marginBottom:8,opacity:.55}}>
              ── ENTRY LANE ──
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,minWidth:"fit-content"}}>
              {rows.map((row,ri)=>(
                <div key={ri}>
                  {ri>0&&ri%2===0&&(
                    <div style={{textAlign:"center",fontSize:9,color:T.sub,opacity:.35,margin:"2px 0",letterSpacing:1}}>
                      ── LANE ──
                    </div>
                  )}
                  <div style={{display:"flex",gap:5,justifyContent:"center"}}>
                    {row.map(sl=>{
                      const cfg   = slotTileColor(sl);
                      const isSel = selectedSlot?.id===sl.id;
                      return(
                        <div
                          key={sl.id}
                          className={`ft-slot ${sl.status}`}
                          onClick={()=>setSelectedSlot(isSel?null:sl)}
                          style={{
                            background:  isSel?cfg.color+"44":cfg.bg,
                            borderColor: isSel?cfg.color:cfg.border,
                            boxShadow:   isSel?`0 0 14px ${cfg.color}55`:undefined,
                          }}
                        >
                          {sl.type!=="standard"&&(
                            <span style={{position:"absolute",top:2,right:2,fontSize:8,color:cfg.color}}>
                              {TYPE_BADGES[sl.type].icon}
                            </span>
                          )}
                          <span style={{fontSize:8,color:cfg.color,fontWeight:700,lineHeight:1,textAlign:"center"}}>
                            {String.fromCharCode(64+sl.level)}{sl.slotNum}
                          </span>
                          <span style={{fontSize:11,marginTop:1}}>{SLOT_CONFIG[sl.status].icon}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected slot info */}
          {selectedSlot&&(
            <SlotInfoPanel
              slot={selectedSlot} spot={s} gmapsUrl={gmapsUrl}
              hasEV={hasEV} isAccessible={isAccessible}
            />
          )}

          {/* Bottom CTA */}
          {selectedSlot
            ? selectedSlot.status==="available"&&(()=>{
                const eligible=(selectedSlot.type!=="ev"||hasEV)&&(selectedSlot.type!=="accessible"||isAccessible);
                return eligible?(
                  <div style={{display:"flex",gap:10}}>
                    <GlowBtn full onClick={onReserve}>Reserve</GlowBtn>
                    <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" style={{
                      padding:"11px 16px",borderRadius:11,
                      border:`1px solid #34A85344`,background:"rgba(52,168,83,.06)",
                      color:"#34A853",fontSize:13,fontWeight:600,textDecoration:"none",
                      display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",
                    }}>🗺 Navigate to {s.name}</a>
                  </div>
                ):null;
              })()
            : (
                <div style={{display:"flex",gap:10}}>
                  {s.available>0
                    ?<GlowBtn full onClick={onReserve}>Reserve</GlowBtn>
                    :<div style={{flex:1,textAlign:"center",padding:"12px",borderRadius:11,background:"rgba(239,68,68,.08)",border:`1px solid rgba(239,68,68,.2)`,color:T.red,fontWeight:700}}>🚫 Lot Full</div>
                  }
                  <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" style={{
                    padding:"11px 16px",borderRadius:11,
                    border:`1px solid #34A85344`,background:"rgba(52,168,83,.06)",
                    color:"#34A853",fontSize:13,fontWeight:600,textDecoration:"none",
                    display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",
                  }}>🗺 Navigate to {s.name}</a>
                </div>
              )
          }
        </div>
      </div>
    </div>
  );
}

// ─── SlotInfoPanel ────────────────────────────────────────────────────────────

function SlotInfoPanel({ slot:sl, spot:s, gmapsUrl, hasEV, isAccessible }) {
  const cfg = slotTileColor(sl);
  const statusCfg = SLOT_CONFIG[sl.status];
  const distToLift = ((sl.slotNum % 4) + 1) * 15;
  const needsEV         = sl.type==="ev";
  const needsAccessible = sl.type==="accessible";
  const evBlocked       = needsEV&&!hasEV;
  const accessBlocked   = needsAccessible&&!isAccessible;
  const blocked         = evBlocked||accessBlocked;

  return(
    <div style={{
      padding:"14px 16px",borderRadius:12,
      border:`1.5px solid ${cfg.border}`,background:cfg.bg,
      marginBottom:14,animation:"ftSlideUp .22s cubic-bezier(.22,1,.36,1)",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <div style={{fontWeight:800,fontSize:14,marginBottom:2,display:"flex",alignItems:"center",gap:6}}>
            Slot {String.fromCharCode(64+sl.level)}{sl.slotNum}
            {sl.type!=="standard"&&(
              <span style={{fontSize:11,color:cfg.color,fontWeight:700,display:"flex",alignItems:"center",gap:3}}>
                {TYPE_BADGES[sl.type].icon} {TYPE_BADGES[sl.type].label}
              </span>
            )}
          </div>
          <div style={{fontSize:11,color:T.sub}}>Level {sl.level} · {s.name}</div>
        </div>
        <span style={{
          padding:"3px 8px",borderRadius:5,fontSize:11,fontWeight:700,
          background:`${statusCfg.color}22`,color:statusCfg.color,textTransform:"capitalize",
        }}>{sl.status}</span>
      </div>

      {sl.status==="available"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <div style={{padding:"9px 12px",borderRadius:9,background:"rgba(255,255,255,.04)",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,color:T.sub,marginBottom:3}}>🚶 Distance to Lift</div>
              <div style={{fontSize:14,fontWeight:700,color:T.text}}>{distToLift} m</div>
              <div style={{fontSize:10,color:T.sub}}>~{Math.ceil(distToLift/60)} min walk</div>
            </div>
            <div style={{padding:"9px 12px",borderRadius:9,background:"rgba(255,255,255,.04)",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:10,color:T.sub,marginBottom:3}}>💰 Hourly Rate</div>
              <div style={{fontSize:14,fontWeight:700,color:s.rate===0?T.green:T.text}}>
                {s.rate===0?"Free":`EGP ${s.rate}`}
              </div>
              {s.rate>0&&<div style={{fontSize:10,color:T.sub}}>per hour</div>}
            </div>
          </div>
          {blocked&&(
            <div style={{
              padding:"10px 13px",borderRadius:9,marginBottom:10,
              background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.22)",
              display:"flex",gap:8,alignItems:"flex-start",
            }}>
              <span style={{fontSize:14,flexShrink:0}}>🚫</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.red,marginBottom:2}}>
                  {evBlocked?"EV Charging Spots — Electric Vehicles Only":"Accessible Spots — Verified Need Required"}
                </div>
                <div style={{fontSize:11,color:T.sub,lineHeight:1.5}}>
                  {evBlocked
                    ?"Add an electric vehicle to your profile to reserve EV charging spots."
                    :"Enable Accessibility Need in your Account profile to reserve accessible spots."}
                </div>
              </div>
            </div>
          )}
          {!blocked&&(
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" style={{
              display:"flex",alignItems:"center",justifyContent:"center",gap:4,
              padding:"9px 12px",borderRadius:9,
              border:`1px solid #34A85355`,background:"rgba(52,168,83,.07)",
              color:"#34A853",fontSize:12,fontWeight:600,textDecoration:"none",
            }}>🗺 Navigate to Slot {String.fromCharCode(64+sl.level)}{sl.slotNum}</a>
          )}
        </>
      )}

      {sl.status==="occupied"&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{
            padding:"11px 13px",borderRadius:9,
            background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.22)",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <span style={{fontSize:13}}>🤖</span>
              <span style={{fontSize:12,fontWeight:700,color:"#F59E0B"}}>AI Availability Prediction</span>
              <span style={{
                marginLeft:"auto",fontSize:10,fontWeight:700,color:"#F59E0B",
                padding:"2px 6px",borderRadius:4,background:"rgba(245,158,11,.15)",
              }}>{sl.confidence}% confidence</span>
            </div>
            <div style={{fontSize:14,fontWeight:800,color:T.text,marginBottom:3}}>
              Estimated free in{" "}
              <span style={{color:"#F59E0B"}}>{sl.predictedMinutes} minute{sl.predictedMinutes!==1?"s":""}</span>
            </div>
            <div style={{fontSize:11,color:T.sub,lineHeight:1.5}}>
              Predicted using historical occupancy patterns, average dwell times, and real-time session data for this slot type and time of day.
            </div>
          </div>
          <div style={{
            display:"flex",gap:7,padding:"9px 11px",borderRadius:8,
            background:"rgba(239,68,68,.05)",border:"1px solid rgba(239,68,68,.16)",
          }}>
            <span style={{fontSize:12,flexShrink:0}}>⚠️</span>
            <p style={{fontSize:11,color:"rgba(239,68,68,.85)",margin:0,lineHeight:1.55}}>
              <strong>This is a prediction, not a guarantee.</strong> Actual availability depends on the current driver's session and may differ. We recommend checking nearby available slots.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
