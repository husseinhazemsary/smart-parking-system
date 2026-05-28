import React, { useState, useEffect } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { SPOTS, availColor, availLabel } from "../data/spots";
import ProgressBar from "../components/ui/ProgressBar";
import GlowBtn from "../components/ui/GlowBtn";

// Seeded random — stable across renders so slot states are consistent
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// Generates deterministic slot data for a parking spot
function generateSlots(spotId, total) {
  const rand = seededRand(spotId * 9973);
  const levels = total > 100 ? 3 : total > 50 ? 2 : 1;
  const perLevel = Math.ceil(total / levels);
  const allSlots = [];
  let id = 1;
  for (let lv = 1; lv <= levels; lv++) {
    const count = lv === levels ? total - perLevel * (levels - 1) : perLevel;
    for (let i = 0; i < count; i++) {
      const r1 = rand(), r2 = rand(), r3 = rand();
      allSlots.push({
        id: `${spotId}-${id}`,
        slotNum: id,
        level: lv,
        type: r2 < 0.05 ? "ev" : r2 < 0.1 ? "accessible" : "standard",
        status: r1 < 0.3 ? "available" : "occupied",
        predictedMinutes: Math.floor(r3 * 50 + 5),   
        confidence: Math.floor(r3 * 25 + 68),         
      });
      id++;
    }
  }
  return allSlots;
}

const SPOT_SLOTS = {};
SPOTS.forEach(s => { SPOT_SLOTS[s.id] = generateSlots(s.id, s.total); });

// Category icons, colors, and slot status config
const CAT_ICONS  = { Mall:"🏬", University:"🎓", Airport:"✈️", Street:"🚗", All:"📍" };
const CAT_COLORS = { Mall:"#C084FC", University:T.green, Airport:"#F59E0B", Street:"#38BDF8" };

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

// For EV and accessible slots, type overrides default status color
function slotTileColor(sl) {
  if (sl.type === "ev")         return { color:"#F59E0B", bg:"rgba(245,158,11,.18)", border:"rgba(245,158,11,.45)" };
  if (sl.type === "accessible") return { color:"#60A5FA", bg:"rgba(96,165,250,.18)", border:"rgba(96,165,250,.45)" };
  return SLOT_CONFIG[sl.status];
}

const inputStyle = {
  width:"100%", height:46, borderRadius:12, border:`1px solid ${T.border}`,
  background:"rgba(255,255,255,.04)", color:T.text, fontFamily:"inherit",
  fontSize:14, padding:"0 16px", outline:"none", boxSizing:"border-box",
};

// Component-scoped styles
const CSS = `
  .ft-card {
    border-radius:18px; border:1.5px solid rgba(125,57,235,.2);
    background:rgba(17,0,48,.65); overflow:hidden;
    transition:transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s, border-color .2s;
    cursor:default;
  }
  .ft-card:hover {
    transform:translateY(-4px);
    box-shadow:0 16px 48px rgba(125,57,235,.2);
    border-color:rgba(125,57,235,.5);
  }
  .ft-cat-pill {
    padding:6px 16px; border-radius:999px; border:1.5px solid;
    font-size:12px; font-weight:700; cursor:pointer;
    font-family:'Sora',sans-serif;
    transition:all .2s cubic-bezier(.22,1,.36,1); white-space:nowrap;
  }
  .ft-modal-overlay {
    position:fixed; inset:0; z-index:300;
    background:rgba(7,0,26,.82); backdrop-filter:blur(10px);
    display:flex; align-items:center; justify-content:center; padding:20px;
    animation:ftFadeIn .2s ease;
  }
  .ft-modal-box {
    background:#110030; border:1px solid rgba(125,57,235,.28);
    border-radius:22px; width:100%; max-height:90vh; overflow-y:auto;
    box-shadow:0 32px 96px rgba(0,0,0,.7);
    animation:ftSlideUp .28s cubic-bezier(.22,1,.36,1);
  }
  .ft-slot {
    width:54px; height:54px; border-radius:10px; border:1.5px solid;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    cursor:pointer;
    transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
    position:relative; flex-shrink:0;
  }
  .ft-slot:hover { transform:scale(1.12); }
  .ft-slot.available:hover { box-shadow:0 4px 20px rgba(34,197,94,.35); }
  .ft-slot.occupied:hover  { box-shadow:0 4px 14px rgba(239,68,68,.25); }
  .ft-auth-banner {
    display:flex; align-items:center; gap:10px; padding:11px 14px;
    border-radius:11px; background:rgba(125,57,235,.07);
    border:1px solid rgba(125,57,235,.22);
  }
  @keyframes ftFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes ftSlideUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pls { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(2.2);opacity:0} }
`;

// Main FindTab component — search, filter, and view parking spots.
export default function FindTab({ onReserve, user, onAuthOpen, activeReservation, onGoToSession, initialSpotId, onSpotDetailOpened, profile }) {
  const [search,     setSearch]     = useState("");
  const [cat,        setCat]        = useState("All");
  const [sort,       setSort]       = useState("distance");
  const [detailSpot, setDetailSpot] = useState(null);
  const [slotSpot,   setSlotSpot]   = useState(null);
  const { isMobile } = useBreakpoint();

  useEffect(()=>{
    if(initialSpotId){
      const spot = SPOTS.find(s=>s.id===initialSpotId);
      if(spot){ setDetailSpot(spot); setSlotSpot(null); }
      onSpotDetailOpened?.();
    }
  },[initialSpotId]);

  const cats = ["All","Mall","University","Airport","Street"];

  const filtered = SPOTS
    .filter(s =>
      (cat==="All" || s.category===cat) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
       s.address.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a,b) =>
      sort==="distance" ? a.distance-b.distance :
      sort==="price"    ? a.rate-b.rate :
      sort==="avail"    ? b.available-a.available : 0
    );

  const openDetail = (s) => { setDetailSpot(s); setSlotSpot(null); };
  const closeAll   = ()  => { setDetailSpot(null); setSlotSpot(null); };

  const handleReserve = (spot) => {
    if (!user) { onAuthOpen?.(); return; }
    closeAll();
    onReserve(spot);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0, overflowY:"auto" }}>
      <style dangerouslySetInnerHTML={{__html: CSS}}/>

      {/* ── Header ── */}
      <div style={{ padding:isMobile?"20px 16px 0":"28px 28px 0", flexShrink:0 }}>

        {/* Auth banner — ONE instance, top of page only
            Contextual nudge without cluttering every card.
            Buttons here have noArrow per the design system. */}
        {!user && (
          <div className="ft-auth-banner" style={{marginBottom:16}}>
            <span style={{fontSize:18}}>🔐</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:1}}>Sign in to reserve</div>
              <div style={{fontSize:11,color:T.sub}}>Browse freely — log in when you're ready to book.</div>
            </div>
            <div style={{display:"flex",gap:7,flexShrink:0}}>
              <GlowBtn small outline noArrow onClick={onAuthOpen}>Log In</GlowBtn>
              <GlowBtn small noArrow onClick={onAuthOpen}>Sign Up</GlowBtn>
            </div>
          </div>
        )}

        {/* Active reservation banner — shown when the user already has a reservation */}
        {user && activeReservation && (
          <div style={{
            display:"flex",alignItems:"center",gap:10,marginBottom:16,
            padding:"11px 14px",borderRadius:11,
            background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.22)",
          }}>
            <span style={{fontSize:18}}>⏱</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:1,color:"#F59E0B"}}>
                You already have an active reservation
              </div>
              <div style={{fontSize:11,color:T.sub}}>
                Cancel it first from My Session if you want to book elsewhere.
              </div>
            </div>
            <GlowBtn small noArrow onClick={onGoToSession}>My Session</GlowBtn>
          </div>
        )}

        {/* Search */}
        <div style={{position:"relative",marginBottom:14}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:T.sub,pointerEvents:"none"}}>🔍</span>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name or area..."
            style={{...inputStyle, paddingLeft:44}}
          />
          {search && (
            <button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:15,lineHeight:1}}>✕</button>
          )}
        </div>

        {/* Filters + sort */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:14}}>
          {cats.map(c=>(
            <button key={c} className="ft-cat-pill" onClick={()=>setCat(c)} style={{
              borderColor: cat===c ? (CAT_COLORS[c]||T.purple) : T.border,
              background:  cat===c ? `${CAT_COLORS[c]||T.purple}1A` : "transparent",
              color:       cat===c ? (CAT_COLORS[c]||T.purple) : T.sub,
            }}>
              {c}
            </button>
          ))}
          <div style={{marginLeft:"auto",display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
            <span style={{fontSize:11,color:T.sub,marginRight:2}}>Sort:</span>
            {[["distance","Nearest"],["price","Price"],["avail","Available"]].map(([v,l])=>(
              <button key={v} onClick={()=>setSort(v)} style={{
                padding:"5px 9px",borderRadius:7,
                border:`1px solid ${sort===v?T.purple:T.border}`,
                background:sort===v?"rgba(125,57,235,.12)":"transparent",
                color:sort===v?T.purple:T.sub,
                fontSize:11,fontWeight:sort===v?700:400,
                cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",
                transition:"all .15s",
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{fontSize:12,color:T.sub,marginBottom:14}}>
          {filtered.length} location{filtered.length!==1?"s":""} found
          {cat!=="All"?` in ${cat}`:""}
          {search?` matching "${search}"`:""}
        </div>
      </div>

      {/* ── Card grid ── */}
      <div style={{
        padding:isMobile?"12px 16px 24px":"16px 28px 28px",
        display:"grid",
        gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill, minmax(300px, 1fr))",
        gap:16, overflowY:"auto", flex:1,
      }}>
        {filtered.length===0 && (
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"64px 0",color:T.sub}}>
            <div style={{fontSize:40,marginBottom:12}}>🔍</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>No locations found</div>
            <div style={{fontSize:13}}>Try a different search or category</div>
          </div>
        )}
        {filtered.map((s,i)=>(
          <SpotCard
            key={s.id} spot={s} index={i}
            onViewDetail={()=>openDetail(s)}
            onViewSlots={()=>openSlots(s)}
          />
        ))}
      </div>

      {/* ── Modals ── */}
      {detailSpot && (
        <DetailModal
          spot={detailSpot} user={user}
          onClose={closeAll}
          onReserve={()=>handleReserve(detailSpot)}
          onAuthOpen={onAuthOpen}
        />
      )}
    </div>
  );
}

// SpotCard — compact listing card with availability bar and action buttons.
function SpotCard({ spot:s, onViewDetail }) {
  const ac = availColor(s.available, s.total);
  const al = availLabel(s.available, s.total);

  return (
    <div className="ft-card">
      <div style={{padding:"16px 16px 14px"}}>

        {/* Header */}
        <div style={{marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:18,lineHeight:1.2,marginBottom:4}}>{s.name}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
            <div style={{fontSize:12,color:T.sub,display:"flex",alignItems:"center",gap:3,minWidth:0}}>
              <span>📍</span>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.address}</span>
            </div>
            <div style={{flexShrink:0,fontSize:13,fontWeight:600,color:s.rate===0?T.green:T.sub}}>
              {s.rate===0?"Free":`EGP ${s.rate}/hr`}
            </div>
          </div>
        </div>

        {/* Availability — shows number of free spots, not percentage */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:ac,animation:"pls 1.8s infinite",flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:700,color:ac}}>{al}</span>
            </div>
            <span style={{fontSize:12,fontWeight:700,color:s.available===0?T.red:T.text}}>
              {s.available===0
                ? "No spots left"
                : `${s.available} spot${s.available!==1?"s":""} free`}
            </span>
          </div>
          <ProgressBar value={1-(s.available/s.total)} color={ac}/>
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={onViewDetail} style={{
            flex:1,padding:"10px",borderRadius:11,
            border:`1.5px solid ${T.purple}`,background:"rgba(125,57,235,.08)",
            color:T.purple,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",
            transition:"background .2s",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(125,57,235,.16)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(125,57,235,.08)"}>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

// DetailModal — full spot info with reserve CTA and maps link.
function DetailModal({ spot:s, user, onClose, onReserve, onAuthOpen }) {
  const ac = availColor(s.available, s.total);
  const al = availLabel(s.available, s.total);
  const catColor = CAT_COLORS[s.category] || T.purple;
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name+" "+s.address)}`;

  useEffect(()=>{
    const h = e => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]);

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

          <span style={{fontSize:10,fontWeight:700,color:catColor,padding:"2px 8px",borderRadius:4,background:`${catColor}20`,marginBottom:10,display:"inline-block"}}>
            {CAT_ICONS[s.category]} {s.category}
          </span>
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

          {/* Info grid — hours, distance, rate, total slots */}
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

          {/* Secondary: Maps */}
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
          </div>

          {/* Auth nudge — only inside modal, only if not logged in + spot available */}
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

// SlotMapModal — interactive floor-plan view with per-slot selection.
function SlotMapModal({ spot:s, slots, user, profile, onClose, onBack, onReserve, onAuthOpen }) {
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
  },[selectedSlot]);

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

          {/* Status summary — centered */}
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
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              justifyContent: "center",   
              alignItems: "center",
              marginBottom: 12,
              padding: "8px 11px",
              borderRadius: 8,
              background: "rgba(255,255,255,.02)",
              border: `1px solid ${T.border}`
            }}
          >
            {[
              { color: SLOT_CONFIG.available.color, label: "Available" },
              { color: SLOT_CONFIG.occupied.color, label: "Occupied" },
              { color: "#F59E0B", label: "EV ⚡" },
              { color: "#60A5FA", label: "Accessible ♿" },
            ].map((l) => (
              <div
                key={l.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: T.sub
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Level tabs */}
          {levels.length > 1 && (
            <div style={{ marginBottom: 12 }}>
              
              {/* Tabs Row */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: 6
                }}
              >
                {levels.map((lv) => {
                  const lvAvail = slots.filter(
                    (sl) => sl.level === lv && sl.status === "available"
                  ).length;

                  return (
                    <button
                      key={lv}
                      onClick={() => {
                        setActiveLevel(lv);
                        setSelectedSlot(null);
                      }}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: `1.5px solid ${
                          activeLevel === lv ? T.purple : T.border
                        }`,
                        background:
                          activeLevel === lv
                            ? "rgba(125,57,235,.12)"
                            : "transparent",
                        color: activeLevel === lv ? T.purple : T.sub,
                        fontFamily: "inherit",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all .2s",
                      }}
                    >
                      Level {lv}
                      <span
                        style={{
                          marginLeft: 5,
                          fontSize: 10,
                          color: lvAvail > 0 ? T.green : T.red,
                        }}
                      >
                        {lvAvail} free
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Helper text */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: T.sub,
                  opacity: 0.8,
                  fontStyle: "italic"
                }}
              >
                Tap a slot to view details or navigate
              </div>
            </div>
          )}

          {/* Slot grid */}
          <div style={{
            background:"rgba(7,0,26,.6)",borderRadius:12,padding:"13px 10px",
            border:`1px solid ${T.border}`,marginBottom:14,overflowX:"auto",
          }}>
            <div style={{textAlign:"center",fontSize:9,color:T.sub,letterSpacing:1,marginBottom:8,opacity:.55}}>
              ── ENTRY LANE ──
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,minWidth:"fit-content"}}>
              {rows.map((row,ri)=>(
                <div key={ri}>
                  {ri>0 && ri%2===0 && (
                    <div style={{textAlign:"center",fontSize:9,color:T.sub,opacity:.35,margin:"2px 0",letterSpacing:1}}>
                      ── LANE ──
                    </div>
                  )}
                  <div style={{display:"flex",gap:5,justifyContent:"center"}}>
                    {row.map(sl=>{
                      const cfg    = slotTileColor(sl);
                      const isSel  = selectedSlot?.id===sl.id;
                      return(
                        <div
                          key={sl.id}
                          className={`ft-slot ${sl.status}`}
                          onClick={()=>setSelectedSlot(isSel?null:sl)}
                          style={{
                            background:  isSel ? cfg.color+"44" : cfg.bg,
                            borderColor: isSel ? cfg.color : cfg.border,
                            boxShadow:   isSel ? `0 0 14px ${cfg.color}55` : undefined,
                          }}
                        >
                          {sl.type!=="standard" && (
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
          {selectedSlot && (
            <SlotInfoPanel
              slot={selectedSlot}
              spot={s}
              user={user}
              gmapsUrl={gmapsUrl}
              onAuthOpen={onAuthOpen}
              hasEV={hasEV}
              isAccessible={isAccessible}
            />
          )}

          {/* Bottom CTA */}
          {selectedSlot
            ? selectedSlot.status==="available" && (() => {
                const eligible =
                  (selectedSlot.type!=="ev"         || hasEV) &&
                  (selectedSlot.type!=="accessible"  || isAccessible);
                return eligible ? (
                  <div style={{display:"flex",gap:10}}>
                    <GlowBtn full onClick={onReserve}>Reserve</GlowBtn>
                    <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" style={{
                      padding:"11px 16px",borderRadius:11,
                      border:`1px solid #34A85344`,background:"rgba(52,168,83,.06)",
                      color:"#34A853",fontSize:13,fontWeight:600,textDecoration:"none",
                      display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",
                    }}>🗺 Navigate to {s.name}</a>
                  </div>
                ) : null;
              })()
            : (
                <div style={{display:"flex",gap:10}}>
                  {s.available>0
                    ? <GlowBtn full onClick={onReserve}>Reserve</GlowBtn>
                    : <div style={{flex:1,textAlign:"center",padding:"12px",borderRadius:11,background:"rgba(239,68,68,.08)",border:`1px solid rgba(239,68,68,.2)`,color:T.red,fontWeight:700}}>🚫 Lot Full</div>
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

// SlotInfoPanel — shows details for the selected slot, or ML prediction if occupied.
function SlotInfoPanel({ slot:sl, spot:s, user, gmapsUrl, onAuthOpen, hasEV, isAccessible }) {
  const cfg = slotTileColor(sl);
  const statusCfg = SLOT_CONFIG[sl.status];

  // Deterministic walk distance to lift based on slot number
  const distToLift = ((sl.slotNum % 4) + 1) * 15;

  // Eligibility checks for special slot types
  const needsEV         = sl.type === "ev";
  const needsAccessible = sl.type === "accessible";
  const evBlocked       = needsEV && !hasEV;
  const accessBlocked   = needsAccessible && !isAccessible;
  const blocked         = evBlocked || accessBlocked;

  return (
    <div style={{
      padding:"14px 16px", borderRadius:12,
      border:`1.5px solid ${cfg.border}`, background:cfg.bg,
      marginBottom:14,
      animation:"ftSlideUp .22s cubic-bezier(.22,1,.36,1)",
    }}>
      {/* Slot header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <div style={{fontWeight:800,fontSize:14,marginBottom:2,display:"flex",alignItems:"center",gap:6}}>
            Slot {String.fromCharCode(64+sl.level)}{sl.slotNum}
            {sl.type!=="standard" && (
              <span style={{fontSize:11,color:cfg.color,fontWeight:700,display:"flex",alignItems:"center",gap:3}}>
                {TYPE_BADGES[sl.type].icon} {TYPE_BADGES[sl.type].label}
              </span>
            )}
          </div>
          <div style={{fontSize:11,color:T.sub}}>Level {sl.level} · {s.name}</div>
        </div>
        <span style={{
          padding:"3px 8px", borderRadius:5, fontSize:11, fontWeight:700,
          background:`${statusCfg.color}22`, color:statusCfg.color, textTransform:"capitalize",
        }}>{sl.status}</span>
      </div>

      {/* ── AVAILABLE ── */}
      {sl.status==="available" && (
        <>
          {/* Info grid: distance to lift + hourly rate */}
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
              {s.rate>0 && <div style={{fontSize:10,color:T.sub}}>per hour</div>}
            </div>
          </div>

          {/* Eligibility notice — shown when user doesn't qualify for this slot type */}
          {blocked && (
            <div style={{
              padding:"10px 13px", borderRadius:9, marginBottom:10,
              background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.22)",
              display:"flex", gap:8, alignItems:"flex-start",
            }}>
              <span style={{fontSize:14,flexShrink:0}}>🚫</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.red,marginBottom:2}}>
                  {evBlocked ? "EV Charging Spots — Electric Vehicles Only" : "Accessible Spots — Verified Need Required"}
                </div>
                <div style={{fontSize:11,color:T.sub,lineHeight:1.5}}>
                  {evBlocked
                    ? "Add an electric vehicle to your profile to reserve EV charging spots."
                    : "Enable Accessibility Need in your Account profile to reserve accessible spots."}
                </div>
              </div>
            </div>
          )}

          {/* Navigate to specific slot — hidden when user is not eligible */}
          {!blocked && (
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:4,
              padding:"9px 12px", borderRadius:9,
              border:`1px solid #34A85355`, background:"rgba(52,168,83,.07)",
              color:"#34A853", fontSize:12, fontWeight:600, textDecoration:"none",
            }}>🗺 Navigate to Slot {String.fromCharCode(64+sl.level)}{sl.slotNum}</a>
          )}
        </>
      )}

      {/* ── OCCUPIED — ML Prediction ── */}
      {sl.status==="occupied" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{
            padding:"11px 13px", borderRadius:9,
            background:"rgba(245,158,11,.07)", border:"1px solid rgba(245,158,11,.22)",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <span style={{fontSize:13}}>🤖</span>
              <span style={{fontSize:12,fontWeight:700,color:"#F59E0B"}}>AI Availability Prediction</span>
              <span style={{
                marginLeft:"auto", fontSize:10, fontWeight:700, color:"#F59E0B",
                padding:"2px 6px", borderRadius:4, background:"rgba(245,158,11,.15)",
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
            display:"flex", gap:7, padding:"9px 11px", borderRadius:8,
            background:"rgba(239,68,68,.05)", border:"1px solid rgba(239,68,68,.16)",
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