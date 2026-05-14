import React, { useState, useEffect } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import apiFetch from "../api/client";
import GlowBtn from "../components/ui/GlowBtn";
import Modal from "../components/ui/Modal";

const SC = {
  completed: { color:T.green, bg:"rgba(34,197,94,.1)",  border:"rgba(34,197,94,.22)",  icon:"✓", label:"Completed" },
  cancelled: { color:T.red,   bg:"rgba(239,68,68,.1)",  border:"rgba(239,68,68,.22)",  icon:"✕", label:"Cancelled"  },
};

const CSS = `
  .ht-wrap { animation:ht-up .32s cubic-bezier(.22,1,.36,1); }
  @keyframes ht-up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

  .ht-row {
    border-radius:16px; border:1.5px solid rgba(125,57,235,.18);
    background:rgba(17,0,48,.55); overflow:hidden;
    transition:border-color .22s, box-shadow .22s;
  }
  .ht-row:hover { border-color:rgba(125,57,235,.42); box-shadow:0 6px 28px rgba(125,57,235,.12); }

  .ht-pill {
    padding:7px 18px; border-radius:999px; border:1.5px solid;
    font-size:13px; font-weight:600; cursor:pointer;
    font-family:'Sora',sans-serif; transition:all .2s; white-space:nowrap;
  }
  .ht-stat {
    border-radius:14px; padding:16px; text-align:center;
    background:rgba(17,0,48,.6); border:1.5px solid rgba(125,57,235,.16);
  }
`;

// Map a backend ReservationResponse to the display shape this component uses.
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

  const displayStatus =
    r.status === "COMPLETED" ? "completed" : "cancelled";

  return {
    id: r.id,
    name:     r.parkingLotName || "Parking Lot",
    address:  r.gateName        || "–",
    date:     new Date(r.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }),
    duration: durationStr,
    cost:     costStr,
    status:   displayStatus,
    plateNumber: r.plateNumber || "–",
    spotCode:    r.spotCode    || "–",
  };
}

function ReceiptModal({ item, onClose }) {
  if (!item) return null;
  const sc = SC[item.status];

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
      <div style={{ padding:"26px 22px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:22 }}>
          <div style={{ width:46,height:46,borderRadius:13,background:"rgba(125,57,235,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>🧾</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18,fontWeight:800 }}>Receipt</div>
            <div style={{ fontSize:12,color:T.sub }}>{item.name}</div>
          </div>
          <span style={{ padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:700,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}` }}>
            {sc.icon} {sc.label}
          </span>
        </div>

        <div style={{ borderRadius:12,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:16 }}>
          {rows.map(([l, v], i) => (
            <div key={l}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 15px",gap:16 }}>
                <span style={{ fontSize:13,color:T.sub,flexShrink:0 }}>{l}</span>
                <span style={{ fontSize:13,fontWeight:600,textAlign:"right" }}>{v}</span>
              </div>
              {i < rows.length - 1 && <div style={{ height:1,background:"rgba(125,57,235,.1)",margin:"0 15px" }} />}
            </div>
          ))}
        </div>

        <div style={{
          display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"14px 15px",borderRadius:12,marginBottom:18,
          background: item.status==="cancelled" ? "rgba(239,68,68,.06)" : "rgba(34,197,94,.06)",
          border: `1px solid ${item.status==="cancelled" ? "rgba(239,68,68,.2)" : "rgba(34,197,94,.2)"}`,
        }}>
          <span style={{ fontSize:15,fontWeight:700 }}>Total Charged</span>
          <span style={{
            fontSize:20,fontWeight:800,
            color: item.status==="cancelled" ? T.red : T.green,
            textDecoration: item.status==="cancelled" ? "line-through" : "none",
            textDecorationColor: T.red,
          }}>{item.cost}</span>
        </div>

        <GlowBtn full noArrow>⬇ Download PDF</GlowBtn>
      </div>
    </Modal>
  );
}

function SessionRow({ item, onReceipt }) {
  const sc = SC[item.status];
  return (
    <div className="ht-row">
      <div style={{ padding:"16px 18px" }}>
        <div style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:14 }}>
          <div style={{ width:44,height:44,borderRadius:12,flexShrink:0,background:"rgba(125,57,235,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>🅿️</div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:15,fontWeight:700,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.name}</div>
            <div style={{ fontSize:12,color:T.sub }}>📍 {item.address}</div>
          </div>
          <span style={{ flexShrink:0,padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:700,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}` }}>
            {sc.icon} {sc.label}
          </span>
        </div>

        <div style={{ display:"flex",flexWrap:"wrap",gap:7,marginBottom:14 }}>
          {[
            { icon:"📅", val:item.date },
            { icon:"⏱",  val:item.duration },
            { icon:"💰",  val:item.cost, color: item.status==="cancelled" ? T.sub : T.green },
          ].map(c => (
            <div key={c.val} style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:8,background:"rgba(255,255,255,.03)",border:`1px solid ${T.border}` }}>
              <span style={{ fontSize:11 }}>{c.icon}</span>
              <span style={{ fontSize:12,fontWeight:600,color:c.color||T.text }}>{c.val}</span>
            </div>
          ))}
        </div>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:"1px solid rgba(125,57,235,.1)" }}>
          <div style={{ fontSize:11,color:T.sub }}>🚗 {item.plateNumber}</div>
          <button onClick={() => onReceipt(item)} style={{
            padding:"6px 14px",borderRadius:9,border:"1px solid rgba(125,57,235,.28)",
            background:"rgba(125,57,235,.07)",color:T.purple,fontFamily:"inherit",
            fontSize:12,fontWeight:600,cursor:"pointer",transition:"background .2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(125,57,235,.16)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(125,57,235,.07)"}
          >View Receipt</button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryTab() {
  const [filter,  setFilter]  = useState("All");
  const [receipt, setReceipt] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/api/reservations/history");
        // Show only terminal states in history (exclude current PENDING/ACTIVE)
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

  const completed  = history.filter(h => h.status === "completed");
  const totalEGP   = completed.reduce((a, h) => {
    const m = h.cost.match(/[\d.]+/);
    return a + (m ? parseFloat(m[0]) : 0);
  }, 0);
  const totalMins  = history.reduce((a, h) => {
    const parts = h.duration.match(/(\d+)h\s*(\d+)?m?/);
    return a + (parts ? (+parts[1]) * 60 + (+parts[2] || 0) : 0);
  }, 0);
  const hrs = Math.floor(totalMins / 60), mins = totalMins % 60;

  return (
    <div className="ht-wrap" style={{ maxWidth:780,margin:"0 auto",padding:isMobile?"20px 16px":"32px 28px" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:22,fontWeight:800,marginBottom:3 }}>Parking History</div>
        <div style={{ fontSize:13,color:T.sub }}>{loading ? "Loading…" : `${history.length} sessions recorded`}</div>
      </div>

      {/* Aggregate stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24 }}>
        {[
          { icon:"✅", label:"Completed",   val:completed.length,                color:T.green  },
          { icon:"💰", label:"Total Spent", val:`EGP ${totalEGP.toFixed(0)}`,   color:T.purple },
          { icon:"⏱",  label:"Hours Parked",val:`${hrs}h ${mins}m`,             color:"#38BDF8" },
        ].map(s => (
          <div key={s.label} className="ht-stat">
            <div style={{ fontSize:20,marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:18,fontWeight:800,color:s.color,letterSpacing:-.5,marginBottom:3 }}>{s.val}</div>
            <div style={{ fontSize:11,color:T.sub }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
        {filters.map(f => {
          const count = f === "All" ? history.length : history.filter(h => h.status === f.toLowerCase()).length;
          return (
            <button key={f} className="ht-pill" onClick={() => setFilter(f)} style={{
              borderColor: filter===f ? T.purple : T.border,
              background:  filter===f ? "rgba(125,57,235,.12)" : "transparent",
              color:       filter===f ? T.purple : T.sub,
            }}>
              {f}
              <span style={{
                marginLeft:6,fontSize:11,padding:"1px 6px",borderRadius:5,
                background: filter===f ? "rgba(125,57,235,.2)" : "rgba(255,255,255,.07)",
                color:       filter===f ? T.purple : T.sub,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:T.sub }}>
          <div style={{ fontSize:28,marginBottom:12 }}>⏳</div>
          <div style={{ fontSize:15,fontWeight:600 }}>Loading history…</div>
        </div>
      ) : shown.length === 0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:T.sub }}>
          <div style={{ fontSize:36,marginBottom:12 }}>🕐</div>
          <div style={{ fontSize:16,fontWeight:700,marginBottom:6 }}>No {filter.toLowerCase()} sessions</div>
          <div style={{ fontSize:13 }}>Your parking history will show up here.</div>
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {shown.map(item => (
            <SessionRow key={item.id} item={item} onReceipt={setReceipt} />
          ))}
        </div>
      )}

      <ReceiptModal item={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
