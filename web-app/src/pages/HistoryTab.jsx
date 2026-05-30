import React, { useState, useEffect } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import apiFetch from "../api/client";
import GlowBtn from "../components/ui/GlowBtn";
import Modal from "../components/ui/Modal";

const SC = {
  completed: { color:T.green, bg:"rgba(34,197,94,.1)",  border:"rgba(34,197,94,.22)",  label:"Completed" },
  cancelled: { color:T.red,   bg:"rgba(239,68,68,.1)",  border:"rgba(239,68,68,.22)",  label:"Cancelled"  },
};

// ── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes ht-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

  .ht-wrap {
    animation: ht-up .3s cubic-bezier(.22,1,.36,1) both;
    display: flex; flex-direction: column; gap: 32px; padding-bottom: 80px;
  }

  /* ── GLASS PANEL ── */
  .ht-panel {
    background: rgba(17,0,48,.75); border: 1px solid ${T.border};
    border-radius: 22px; padding: 28px 30px;
    backdrop-filter: blur(24px); position: relative; overflow: hidden;
  }
  .ht-panel::before {
    content: ''; position: absolute; top: 0; left: 12%; right: 12%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(125,57,235,.5), transparent);
    pointer-events: none;
  }

  /* ── STAT CARD ── */
  .ht-stat {
    background: rgba(125,57,235,.05); border: 1px solid rgba(125,57,235,.15);
    border-radius: 18px; padding: 22px 24px;
    position: relative; overflow: hidden;
    transition: border-color .22s, background .22s;
  }
  .ht-stat:hover { border-color: rgba(125,57,235,.4); background: rgba(125,57,235,.09); }
  .ht-stat::after {
    content: ''; position: absolute; top: -44px; right: -44px;
    width: 112px; height: 112px; border-radius: 50%;
    background: radial-gradient(circle, rgba(125,57,235,.2) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── FILTER PILLS ── */
  .ht-pill {
    padding: 6px 16px; border-radius: 100px; border: 1px solid ${T.border};
    background: transparent; color: ${T.sub}; font-family: inherit;
    font-size: 12px; font-weight: 500; cursor: pointer;
    transition: all .15s; white-space: nowrap; display: flex; align-items: center; gap: 6px;
  }
  .ht-pill:hover { border-color: rgba(125,57,235,.4); color: ${T.text}; }
  .ht-pill-on { background: ${T.purple} !important; border-color: ${T.purple} !important; color: #fff !important; }
  .ht-pill-count {
    padding: 1px 7px; border-radius: 100px; font-size: 10px; font-weight: 600;
    background: rgba(255,255,255,.12); font-family: 'DM Mono', monospace;
  }

  /* ── TABLE ── */
  .ht-tx-head {
    display: grid;
    grid-template-columns: 2fr 130px 110px 130px 110px 120px;
    gap: 12px; padding: 10px 18px;
    font-size: 10px; font-family: 'DM Mono', monospace;
    letter-spacing: 1.5px; color: ${T.sub}; text-transform: uppercase;
    border-bottom: 1px solid ${T.border}; margin-bottom: 4px;
  }
  .ht-tx-row {
    display: grid;
    grid-template-columns: 2fr 130px 110px 130px 110px 120px;
    gap: 12px; padding: 14px 18px; align-items: center;
    border-radius: 14px; border: 1px solid transparent;
    transition: border-color .15s, background .15s; cursor: default;
  }
  .ht-tx-row:hover { border-color: rgba(125,57,235,.18); background: rgba(125,57,235,.04); }

  /* Mobile: collapse to card */
  @media(max-width:700px) {
    .ht-tx-head { display: none; }
    .ht-tx-row {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto auto;
      gap: 10px; padding: 16px;
      background: rgba(125,57,235,.03);
      border-color: ${T.border};
    }
    .ht-loc-col  { grid-column: 1 / -1; }
    .ht-tx-row:hover { border-color: rgba(125,57,235,.3); background: rgba(125,57,235,.07); }
  }

  /* ── SECTION TITLE ── */
  .ht-sh-title {
    font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700;
    color: ${T.text}; letter-spacing: -.5px; margin-bottom: 18px;
  }
`;

// ── SVG icons ─────────────────────────────────────────────────────────────────
const ic = (d, sz=14) => (
  <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IconParking  = ({s=16}) => ic(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></>, s);
const IconPin      = ({s=13}) => ic(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>, s);
const IconCalendar = ({s=13}) => ic(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, s);
const IconClock    = ({s=13}) => ic(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, s);
const IconWallet   = ({s=13}) => ic(<><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></>, s);
const IconCheck    = ({s=13}) => ic(<polyline points="20 6 9 17 4 12"/>, s);
const IconX        = ({s=13}) => ic(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, s);
const IconLayers   = ({s=14}) => ic(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>, s);
const IconReceipt  = ({s=14}) => ic(<><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></>, s);

// ── Data mapper ───────────────────────────────────────────────────────────────
function mapReservation(r) {
  const entered = r.enteredAt ? new Date(r.enteredAt) : null;
  const exited  = r.exitedAt  ? new Date(r.exitedAt)  : null;

  let durationStr = "–";
  let costStr = r.status === "CANCELLED" || r.status === "EXPIRED" ? "No charge" : "–";

  if (entered && exited) {
    const mins = Math.round((exited - entered) / 60_000);
    const h = Math.floor(mins / 60), m = mins % 60;
    durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
    if (r.hourlyRate && Number(r.hourlyRate) > 0) {
      costStr = `EGP ${((mins / 60) * Number(r.hourlyRate)).toFixed(2)}`;
    } else {
      costStr = "Free";
    }
  }

  return {
    id: r.id,
    name:        r.parkingLotName || "Parking Lot",
    address:     r.gateName       || "–",
    date:        new Date(r.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }),
    duration:    durationStr,
    cost:        costStr,
    status:      r.status === "COMPLETED" ? "completed" : "cancelled",
    plateNumber: r.plateNumber || "–",
    spotCode:    r.spotCode    || "–",
  };
}

// ── Receipt modal ─────────────────────────────────────────────────────────────
function ReceiptModal({ item, onClose }) {
  if (!item) return null;
  const sc = SC[item.status];
  const ok = item.status === "completed";

  const rows = [
    ["Location", item.name],
    ["Gate",     item.address],
    ["Date",     item.date],
    ["Duration", item.duration],
    ["Plate",    item.plateNumber],
    ["Slot",     item.spotCode],
  ];

  return (
    <Modal open={!!item} onClose={onClose} maxWidth={440}>
      <div style={{padding:"26px 22px"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
          <div style={{width:46,height:46,borderRadius:13,
            background:"rgba(125,57,235,.12)",
            display:"flex",alignItems:"center",justifyContent:"center",color:T.purple}}>
            <IconReceipt s={22}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,letterSpacing:"-.5px"}}>Receipt</div>
            <div style={{fontSize:12,color:T.sub}}>{item.name}</div>
          </div>
          <span style={{padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:600,
            background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,
            fontFamily:"'DM Mono',monospace",letterSpacing:.5}}>
            {sc.label}
          </span>
        </div>

        {/* Info rows */}
        <div style={{borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:16}}>
          {rows.map(([l, v], i) => (
            <div key={l}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",gap:16}}>
                <span style={{fontSize:12,color:T.sub,flexShrink:0,fontFamily:"'DM Mono',monospace",letterSpacing:.5,textTransform:"uppercase",fontSize:10}}>{l}</span>
                <span style={{fontSize:13,fontWeight:600,textAlign:"right"}}>{v}</span>
              </div>
              {i < rows.length - 1 && <div style={{height:1,background:`${T.border}`,margin:"0 16px"}}/>}
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"16px",borderRadius:14,marginBottom:18,
          background: ok ? "rgba(34,197,94,.06)" : "rgba(239,68,68,.06)",
          border: `1px solid ${ok ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.2)"}`,
        }}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.sub,letterSpacing:1.5,textTransform:"uppercase"}}>Total Charged</span>
          <span style={{
            fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,letterSpacing:"-1px",
            color: ok ? T.green : T.red,
            textDecoration: ok ? "none" : "line-through",
          }}>{item.cost}</span>
        </div>

        <GlowBtn full noArrow>Download PDF</GlowBtn>
      </div>
    </Modal>
  );
}

// ── Session row ───────────────────────────────────────────────────────────────
function SessionRow({ item, onReceipt }) {
  const sc = SC[item.status];
  const ok = item.status === "completed";

  return (
    <div className="ht-tx-row">
      {/* Location */}
      <div className="ht-loc-col" style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
        <div style={{
          width:42,height:42,borderRadius:13,flexShrink:0,
          background:"rgba(125,57,235,.1)",border:"1px solid rgba(125,57,235,.2)",
          display:"flex",alignItems:"center",justifyContent:"center",color:T.purple,
        }}>
          <IconParking s={18}/>
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:T.text,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>
            {item.name}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4,
            fontSize:11,color:T.sub,fontFamily:"'DM Mono',monospace"}}>
            <IconPin s={10}/> {item.address}
          </div>
        </div>
      </div>

      {/* Date */}
      <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.sub}}>
        <IconCalendar s={12}/> {item.date}
      </div>

      {/* Duration */}
      <div style={{display:"flex",alignItems:"center",gap:6,
        fontSize:12,color:T.sub,fontFamily:"'DM Mono',monospace"}}>
        <IconClock s={12}/> {item.duration}
      </div>

      {/* Cost */}
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <IconWallet s={12} style={{color:ok?T.green:T.sub}}/>
        <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,
          color:ok?T.green:T.sub,letterSpacing:"-.5px"}}>
          {item.cost}
        </span>
      </div>

      {/* Status */}
      <div>
        <span style={{
          display:"inline-flex",alignItems:"center",gap:5,
          padding:"4px 10px",borderRadius:100,fontSize:10,fontWeight:600,
          background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,
          fontFamily:"'DM Mono',monospace",letterSpacing:.5,whiteSpace:"nowrap",
        }}>
          {ok ? <IconCheck s={10}/> : <IconX s={10}/>} {sc.label}
        </span>
      </div>

      {/* Receipt button */}
      <div>
        <button onClick={() => onReceipt(item)} style={{
          display:"flex",alignItems:"center",gap:6,
          padding:"7px 14px",borderRadius:9,
          border:"1px solid rgba(125,57,235,.28)",
          background:"rgba(125,57,235,.07)",color:T.purple,
          fontFamily:"inherit",fontSize:12,fontWeight:600,
          cursor:"pointer",transition:"background .15s",whiteSpace:"nowrap",
        }}
          onMouseEnter={e => e.currentTarget.style.background="rgba(125,57,235,.16)"}
          onMouseLeave={e => e.currentTarget.style.background="rgba(125,57,235,.07)"}
        >
          <IconReceipt s={12}/> Receipt
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HistoryTab() {
  const [filter,  setFilter]  = useState("All");
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { w } = useBreakpoint();
  const isMobile = w < 640;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/api/reservations/history");
        const terminal = (data || []).filter(r =>
          r.status === "COMPLETED" || r.status === "CANCELLED" || r.status === "EXPIRED"
        );
        setHistory(terminal.map(mapReservation));
      } catch (e) {
        console.error("Failed to load history", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filters = ["All", "Completed", "Cancelled"];
  const shown = filter === "All"
    ? history
    : history.filter(h => h.status === filter.toLowerCase());

  const completed = history.filter(h => h.status === "completed");
  const totalEGP  = completed.reduce((a, h) => {
    const m = h.cost.match(/[\d.]+/);
    return a + (m ? parseFloat(m[0]) : 0);
  }, 0);
  const totalMins = history.reduce((a, h) => {
    const parts = h.duration.match(/(\d+)h\s*(\d+)?m?/);
    return a + (parts ? (+parts[1]) * 60 + (+parts[2] || 0) : 0);
  }, 0);
  const hrs = Math.floor(totalMins / 60), mins = totalMins % 60;

  return (
    <div style={{padding: isMobile ? "0 16px 64px" : "0 40px 80px"}}>
      <style dangerouslySetInnerHTML={{__html: CSS}}/>

      <div className="ht-wrap">

        {/* ── PAGE TITLE ── */}
        <div style={{paddingTop:32}}>
          
          <div style={{fontFamily:"'Syne',sans-serif",
            fontSize:"clamp(26px,3.5vw,36px)",fontWeight:800,
            color:T.text,letterSpacing:"-1.5px",lineHeight:1.05}}>
            Parking History
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {[
            { icon:<IconCheck s={14}/>, label:"Completed Sessions", value:completed.length,            color:T.green  },
            { icon:<IconWallet s={14}/>,label:"Total Spent",         value:`EGP ${totalEGP.toFixed(0)}`,color:T.purple },
            { icon:<IconClock s={14}/>, label:"Hours Parked",        value:`${hrs}h ${mins}m`,          color:"#38BDF8" },
          ].map(s => (
            <div key={s.label} className="ht-stat">
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
                <div style={{color:T.sub,opacity:.75}}>{s.icon}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.sub,
                  letterSpacing:1.5,textTransform:"uppercase"}}>{s.label}</div>
              </div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,
                color:s.color,letterSpacing:"-1.2px",lineHeight:1}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── SESSIONS TABLE — title + panel ── */}
        <div>
          {/* Header row: title + filter pills */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
            flexWrap:"wrap",gap:12,marginBottom:18}}>
            <div className="ht-sh-title" style={{marginBottom:0}}>
              {loading ? "Loading…" : `${shown.length} Session${shown.length!==1?"s":""}`}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {filters.map(f => {
                const count = f === "All" ? history.length
                  : history.filter(h => h.status === f.toLowerCase()).length;
                return (
                  <button key={f}
                    className={`ht-pill${filter===f?" ht-pill-on":""}`}
                    onClick={() => setFilter(f)}>
                    {f}
                    <span className="ht-pill-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ht-panel">
            {loading ? (
              <div style={{textAlign:"center",padding:"60px 0",color:T.sub}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,letterSpacing:2,
                  textTransform:"uppercase",marginBottom:8}}>Loading</div>
                <div style={{fontSize:13}}>Fetching your history…</div>
              </div>
            ) : shown.length === 0 ? (
              <div style={{textAlign:"center",padding:"60px 0",color:T.sub}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,
                  color:T.text,marginBottom:8}}>
                  No {filter.toLowerCase()} sessions
                </div>
                <div style={{fontSize:13}}>Your parking history will appear here.</div>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="ht-tx-head">
                  <span>Location</span>
                  <span>Date</span>
                  <span>Duration</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>

                {/* Rows */}
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  {shown.map(item => (
                    <SessionRow key={item.id} item={item} onReceipt={setReceipt}/>
                  ))}
                </div>

                {/* Footer */}
                <div style={{
                  marginTop:16,paddingTop:16,borderTop:`1px solid ${T.border}`,
                  display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,
                }}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.sub}}>
                    Showing {shown.length} of {history.length} sessions
                  </div>
                  {completed.length > 0 && (
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,
                      color:T.text,letterSpacing:"-.3px"}}>
                      Total paid: <span style={{color:T.green}}>EGP {totalEGP.toFixed(0)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      <ReceiptModal item={receipt} onClose={() => setReceipt(null)}/>
    </div>
  );
}
