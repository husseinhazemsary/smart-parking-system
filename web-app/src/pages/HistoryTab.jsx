import React, { useState } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { HISTORY_DATA } from "../data/history";
import GlowBtn from "../components/ui/GlowBtn";
import Modal from "../components/ui/Modal";

/* ─── Status config ──────────────────────────────────────────── */
const SC = {
  completed: { color:T.green,  bg:"rgba(34,197,94,.1)",  border:"rgba(34,197,94,.22)",  icon:"✓",  label:"Completed" },
  cancelled: { color:T.red,    bg:"rgba(239,68,68,.1)",  border:"rgba(239,68,68,.22)",  icon:"✕",  label:"Cancelled"  },
};

const CSS = `
  .ht-wrap { animation:ht-up .32s cubic-bezier(.22,1,.36,1); }
  @keyframes ht-up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pls { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(2.4);opacity:0} }

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

/* ─── Receipt Modal ──────────────────────────────────────────── */
function ReceiptModal({ item, onClose }) {
  if (!item) return null;
  const sc = SC[item.status];

  const rows = [
    ["Location",  item.name],
    ["Address",   item.address],
    ["Date",      item.date],
    ["Duration",  item.duration],
    ["Vehicle",   "Toyota Corolla · BG 4567"],
    ["Slot",      "Level 2 – B4"],
  ];

  return (
    <Modal open={!!item} onClose={onClose} maxWidth={440}>
      <div style={{padding:"26px 22px"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
          <div style={{width:46,height:46,borderRadius:13,
            background:"rgba(125,57,235,.1)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🧾</div>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:800}}>Receipt</div>
            <div style={{fontSize:12,color:T.sub}}>{item.name}</div>
          </div>
          <span style={{padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:700,
            background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>
            {sc.icon} {sc.label}
          </span>
        </div>

        {/* Detail rows */}
        <div style={{borderRadius:12,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:16}}>
          {rows.map(([l,v],i)=>(
            <div key={l}>
              <div style={{display:"flex",justifyContent:"space-between",
                alignItems:"center",padding:"11px 15px",gap:16}}>
                <span style={{fontSize:13,color:T.sub,flexShrink:0}}>{l}</span>
                <span style={{fontSize:13,fontWeight:600,textAlign:"right"}}>{v}</span>
              </div>
              {i<rows.length-1 && (
                <div style={{height:1,background:`rgba(125,57,235,.1)`,margin:"0 15px"}}/>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"14px 15px",borderRadius:12,marginBottom:18,
          background: item.status==="cancelled" ? "rgba(239,68,68,.06)" : "rgba(34,197,94,.06)",
          border:`1px solid ${item.status==="cancelled" ? "rgba(239,68,68,.2)" : "rgba(34,197,94,.2)"}`,
        }}>
          <span style={{fontSize:15,fontWeight:700}}>Total Charged</span>
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

/* ─── Session row card ───────────────────────────────────────── */
function SessionRow({ item, onReceipt }) {
  const sc = SC[item.status];
  return (
    <div className="ht-row">
      <div style={{padding:"16px 18px"}}>
        {/* Top */}
        <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
            background:"rgba(125,57,235,.12)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🅿️</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:700,marginBottom:2,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
            <div style={{fontSize:12,color:T.sub}}>📍 {item.address}</div>
          </div>
          <span style={{
            flexShrink:0,padding:"4px 10px",borderRadius:7,fontSize:11,fontWeight:700,
            background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`,
          }}>{sc.icon} {sc.label}</span>
        </div>

        {/* Info chips */}
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
          {[
            {icon:"📅", val:item.date},
            {icon:"⏱",  val:item.duration},
            {icon:"💰",  val: item.status==="cancelled" ? "No charge" : item.cost,
              color: item.status==="cancelled" ? T.sub : T.green},
          ].map(c=>(
            <div key={c.val} style={{
              display:"flex",alignItems:"center",gap:5,
              padding:"5px 10px",borderRadius:8,
              background:"rgba(255,255,255,.03)",border:`1px solid ${T.border}`,
            }}>
              <span style={{fontSize:11}}>{c.icon}</span>
              <span style={{fontSize:12,fontWeight:600,color:c.color||T.text}}>{c.val}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display:"flex",justifyContent:"space-between",alignItems:"center",
          paddingTop:12,borderTop:"1px solid rgba(125,57,235,.1)",
        }}>
          <div style={{fontSize:11,color:T.sub}}>🚗 Toyota Corolla · BG 4567</div>
          <button onClick={()=>onReceipt(item)} style={{
            padding:"6px 14px",borderRadius:9,
            border:`1px solid rgba(125,57,235,.28)`,
            background:"rgba(125,57,235,.07)",
            color:T.purple,fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",
            transition:"background .2s",
          }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(125,57,235,.16)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(125,57,235,.07)"}>
            View Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
export default function HistoryTab() {
  const [filter,  setFilter]  = useState("All");
  const [receipt, setReceipt] = useState(null);
  const { isMobile } = useBreakpoint();

  const filters = ["All","Completed","Cancelled"];
  const shown = filter==="All" ? HISTORY_DATA
    : HISTORY_DATA.filter(h=>h.status===filter.toLowerCase());

  /* stats */
  const completed = HISTORY_DATA.filter(h=>h.status==="completed");
  const totalEGP  = completed.reduce((a,h)=>a+parseInt(h.cost.replace(/\D/g,"")||"0"),0);
  const totalMins = HISTORY_DATA.reduce((a,h)=>{
    const parts = h.duration.match(/(\d+)h\s*(\d+)?m?/);
    return a + (parts ? (+parts[1])*60 + (+parts[2]||0) : 0);
  },0);
  const hrs = Math.floor(totalMins/60), mins = totalMins%60;

  return (
    <div className="ht-wrap" style={{maxWidth:780,margin:"0 auto",padding:isMobile?"20px 16px":"32px 28px"}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      {/* Header */}
      <div style={{marginBottom:22}}>
        <div style={{fontSize:22,fontWeight:800,marginBottom:3}}>Parking History</div>
        <div style={{fontSize:13,color:T.sub}}>{HISTORY_DATA.length} sessions recorded</div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
        {[
          {icon:"✅", label:"Completed",    val:completed.length,         color:T.green   },
          {icon:"💰", label:"Total Spent",  val:`EGP ${totalEGP}`,        color:T.purple  },
          {icon:"⏱",  label:"Hours Parked", val:`${hrs}h ${mins}m`,       color:"#38BDF8" },
        ].map(s=>(
          <div key={s.label} className="ht-stat">
            <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:s.color,letterSpacing:-.5,marginBottom:3}}>{s.val}</div>
            <div style={{fontSize:11,color:T.sub}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {filters.map(f=>{
          const count = f==="All" ? HISTORY_DATA.length
            : HISTORY_DATA.filter(h=>h.status===f.toLowerCase()).length;
          return (
            <button key={f} className="ht-pill" onClick={()=>setFilter(f)} style={{
              borderColor: filter===f ? T.purple : T.border,
              background:  filter===f ? "rgba(125,57,235,.12)" : "transparent",
              color:       filter===f ? T.purple : T.sub,
            }}>
              {f}
              <span style={{
                marginLeft:6,fontSize:11,padding:"1px 6px",borderRadius:5,
                background: filter===f ? "rgba(125,57,235,.2)" : "rgba(255,255,255,.07)",
                color: filter===f ? T.purple : T.sub,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {shown.length===0 ? (
        <div style={{textAlign:"center",padding:"60px 0",color:T.sub}}>
          <div style={{fontSize:36,marginBottom:12}}>🕐</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>No {filter.toLowerCase()} sessions</div>
          <div style={{fontSize:13}}>Your parking history will show up here.</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {shown.map(item=>(
            <SessionRow key={item.id} item={item} onReceipt={setReceipt}/>
          ))}
        </div>
      )}

      <ReceiptModal item={receipt} onClose={()=>setReceipt(null)}/>
    </div>
  );
}