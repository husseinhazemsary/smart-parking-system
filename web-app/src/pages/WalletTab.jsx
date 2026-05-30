import React, { useState, useEffect } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { TRANSACTIONS } from "../data/transactions";
import GlowBtn from "../components/ui/GlowBtn";
import Modal from "../components/ui/Modal";

// ── Static chart data ────────────────────────────────────────────────────────
const MONTHLY_SPEND = [
  { month:"Jan", amount:120 }, { month:"Feb", amount:85 },
  { month:"Mar", amount:200 }, { month:"Apr", amount:145 },
  { month:"May", amount:165 }, { month:"Jun", amount:205 },
];
const DONUT_DATA = [
  { label:"Airports",     amount:50,  color:"#7D39EB" },
  { label:"Malls",        amount:155, color:"#22C55E" },
  { label:"Universities", amount:30,  color:"#F59E0B" },
  { label:"Streets",      amount:20,  color:"#60A5FA" },
  { label:"Other",        amount:40,  color:"#9B8EC4" },
];
const INITIAL_CARDS = [
  { id:1, type:"visa",       last4:"4582", holder:"Nour Ahmed", expiry:"09/28", gradient:["#5B21B6","#7C3AED"] },
  { id:2, type:"mastercard", last4:"1197", holder:"Nour Ahmed", expiry:"03/27", gradient:["#1E3A5F","#1D4ED8"] },
];

const NOISE_URL = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'
)}")`;

// ── Anchor sections ──────────────────────────────────────────────────────────
const ANCHORS = [
  { id:"wlt-sec-overview",     label:"Spending Overview" },
  { id:"wlt-sec-transactions", label:"Recent Transactions" },
  { id:"wlt-sec-analytics",    label:"Spending Analytics" },
];
const scrollTo = id =>
  document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"start" });

// ── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes wlt-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pls    { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(2.4);opacity:0} }

  .wlt-root {
    display: flex; flex-direction: column; gap: 36px;
    padding-bottom: 80px;
    animation: wlt-up .3s cubic-bezier(.22,1,.36,1) both;
  }

  /* ── GLASS PANEL ── */
  .wlt-panel {
    background: rgba(17,0,48,.75); border: 1px solid ${T.border};
    border-radius: 22px; padding: 28px 30px;
    backdrop-filter: blur(24px); position: relative; overflow: hidden;
  }
  .wlt-panel::before {
    content: ''; position: absolute; top: 0; left: 12%; right: 12%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(125,57,235,.5), transparent);
    pointer-events: none;
  }

  /* ── SECTION TITLE (outside panels) ── */
  .wlt-sh-title {
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700;
    color: ${T.text}; letter-spacing: -.5px; margin-bottom: 18px;
  }

  /* ── EYEBROW (inside panels) ── */
  .wlt-eyebrow {
    font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase; color: ${T.sub};
    display: flex; align-items: center; gap: 8px; margin-bottom: 5px;
  }
  .wlt-eyebrow::before {
    content: ''; width: 18px; height: 1px;
    background: ${T.purple}; opacity: .55; flex-shrink: 0;
  }
  .wlt-ptitle {
    font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 700;
    color: ${T.text}; letter-spacing: -.4px; margin-bottom: 22px;
  }

  /* ── ANCHOR NAV PILLS ── */
  .wlt-anchor-nav {
    display: flex; gap: 8px; overflow-x: auto;
    scrollbar-width: none; padding-bottom: 2px; flex-wrap: wrap;
  }
  .wlt-anchor-nav::-webkit-scrollbar { display: none; }
  .wlt-anchor-pill {
    padding: 7px 18px; border-radius: 100px;
    border: 1px solid rgba(125,57,235,.22); background: rgba(125,57,235,.06);
    color: ${T.sub}; font-family: inherit; font-size: 12px; font-weight: 500;
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
    transition: border-color .15s, background .15s, color .15s;
  }
  .wlt-anchor-pill:hover {
    border-color: rgba(125,57,235,.55); background: rgba(125,57,235,.13); color: ${T.text};
  }

  /* ── PAYMENT CARD ── */
  .wlt-card {
    width: 300px; min-width: 300px; height: 178px;
    border-radius: 18px; position: relative;
    overflow: hidden; cursor: pointer; flex-shrink: 0;
    box-sizing: border-box; will-change: transform;
  }

  /* Selected card: white outline, no size change */
  .wlt-card.sel {
    outline: 2px solid rgba(255,255,255,.62);
    outline-offset: 3px;
  }

  /* Default card: green outline */
  .wlt-card.default-card {
    outline: 2.5px solid rgba(34,197,94,.78);
    outline-offset: 3px;
    box-shadow: 0 0 24px rgba(34,197,94,.12), 0 8px 28px rgba(0,0,0,.35);
  }

  /* ── VIEW DETAILS BUTTON (top-left of every card) ── */
  .wlt-card-view {
    position: absolute; top: 12px; left: 14px;
    padding: 4px 10px 4px 8px; border-radius: 7px;
    background: rgba(0,0,0,.42); border: 1px solid rgba(255,255,255,.15);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; gap: 5px;
    cursor: pointer; color: rgba(255,255,255,.88);
    font-family: inherit; font-size: 11px; font-weight: 500; letter-spacing: .2px;
    transition: background .15s, border-color .15s; z-index: 3; white-space: nowrap;
  }
  .wlt-card-view:hover {
    background: rgba(0,0,0,.65); border-color: rgba(255,255,255,.3);
  }

  /* ── ADD CARD TILE ── */
  .wlt-add-tile {
    width: 300px; min-width: 300px; height: 178px; border-radius: 18px;
    border: 2px dashed rgba(125,57,235,.28); background: rgba(125,57,235,.04);
    cursor: pointer; flex-shrink: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
    transition: border-color .2s, background .2s; box-sizing: border-box;
  }
  .wlt-add-tile:hover { border-color: rgba(125,57,235,.62); background: rgba(125,57,235,.09); }

  /* ── STAT CARD ── */
  .wlt-stat {
    background: rgba(125,57,235,.05); border: 1px solid rgba(125,57,235,.15);
    border-radius: 18px; padding: 20px 22px;
    position: relative; overflow: hidden;
    transition: border-color .22s, background .22s;
  }
  .wlt-stat:hover { border-color: rgba(125,57,235,.4); background: rgba(125,57,235,.09); }
  .wlt-stat::after {
    content: ''; position: absolute; top: -44px; right: -44px;
    width: 112px; height: 112px; border-radius: 50%;
    background: radial-gradient(circle, rgba(125,57,235,.2) 0%, transparent 70%);
    pointer-events: none;
  }
  .wlt-ov-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  @media(max-width:600px) { .wlt-ov-stats { grid-template-columns: 1fr; } }

  /* ── CHART GRID ── */
  .wlt-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media(max-width:640px) { .wlt-stats-grid { grid-template-columns: 1fr; } }

  /* ── BAR CHART ── */
  .wlt-bar-area {
    height: 140px; position: relative;
    display: flex; gap: 8px; align-items: stretch; padding: 0 2px;
  }
  .wlt-bar-col { flex: 1; position: relative; cursor: default; }
  .wlt-bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    border-radius: 5px 5px 0 0;
    transition: height .8s cubic-bezier(.22,1,.36,1), filter .15s;
  }
  .wlt-bar-col:hover .wlt-bar { filter: brightness(1.3); }
  .wlt-bar-tip {
    position: absolute; bottom: calc(100% + 5px); left: 50%;
    transform: translateX(-50%);
    font-family: 'DM Mono', monospace; font-size: 10px; color: ${T.text};
    background: rgba(10,0,30,.96); border: 1px solid ${T.border};
    border-radius: 5px; padding: 2px 7px; white-space: nowrap;
    opacity: 0; transition: opacity .15s; pointer-events: none; z-index: 5;
  }
  .wlt-bar-col:hover .wlt-bar-tip { opacity: 1; }
  .wlt-grid-ln {
    position: absolute; left: 0; right: 0; height: 1px;
    background: rgba(125,57,235,.07); pointer-events: none;
  }
  .wlt-xaxis { display: flex; gap: 8px; padding: 6px 2px 0; }
  .wlt-xlabel {
    flex: 1; text-align: center;
    font-family: 'DM Mono', monospace; font-size: 10px; color: ${T.sub};
  }

  /* ── TX TABLE ── */
  .wlt-tx-head {
    display: grid; grid-template-columns: 1fr 80px 76px 84px 68px;
    gap: 8px; padding: 8px 14px;
    font-size: 10px; font-family: 'DM Mono', monospace;
    letter-spacing: 1.5px; color: ${T.sub};
    border-bottom: 1px solid ${T.border}; margin-bottom: 2px;
  }
  .wlt-tx-row {
    display: grid; grid-template-columns: 1fr 80px 76px 84px 68px;
    gap: 8px; padding: 12px 14px; align-items: center;
    border-radius: 12px; border: 1px solid transparent;
    transition: border-color .15s, background .15s; cursor: default;
  }
  .wlt-tx-row:hover { border-color: rgba(125,57,235,.2); background: rgba(125,57,235,.05); }
  @media(max-width:600px) {
    .wlt-tx-head { grid-template-columns: 1fr 80px 68px; }
    .wlt-tx-row  { grid-template-columns: 1fr 80px 68px; }
    .tx-hide     { display: none; }
  }
  .wlt-badge {
    display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 100px;
    font-size: 10px; font-weight: 500; letter-spacing: .5px;
    font-family: 'DM Mono', monospace; white-space: nowrap; backdrop-filter: blur(8px);
  }

  /* ── FILTER PILLS + SEARCH ── */
  .wlt-fpill {
    padding: 5px 14px; border-radius: 100px; border: 1px solid ${T.border};
    background: transparent; color: ${T.sub}; font-family: inherit;
    font-size: 12px; font-weight: 500; cursor: pointer;
    transition: all .15s; white-space: nowrap;
  }
  .wlt-fpill:hover { border-color: rgba(125,57,235,.4); color: ${T.text}; }
  .wlt-fpill-on { background: ${T.purple} !important; border-color: ${T.purple} !important; color: #fff !important; }
  .wlt-search {
    height: 36px; border-radius: 9px; border: 1px solid ${T.border};
    background: rgba(255,255,255,.03); color: ${T.text}; font-family: inherit;
    font-size: 13px; padding: 0 12px 0 34px; outline: none;
    box-sizing: border-box; transition: border-color .2s; flex: 1; max-width: 260px;
  }
  .wlt-search:focus { border-color: rgba(125,57,235,.5); }
  .wlt-search::placeholder { color: ${T.sub}; }

  /* ── SESSION BANNER ── */
  .wlt-session-banner {
    border-radius: 18px; padding: 18px 24px;
    background: rgba(34,197,94,.04); border: 1.5px solid rgba(34,197,94,.2);
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; transition: border-color .2s;
  }
  .wlt-session-banner:hover { border-color: rgba(34,197,94,.4); }
  .wlt-view-btn {
    padding: 8px 16px; border-radius: 9px; border: 1px solid rgba(34,197,94,.3);
    background: rgba(34,197,94,.08); color: ${T.green}; font-family: inherit;
    font-size: 12px; font-weight: 600; cursor: pointer; transition: background .2s; white-space: nowrap;
  }
  .wlt-view-btn:hover { background: rgba(34,197,94,.18); }

  /* ── CARDS STRIP ── */
  .wlt-cards-strip {
    display: flex; gap: 16px; overflow-x: auto;
    padding: 6px 6px 10px; scrollbar-width: none;
  }
  .wlt-cards-strip::-webkit-scrollbar { display: none; }

  /* ── MODAL FIELDS ── */
  .wlt-field {
    width: 100%; height: 46px; border-radius: 11px; border: 1px solid ${T.border};
    background: rgba(255,255,255,.04); color: ${T.text}; font-family: inherit;
    font-size: 14px; padding: 0 14px; outline: none; box-sizing: border-box; transition: border-color .2s;
  }
  .wlt-field:focus { border-color: ${T.purple}; }
  .wlt-label {
    font-size: 11px; color: ${T.sub}; letter-spacing: 1.2px; margin-bottom: 5px;
    font-family: 'DM Mono', monospace; text-transform: uppercase;
  }

  /* ── DETAIL MODAL ACTION BUTTONS ── */
  .wlt-detail-action {
    flex: 1; padding: 11px 14px; border-radius: 11px; font-family: inherit;
    font-size: 13px; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    gap: 7px; transition: opacity .15s;
  }
  .wlt-detail-action:hover { opacity: .75; }
`;

// ── SVG icon factory ─────────────────────────────────────────────────────────
const ic = (d, sz=14) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const IconCard    = ({s=14}) => ic(<><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>, s);
const IconTrash   = ({s=13}) => ic(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></>, s);
const IconStar    = ({s=13}) => ic(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>, s);
const IconSearch  = ({s=13}) => ic(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, s);
const IconParking = ({s=15}) => ic(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></>, s);
const IconAlert   = ({s=15}) => ic(<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, s);
const IconPin     = ({s=12}) => ic(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>, s);
const IconLayers  = ({s=14}) => ic(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>, s);
const IconTrend   = ({s=14}) => ic(<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>, s);
const IconEye     = ({s=12}) => ic(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>, s);
const IconEdit    = ({s=13}) => ic(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>, s);
const IconCheck   = ({s=13}) => ic(<polyline points="20 6 9 17 4 12"/>, s);

// ── Brand logos ──────────────────────────────────────────────────────────────
function VisaLogo() {
  return (
    <span style={{fontSize:14,fontWeight:900,fontStyle:"italic",
      color:"rgba(255,255,255,.9)",letterSpacing:-.5,fontFamily:"serif"}}>VISA</span>
  );
}
function MCLogo() {
  return (
    <div style={{display:"flex",position:"relative",width:30,height:18}}>
      <div style={{width:18,height:18,borderRadius:"50%",background:"#EB001B",opacity:.85,position:"absolute",left:0}}/>
      <div style={{width:18,height:18,borderRadius:"50%",background:"#F79E1B",opacity:.85,position:"absolute",left:12}}/>
    </div>
  );
}

// ── Mini card (detail modal) ──────────────────────────────────────────────────
function MiniCard({ card }) {
  return (
    <div style={{
      width:"100%", height:116, borderRadius:14, position:"relative", overflow:"hidden",
      background:`linear-gradient(135deg,${card.gradient[0]},${card.gradient[1]})`,
      boxShadow:"0 10px 36px rgba(0,0,0,.45)",
    }}>
      <div style={{position:"absolute",inset:0,backgroundImage:NOISE_URL,opacity:.04,pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,
        background:"linear-gradient(135deg,rgba(255,255,255,.18) 0%,transparent 40%,transparent 62%,rgba(255,255,255,.06) 100%)",
        pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:13,right:15}}>
        {card.type==="visa" ? <VisaLogo/> : <MCLogo/>}
      </div>
      <div style={{position:"absolute",bottom:32,left:15,
        fontSize:13,fontWeight:500,letterSpacing:"2px",
        color:"rgba(255,255,255,.85)",fontFamily:"'DM Mono',monospace"}}>
        •••• •••• •••• {card.last4}
      </div>
      <div style={{position:"absolute",bottom:10,left:15,right:15,
        display:"flex",justifyContent:"space-between"}}>
        <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,.9)"}}>{card.holder}</div>
        <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,.9)"}}>{card.expiry}</div>
      </div>
    </div>
  );
}

// ── Payment card with 3D tilt ─────────────────────────────────────────────────
function PayCard({ card, isSelected, isDefault, onClick, onViewDetails }) {
  const [tilt,     setTilt]     = useState({x:0,y:0});
  const [hovering, setHovering] = useState(false);

  const onMove = e => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width)  * 2 - 1;
    const ny = ((e.clientY - r.top)  / r.height) * 2 - 1;
    setTilt({ x: ny * -10, y: nx * 10 });
  };

  const cls = [
    "wlt-card",
    isDefault  ? "default-card" : "",
    isSelected && !isDefault ? "sel" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setTilt({x:0,y:0}); }}
      style={{
        background:`linear-gradient(135deg,${card.gradient[0]},${card.gradient[1]})`,
        transform:`perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: hovering
          ? "transform .1s ease, box-shadow .3s"
          : "transform .6s cubic-bezier(.22,1,.36,1), box-shadow .6s",
        boxShadow: isDefault
          ? undefined
          : hovering
            ? "0 28px 64px rgba(0,0,0,.6)"
            : "0 8px 28px rgba(0,0,0,.35)",
      }}>
      <div style={{position:"absolute",inset:0,borderRadius:"inherit",backgroundImage:NOISE_URL,opacity:.04,pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0,borderRadius:"inherit",
        background:"linear-gradient(135deg,rgba(255,255,255,.18) 0%,transparent 40%,transparent 62%,rgba(255,255,255,.06) 100%)",
        pointerEvents:"none"}}/>

      {/* Details button — top-left */}
      <button className="wlt-card-view"
        onClick={e => { e.stopPropagation(); onViewDetails(); }}>
        <IconEye s={11}/> Details
      </button>

      {/* Top-right column: Default badge (if default) + card logo */}
      <div style={{position:"absolute",top:12,right:14,display:"flex",
        flexDirection:"column",alignItems:"flex-end",gap:6,zIndex:3}}>
        {isDefault && (
          <div style={{
            background:"rgba(34,197,94,.15)",border:"1px solid rgba(34,197,94,.4)",
            borderRadius:7,padding:"3px 9px",
            fontFamily:"inherit",fontSize:10,fontWeight:600,
            color:T.green,letterSpacing:.3,backdropFilter:"blur(10px)",
            whiteSpace:"nowrap",
          }}>
            Default
          </div>
        )}
        {card.type==="visa" ? <VisaLogo/> : <MCLogo/>}
      </div>

      {/* Gold chip */}
      <div style={{position:"absolute",top:50,left:20,width:34,height:24,
        borderRadius:4,overflow:"hidden",
        background:"linear-gradient(135deg,rgba(255,220,80,.82),rgba(255,175,28,.62))",
        border:"1px solid rgba(255,255,255,.3)"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`
          repeating-linear-gradient(90deg,rgba(255,255,255,.14) 0px,rgba(255,255,255,.14) 1px,transparent 1px,transparent 5px),
          repeating-linear-gradient(0deg,rgba(255,255,255,.14) 0px,rgba(255,255,255,.14) 1px,transparent 1px,transparent 5px)`}}/>
      </div>

      {/* Card number */}
      <div style={{position:"absolute",bottom:46,left:20,
        fontSize:14,fontWeight:500,letterSpacing:"2.5px",
        color:"rgba(255,255,255,.88)",fontFamily:"'DM Mono',monospace"}}>
        •••• •••• •••• {card.last4}
      </div>

      {/* Footer */}
      <div style={{position:"absolute",bottom:14,left:20,right:20,
        display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>
          <div style={{fontSize:8,color:"rgba(255,255,255,.48)",letterSpacing:1.5,marginBottom:3,textTransform:"uppercase"}}>Card Holder</div>
          <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.9)"}}>{card.holder}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:8,color:"rgba(255,255,255,.48)",letterSpacing:1.5,marginBottom:3,textTransform:"uppercase"}}>Expires</div>
          <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.9)"}}>{card.expiry}</div>
        </div>
      </div>
    </div>
  );
}

// ── Add card tile ─────────────────────────────────────────────────────────────
function AddCardTile({ onClick }) {
  return (
    <div className="wlt-add-tile" onClick={onClick}>
      <div style={{width:48,height:48,borderRadius:"50%",
        border:"2px dashed rgba(125,57,235,.38)",
        display:"flex",alignItems:"center",justifyContent:"center",
        color:T.purple,fontSize:24,fontWeight:300,lineHeight:1}}>+</div>
      <div style={{fontSize:14,fontWeight:600,color:T.purple}}>Add Card</div>
      <div style={{fontSize:12,color:T.sub,textAlign:"center",padding:"0 20px",lineHeight:1.5}}>
        Visa or Mastercard
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub }) {
  return (
    <div className="wlt-stat">
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
        <div style={{color:T.sub,opacity:.75}}>{icon}</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.sub,letterSpacing:1.5,textTransform:"uppercase"}}>{label}</div>
      </div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color:T.text,letterSpacing:"-1.2px",lineHeight:1,marginBottom:5}}>{value}</div>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.sub}}>{sub}</div>
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...MONTHLY_SPEND.map(d => d.amount));
  useEffect(() => { const t = setTimeout(() => setVisible(true), 200); return () => clearTimeout(t); }, []);
  return (
    <div className="wlt-panel">
      <div style={{marginBottom:20}}>
        <div className="wlt-ptitle" style={{marginBottom:4}}>Monthly Spending</div>
        <div style={{fontSize:12,color:T.sub,fontWeight:300}}>Last 6 months</div>
      </div>
      <div className="wlt-bar-area">
        {[25,50,75].map(p => <div key={p} className="wlt-grid-ln" style={{bottom:`${p}%`}}/>)}
        {MONTHLY_SPEND.map((d,i) => {
          const isLast = i === MONTHLY_SPEND.length - 1;
          const pct = (d.amount / max) * 100;
          return (
            <div key={d.month} className="wlt-bar-col"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className="wlt-bar-tip">EGP {d.amount}</div>
              <div className="wlt-bar" style={{
                height: visible ? `${pct}%` : "0%",
                background: isLast
                  ? `linear-gradient(to top,${T.green},rgba(34,197,94,.5))`
                  : `linear-gradient(to top,rgba(125,57,235,.7),rgba(125,57,235,.28))`,
                transitionDelay: `${i*.08}s`,
                filter: hovered===i && !isLast ? "brightness(1.3)" : undefined,
              }}/>
            </div>
          );
        })}
      </div>
      <div className="wlt-xaxis">
        {MONTHLY_SPEND.map(d => <div key={d.month} className="wlt-xlabel">{d.month}</div>)}
      </div>
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart() {
  const [visible, setVisible] = useState(false);
  const r = 60; const cx = 80; const cy = 80;
  const circ = 2 * Math.PI * r; const gap = 3;
  const total = DONUT_DATA.reduce((s,d) => s + d.amount, 0);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 280); return () => clearTimeout(t); }, []);
  let cumAngle = -90;
  const segs = DONUT_DATA.filter(d => d.amount > 0).map(d => {
    const frac = d.amount / total;
    const len  = circ * frac - gap;
    const seg  = { ...d, len, startAngle: cumAngle };
    cumAngle += frac * 360;
    return seg;
  });
  return (
    <div className="wlt-panel">
      <div style={{marginBottom:20}}>
        <div className="wlt-ptitle" style={{marginBottom:4}}>Spend by Location</div>
        <div style={{fontSize:12,color:T.sub,fontWeight:300}}>Current month</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:18}}>
        <div style={{flexShrink:0}}>
          <svg viewBox="0 0 160 160" width={138} height={138}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(125,57,235,.08)" strokeWidth={18}/>
            {segs.map((seg,i) => (
              <circle key={seg.label} cx={cx} cy={cy} r={r} fill="none"
                stroke={seg.color} strokeWidth={18} strokeLinecap="round"
                strokeDasharray={`${visible ? seg.len : 0} ${circ}`}
                style={{transform:`rotate(${seg.startAngle}deg)`,transformOrigin:`${cx}px ${cy}px`,
                  transition:`stroke-dasharray .85s cubic-bezier(.22,1,.36,1) ${i*.1}s`}}/>
            ))}
            <text x={cx} y={cy-6} textAnchor="middle" fill={T.text} fontSize="18" fontFamily="Syne,sans-serif" fontWeight="800" letterSpacing="-1">{total}</text>
            <text x={cx} y={cy+10} textAnchor="middle" fill={T.sub} fontSize="8" fontFamily="DM Mono,monospace" letterSpacing="1">EGP</text>
          </svg>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
          {DONUT_DATA.map(d => (
            <div key={d.label} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0}}/>
              <div style={{fontSize:12,color:T.sub,flex:1}}>{d.label}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.text,fontWeight:500}}>{d.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────
function TxRow({ t }) {
  const ok = !t.failed;
  return (
    <div className="wlt-tx-row">
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        <div style={{width:32,height:32,borderRadius:9,flexShrink:0,
          background:ok?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",
          display:"flex",alignItems:"center",justifyContent:"center",color:ok?T.green:T.red}}>
          {ok ? <IconParking/> : <IconAlert/>}
        </div>
        <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
      </div>
      <div className="tx-hide" style={{fontSize:12,color:T.sub}}>{t.date}</div>
      <div className="tx-hide" style={{fontSize:12,color:T.sub}}>{t.duration}</div>
      <div style={{fontSize:13,fontWeight:700,color:ok?T.text:T.red}}>{t.cost}</div>
      <div>
        <span className="wlt-badge" style={{
          background:ok?"rgba(34,197,94,.12)":"rgba(239,68,68,.12)",
          color:ok?T.green:T.red,
          border:`1px solid ${ok?"rgba(34,197,94,.25)":"rgba(239,68,68,.25)"}`,
        }}>{t.status}</span>
      </div>
    </div>
  );
}

// ── Card detail + edit modal ──────────────────────────────────────────────────
function CardDetailModal({ open, onClose, card, isDefault, onSetDefault, onRemove, onUpdate }) {
  const [editing,  setEditing]  = useState(false);
  const [editName, setEditName] = useState("");
  const [editExp,  setEditExp]  = useState("");
  const [editNum,  setEditNum]  = useState("");

  useEffect(() => {
    if (open && card) {
      setEditing(false);
      setEditName(card.holder);
      setEditExp(card.expiry);
      setEditNum(`**** **** **** ${card.last4}`);
    }
  }, [open, card]);

  if (!card) return null;

  const fmtExp = v => v.replace(/\D/g,"").slice(0,4).replace(/^(\d{2})(\d)/,"$1/$2");
  const fmtNum = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();

  const handleSave = () => {
    const rawNum   = editNum.replace(/\s/g,"");
    const newLast4 = rawNum.length >= 4 ? rawNum.slice(-4) : card.last4;
    const newType  = rawNum.length >= 1
      ? (rawNum[0]==="4" ? "visa" : "mastercard")
      : card.type;
    onUpdate({
      ...card,
      holder:   editName.trim() || card.holder,
      expiry:   editExp  || card.expiry,
      last4:    newLast4,
      type:     newType,
      gradient: newType==="visa" ? ["#5B21B6","#7C3AED"] : ["#1E3A5F","#1D4ED8"],
    });
    setEditing(false);
    onClose();
  };

  const previewCard = editing
    ? { ...card, holder: editName||card.holder, expiry: editExp||card.expiry,
        last4: editNum.replace(/\s/g,"").slice(-4) || card.last4 }
    : card;

  return (
    <Modal open={open} onClose={() => { setEditing(false); onClose(); }} maxWidth={420}>
      <div style={{padding:"26px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.sub,
              letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>
              {editing ? "Edit Card" : "Card Details"}
            </div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,
              letterSpacing:"-.5px",color:T.text}}>
              {card.type==="visa"?"Visa":"Mastercard"} ···· {card.last4}
            </div>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{
              padding:"7px 14px", borderRadius:9,
              border:"1px solid rgba(125,57,235,.3)",
              background:"rgba(125,57,235,.08)",
              color:T.purple, fontFamily:"inherit", fontSize:12, fontWeight:600,
              cursor:"pointer", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
            }}>
              <IconEdit s={12}/> Edit Card
            </button>
          )}
        </div>

        <div style={{marginBottom:20}}>
          <MiniCard card={previewCard}/>
        </div>

        {editing ? (
          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
            <div>
              <div className="wlt-label">Card Number</div>
              <input className="wlt-field" value={editNum}
                onChange={e => setEditNum(fmtNum(e.target.value))}
                placeholder="**** **** **** ****" maxLength={19}/>
            </div>
            <div>
              <div className="wlt-label">Cardholder Name</div>
              <input className="wlt-field" value={editName}
                onChange={e => setEditName(e.target.value)} placeholder="Full name on card"/>
            </div>
            <div>
              <div className="wlt-label">Expiry Date</div>
              <input className="wlt-field" value={editExp}
                onChange={e => setEditExp(fmtExp(e.target.value))}
                placeholder="MM/YY" maxLength={5}/>
            </div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button onClick={() => setEditing(false)} style={{
                flex:1, padding:11, borderRadius:11, border:`1px solid ${T.border}`,
                background:"transparent", color:T.sub, fontFamily:"inherit",
                fontSize:13, fontWeight:600, cursor:"pointer"}}>Cancel</button>
              <button onClick={handleSave} style={{
                flex:2, padding:11, borderRadius:11,
                border:"1px solid rgba(125,57,235,.4)",
                background:"linear-gradient(135deg,rgba(125,57,235,.3),rgba(125,57,235,.18))",
                color:T.text, fontFamily:"inherit", fontSize:13, fontWeight:700,
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              }}>
                <IconCheck s={13}/> Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {[
                ["Card Holder", card.holder],
                ["Expires",     card.expiry],
                ["Card Type",   card.type==="visa"?"Visa":"Mastercard"],
                ["Number",      `···· ···· ···· ${card.last4}`],
              ].map(([lbl,val]) => (
                <div key={lbl} style={{background:"rgba(125,57,235,.05)",
                  border:"1px solid rgba(125,57,235,.12)",borderRadius:12,padding:"11px 13px"}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.sub,
                    letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{lbl}</div>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <button className="wlt-detail-action"
                onClick={() => { onSetDefault(); onClose(); }}
                style={{border:"1px solid rgba(125,57,235,.28)",
                  background:isDefault?"rgba(125,57,235,.18)":"rgba(125,57,235,.07)",color:T.purple}}>
                <IconStar s={13}/> {isDefault?"Default Card":"Set Default"}
              </button>
              <button className="wlt-detail-action"
                onClick={() => { onRemove(); onClose(); }}
                style={{border:"1px solid rgba(239,68,68,.22)",background:"rgba(239,68,68,.07)",color:T.red}}>
                <IconTrash s={13}/> Remove
              </button>
            </div>
            <button onClick={onClose} style={{
              width:"100%", padding:11, borderRadius:11, border:`1px solid ${T.border}`,
              background:"transparent", color:T.sub, fontFamily:"inherit",
              fontSize:13, fontWeight:600, cursor:"pointer"}}>Close</button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Add card modal ────────────────────────────────────────────────────────────
function AddCardModal({ open, onClose, onAdd }) {
  const [num,  setNum]  = useState("");
  const [name, setName] = useState("");
  const [exp,  setExp]  = useState("");
  const [cvv,  setCvv]  = useState("");

  const fmtNum = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp = v => v.replace(/\D/g,"").slice(0,4).replace(/^(\d{2})(\d)/,"$1/$2");

  const handleAdd = () => {
    if (!num || !name || !exp || !cvv) return;
    const type = num.replace(/\s/g,"")[0]==="4" ? "visa" : "mastercard";
    onAdd({ type, last4:num.replace(/\s/g,"").slice(-4), holder:name, expiry:exp,
      gradient:type==="visa"?["#5B21B6","#7C3AED"]:["#1E3A5F","#1D4ED8"] });
    setNum(""); setName(""); setExp(""); setCvv("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <div style={{padding:"26px 22px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(125,57,235,.12)",
            display:"flex",alignItems:"center",justifyContent:"center",color:T.purple}}>
            <IconCard s={22}/>
          </div>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,letterSpacing:"-.5px"}}>Add New Card</div>
            <div style={{fontSize:12,color:T.sub}}>Your details are encrypted &amp; secure</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <div className="wlt-label">Card Number</div>
            <input className="wlt-field" value={num}
              onChange={e=>setNum(fmtNum(e.target.value))} placeholder="1234  5678  9012  3456" maxLength={19}/>
          </div>
          <div>
            <div className="wlt-label">Cardholder Name</div>
            <input className="wlt-field" value={name}
              onChange={e=>setName(e.target.value)} placeholder="Full name on card"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <div className="wlt-label">Expiry</div>
              <input className="wlt-field" value={exp}
                onChange={e=>setExp(fmtExp(e.target.value))} placeholder="MM/YY" maxLength={5}/>
            </div>
            <div>
              <div className="wlt-label">CVV</div>
              <input className="wlt-field" value={cvv}
                onChange={e=>setCvv(e.target.value.replace(/\D/g,"").slice(0,4))}
                placeholder="•••" maxLength={4} type="password"/>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:22}}>
          <button onClick={onClose} style={{flex:1,padding:12,borderRadius:11,
            border:`1px solid ${T.border}`,background:"transparent",color:T.sub,
            fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <div style={{flex:2}}><GlowBtn full noArrow onClick={handleAdd}>Add Card</GlowBtn></div>
        </div>
      </div>
    </Modal>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WalletTab({ activeSpot, onGoToSession }) {
  const [cards,          setCards]         = useState(INITIAL_CARDS);
  const [defaultCardId,  setDefaultCardId] = useState(1);   // payment default
  const [selectedCardId, setSelectedCardId] = useState(null); // ui selection
  const [addOpen,        setAddOpen]       = useState(false);
  const [detailOpen,     setDetailOpen]    = useState(false);
  const [detailCard,     setDetailCard]    = useState(null);
  const [txFilter,       setTxFilter]      = useState("all");
  const [txSearch,       setTxSearch]      = useState("");

  const { w } = useBreakpoint();
  const isMobile = w < 640;

  const paid       = TRANSACTIONS.filter(t => !t.failed);
  const totalSpent = paid.reduce((s,t) => s + (parseFloat(t.cost.replace(/[^0-9.]/g,"")) || 0), 0);
  const avgCost    = paid.length ? Math.round(totalSpent / paid.length) : 0;

  const filteredTx = TRANSACTIONS.filter(t => {
    if (txFilter==="paid"   && t.failed)  return false;
    if (txFilter==="failed" && !t.failed) return false;
    if (txSearch && !t.name.toLowerCase().includes(txSearch.toLowerCase())) return false;
    return true;
  });

  const openDetail = card => {
    setDetailCard(card);
    setSelectedCardId(card.id);
    setDetailOpen(true);
  };

  const handleCardClick = card => {
    if (selectedCardId === card.id) {
      openDetail(card); // second click → open details
    } else {
      setSelectedCardId(card.id);
    }
  };

  const handleSetDefault = () => detailCard && setDefaultCardId(detailCard.id);
  const handleRemoveCard = () => {
    if (!detailCard) return;
    setCards(p => {
      const next = p.filter(c => c.id !== detailCard.id);
      if (defaultCardId === detailCard.id && next.length) setDefaultCardId(next[0].id);
      if (selectedCardId === detailCard.id) setSelectedCardId(null);
      return next;
    });
  };
  const handleUpdateCard = updated => {
    setCards(p => p.map(c => c.id===updated.id ? updated : c));
    setDetailCard(updated);
  };

  return (
    <div style={{padding: isMobile ? "0 16px 64px" : "0 40px 80px"}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      <div className="wlt-root">

        {/* ── PAGE TITLE + ANCHOR NAV ──────────────────────────────── */}
        <div style={{paddingTop:32}}>
          
          <div style={{fontFamily:"'Syne',sans-serif",
            fontSize:"clamp(26px,3.5vw,36px)",fontWeight:800,
            color:T.text,letterSpacing:"-1.5px",lineHeight:1.05,marginBottom:20}}>
            Your Wallet
          </div>
          <div className="wlt-anchor-nav">
            {ANCHORS.map(a => (
              <button key={a.id} className="wlt-anchor-pill" onClick={() => scrollTo(a.id)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ACTIVE SESSION BANNER ─────────────────────────────────── */}
        {activeSpot && (
          <div className="wlt-session-banner">
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{position:"relative",width:8,height:8,flexShrink:0}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:T.green}}/>
                <div style={{position:"absolute",inset:0,borderRadius:"50%",background:T.green,animation:"pls 1.5s infinite"}}/>
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{activeSpot.name}</div>
                <div style={{fontSize:12,color:T.sub,display:"flex",alignItems:"center",gap:5}}>
                  <IconPin s={11}/> Level 2 – B4
                </div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:20}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.sub,letterSpacing:1.2,textTransform:"uppercase",marginBottom:3}}>Est. Cost</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:T.green,letterSpacing:"-1px",lineHeight:1}}>EGP 50</div>
                <div style={{fontSize:11,color:T.sub,marginTop:2}}>~2h 10m</div>
              </div>
              <button className="wlt-view-btn" onClick={onGoToSession}>View Session →</button>
            </div>
          </div>
        )}

        {/* ── PAYMENT CARDS ─────────────────────────────────────────── */}
        <div>
          <div className="wlt-sh-title">Payment Cards</div>
          <div className="wlt-cards-strip">
            {cards.map(c => (
              <PayCard key={c.id} card={c}
                isDefault={defaultCardId===c.id}
                isSelected={selectedCardId===c.id}
                onClick={() => handleCardClick(c)}
                onViewDetails={() => openDetail(c)}/>
            ))}
            <AddCardTile onClick={() => setAddOpen(true)}/>
          </div>
        </div>

        {/* ── SPENDING OVERVIEW ─────────────────────────────────────── */}
        <div id="wlt-sec-overview">
          <div className="wlt-sh-title">Spending Overview</div>
          <div className="wlt-ov-stats">
            <StatCard icon={<IconCard s={14}/>} label="Spent This Month"
              value={`EGP ${totalSpent}`}
              sub={`${paid.length} paid · ${TRANSACTIONS.length - paid.length} failed`}/>
            <StatCard icon={<IconLayers s={14}/>} label="Total Sessions"
              value={paid.length} sub="completed sessions"/>
            <StatCard icon={<IconTrend s={14}/>} label="Avg. Session Cost"
              value={`EGP ${avgCost}`} sub="per paid session"/>
          </div>
        </div>

        {/* ── RECENT TRANSACTIONS — title OUTSIDE panel ─────────────── */}
        <div id="wlt-sec-transactions">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div className="wlt-sh-title" style={{marginBottom:0}}>Recent Transactions</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.sub,letterSpacing:1,textTransform:"uppercase"}}>
              {filteredTx.length} result{filteredTx.length!==1?"s":""}
            </div>
          </div>
          <div className="wlt-panel">
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:18}}>
              {[["all","All"],["paid","Paid"],["failed","Failed"]].map(([id,lbl]) => (
                <button key={id}
                  className={`wlt-fpill${txFilter===id?" wlt-fpill-on":""}`}
                  onClick={() => setTxFilter(id)}>{lbl}</button>
              ))}
              <div style={{position:"relative",marginLeft:"auto"}}>
                <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.sub,pointerEvents:"none"}}>
                  <IconSearch s={13}/>
                </div>
                <input className="wlt-search" value={txSearch}
                  onChange={e => setTxSearch(e.target.value)} placeholder="Search locations..."/>
              </div>
            </div>
            <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(125,57,235,.18),transparent)",marginBottom:8}}/>
            <div className="wlt-tx-head">
              <span>Location</span><span className="tx-hide">Date</span>
              <span className="tx-hide">Duration</span><span>Amount</span><span>Status</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:2}}>
              {filteredTx.length > 0
                ? filteredTx.map(t => <TxRow key={t.id} t={t}/>)
                : <div style={{padding:"32px 14px",textAlign:"center",color:T.sub,fontSize:13}}>No transactions match your filters</div>
              }
            </div>
          </div>
        </div>

        {/* ── SPENDING ANALYTICS ────────────────────────────────────── */}
        <div id="wlt-sec-analytics">
          <div className="wlt-sh-title">Spending Analytics</div>
          <div className="wlt-stats-grid">
            <BarChart/>
            <DonutChart/>
          </div>
        </div>

      </div>

      <AddCardModal open={addOpen} onClose={() => setAddOpen(false)}
        onAdd={c => setCards(p => [...p, {...c, id:Date.now()}])}/>

      <CardDetailModal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailCard(null); }}
        card={detailCard}
        isDefault={detailCard?.id === defaultCardId}
        onSetDefault={handleSetDefault}
        onRemove={handleRemoveCard}
        onUpdate={handleUpdateCard}/>
    </div>
  );
}
