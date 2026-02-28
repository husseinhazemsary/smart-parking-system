import React, { useState } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { SPOTS, availColor, availLabel } from "../data/spots";

import Modal from "../components/ui/Modal";
import ProgressBar from "../components/ui/ProgressBar";
import Card from "../components/ui/Card";
import GlowBtn from "../components/ui/GlowBtn";

import { inputStyle } from "./Auth";

/* ─── Find & Reserve tab ─────────────────────────────────────── */
export default function FindTab({ onReserve, user, onAuthOpen }){
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");
  const [selected,setSelected]=useState(null);
  const [modal,setModal]=useState(false);
  const { isMobile }=useBreakpoint();
  const cats=["All","Mall","University","Airport","Street"];
  const filtered=SPOTS.filter(s=>(cat==="All"||s.category===cat)&&(s.name.toLowerCase().includes(search.toLowerCase())||s.address.toLowerCase().includes(search.toLowerCase())));


  const reserveSpot = (spot) => {
    if(!user){ onAuthOpen?.(); return; }
    onReserve(spot);
  };

  return(
    <div style={{ display:"flex",flex:1,minHeight:0,height:isMobile?"auto":"100%",flexDirection:isMobile?"column":"row" }}>

      {/* List panel */}
      <div style={{ width:isMobile?"100%":"clamp(320px, 34vw, 420px)",borderRight:isMobile?"none":`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0,borderBottom:isMobile?`1px solid ${T.border}`:"none",minWidth:isMobile?"auto":320 }}>
        <div style={{ padding:"20px 20px 0" }}>
          <div style={{ position:"relative",marginBottom:12 }}>
            <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:T.sub,pointerEvents:"none" }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or area..."
              style={{ ...inputStyle,paddingLeft:42,width:"100%" }} />
          </div>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",paddingBottom:14 }}>
            {cats.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{
                padding:"5px 14px",borderRadius:999,border:`1px solid ${cat===c?T.purple:T.border}`,
                background:cat===c?T.purple:"transparent",color:cat===c?"#fff":T.sub,
                fontSize:12,fontWeight:cat===c?700:400,cursor:"pointer",fontFamily:"inherit",
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ flex:1,minHeight:0,overflowY:"auto",padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:12,maxHeight:isMobile?360:"none" }}>
          {filtered.map(s=>{
            const ac=availColor(s.available,s.total);
            const al=availLabel(s.available,s.total);
            const isSel=selected?.id===s.id;
            return(
              <div key={s.id} onClick={()=>{ setSelected(s); if(isMobile) setModal(true); }}
                style={{ borderRadius:16,border:`1.5px solid ${isSel?T.purple:T.border}`,background:isSel?"rgba(125,57,235,.1)":T.surface,cursor:"pointer",overflow:"hidden",transition:"all .15s",boxShadow:isSel?`0 0 20px rgba(125,57,235,.2)`:"none" }}>
                <div style={{ padding:"14px 14px 0" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                    <div style={{ flex:1,minWidth:0,marginRight:8 }}>
                      <div style={{ fontWeight:700,fontSize:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name}</div>
                      <div style={{ fontSize:12,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.address}</div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontSize:14,fontWeight:800,color:T.green }}>EGP {s.rate}<span style={{ fontSize:11,fontWeight:400,color:T.sub }}>/hr</span></div>
                      <div style={{ fontSize:11,color:T.sub }}>{s.distance} km</div>
                    </div>
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                      <span style={{ fontSize:12,color:ac,fontWeight:600 }}>{al}</span>
                      <span style={{ fontSize:12,color:T.sub }}>{s.available}/{s.total}</span>
                    </div>
                    <ProgressBar value={1-(s.available/s.total)} color={ac} />
                  </div>
                </div>
                <button onClick={e=>{ e.stopPropagation(); setSelected(s); setModal(true); }}
                  style={{ width:"100%",padding:"9px",border:"none",borderTop:`1px solid rgba(125,57,235,.2)`,background:"transparent",color:T.purple,fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                  View Details →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map area (desktop) */}
      {!isMobile && (
        <div style={{ flex:1,minHeight:0,position:"relative",background:`radial-gradient(ellipse at 60% 40%,rgba(125,57,235,.1),transparent 60%),linear-gradient(180deg,rgba(17,0,48,.9),${T.dark})`,overflow:"hidden" }}>
          <div style={{ position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(125,57,235,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(125,57,235,.06) 1px,transparent 1px)`,backgroundSize:"48px 48px" }} />
          {!selected && (
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:T.sub }}>
              <span style={{ fontSize:48 }}>🗺</span>
              <span style={{ fontSize:15,fontWeight:600 }}>Select a location to preview</span>
            </div>
          )}
          {filtered.map((s,i)=>{
            const isSel=selected?.id===s.id;
            const ac=availColor(s.available,s.total);
            return(
              <div key={s.id} onClick={()=>setSelected(s)} style={{ position:"absolute",left:`${18+(i*15)%52}%`,top:`${22+(i*19)%46}%`,transform:"translate(-50%,-50%)",cursor:"pointer",zIndex:2 }}>
                <div style={{ padding:"5px 12px",borderRadius:999,fontWeight:700,fontSize:12,background:isSel?T.purple:"rgba(17,0,48,.92)",border:`1.5px solid ${isSel?T.purple:ac}`,color:isSel?"#fff":ac,boxShadow:isSel?`0 4px 20px rgba(125,57,235,.5)`:"0 2px 8px rgba(0,0,0,.4)",transition:"all .2s",whiteSpace:"nowrap" }}>
                  {s.name.split(" ")[0]}  EGP {s.rate}
                </div>
                <div style={{ width:8,height:8,borderRadius:4,background:isSel?T.purple:ac,margin:"3px auto 0" }} />
              </div>
            );
          })}
          {selected && <SpotDetailPanel spot={selected} onReserve={()=>reserveSpot(selected)} onClose={()=>setSelected(null)} />}
        </div>
      )}

      {/* Mobile: detail modal */}
      <Modal open={modal&&!!selected} onClose={()=>setModal(false)}>
        {selected && (
          <div style={{ padding:24 }}>
            <SpotDetailContent spot={selected} onReserve={()=>{ setModal(false); reserveSpot(selected); }} onClose={()=>setModal(false)} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function SpotDetailPanel({ spot, onReserve, onClose }){
  return(
    <div style={{ position:"absolute",left:0,right:0,bottom:0,zIndex:5,borderTop:`1px solid ${T.border}`,background:T.surface,padding:"24px 28px",animation:"slideUp .2s ease",maxHeight:"55%",overflowY:"auto",boxShadow:"0 -10px 30px rgba(0,0,0,.35)" }}>
      <SpotDetailContent spot={spot} onReserve={onReserve} onClose={onClose} />
    </div>
  );
}

function SpotDetailContent({ spot, onReserve, onClose }){
  const ac=availColor(spot.available,spot.total);
  const { isMobile, w } = useBreakpoint();
  const cols = isMobile || w < 520 ? 2 : 4;
  return(
    <>
      <div style={{ display:"flex",alignItems:"flex-start",gap:14,marginBottom:18 }}>
        <div style={{ width:52,height:52,borderRadius:14,background:"rgba(125,57,235,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0 }}>🅿️</div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",justifyContent:"space-between" }}>
            <div>
              <div style={{ fontWeight:800,fontSize:17,marginBottom:2 }}>{spot.name}</div>
              <div style={{ fontSize:13,color:T.sub }}>{spot.address}</div>
            </div>
            <button onClick={onClose} style={{ background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:18,lineHeight:1 }}>✕</button>
          </div>
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:`repeat(${cols}, minmax(0, 1fr))`,gap:10,marginBottom:16 }}>
        {[{ l:"Rate",v:`EGP ${spot.rate}/hr`,c:T.green },{ l:"Spots",v:`${spot.available}/${spot.total}`,c:ac },{ l:"Distance",v:`${spot.distance}km`,c:T.purple },{ l:"Hours",v:spot.hours,c:T.sub }].map(s=>(
          <div key={s.l} style={{ padding:"10px 8px",borderRadius:12,background:"rgba(255,255,255,.04)",border:`1px solid ${T.border}`,textAlign:"center",minWidth:0 }}>
            <div style={{ fontSize:12,fontWeight:700,color:s.c,marginBottom:2,overflowWrap:"anywhere",wordBreak:"break-word" }}>{s.v}</div>
            <div style={{ fontSize:10,color:T.sub }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
          <span style={{ fontSize:13,color:T.sub }}>Occupancy</span>
          <span style={{ fontSize:13,color:ac,fontWeight:600 }}>{Math.round((1-spot.available/spot.total)*100)}% full</span>
        </div>
        <ProgressBar value={1-(spot.available/spot.total)} color={ac} />
      </div>
      {spot.available>0
        ? <GlowBtn full onClick={onReserve}>Reserve This Spot →</GlowBtn>
        : <div style={{ textAlign:"center",padding:14,borderRadius:999,background:"rgba(239,68,68,.08)",border:`1px solid rgba(239,68,68,.2)`,color:T.red,fontWeight:700 }}>Lot Full</div>
      }
    </>
  );
}
