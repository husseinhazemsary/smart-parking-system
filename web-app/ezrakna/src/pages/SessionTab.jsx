import React, { useState } from "react";
import { T } from "../constants/theme";
import useTimer from "../hooks/useTimer";
import useBreakpoint from "../hooks/useBreakpoint";

import Card from "../components/ui/Card";
import Divider from "../components/ui/Divider";
import SectionLabel from "../components/ui/SectionLabel";

/* ─── Session Tab ────────────────────────────────────────────── */
export default function SessionTab({ spot, onEnd }){
  const elapsed=useTimer();
  const [ending,setEnding]=useState(false);
  const { isMobile }=useBreakpoint();

  if(!spot) return(
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16 }}>
      <div style={{ fontSize:64 }}>🅿️</div>
      <div style={{ fontSize:22,fontWeight:700 }}>No active session</div>
      <div style={{ fontSize:14,color:T.sub,textAlign:"center",padding:"0 20px" }}>Reserve a spot from the Find Parking tab to get started.</div>
    </div>
  );

  const parts=elapsed.split(":").map(Number);
  const cost=((parts[0]*3600+parts[1]*60+parts[2])/3600*spot.rate).toFixed(2);

  return(
    <div style={{ maxWidth:780,margin:"0 auto",padding:isMobile?"20px 16px":"40px 28px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:28,padding:"12px 18px",borderRadius:14,background:"rgba(34,197,94,.07)",border:`1px solid rgba(34,197,94,.18)` }}>
        <div style={{ width:10,height:10,borderRadius:5,background:T.green,animation:"pls 1.5s infinite",flexShrink:0 }} />
        <span style={{ fontWeight:700,color:T.green,fontSize:14 }}>Session Active</span>
        <span style={{ color:T.sub,fontSize:13 }}>•  Started 09:30 PM</span>
      </div>

      <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:28 }}>
        <div style={{ width:60,height:60,borderRadius:18,background:"rgba(125,57,235,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0 }}>🅿️</div>
        <div>
          <div style={{ fontSize:isMobile?20:24,fontWeight:800,letterSpacing:-0.5 }}>{spot.name}</div>
          <div style={{ fontSize:14,color:T.sub }}>{spot.address}</div>
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20 }}>
        <Card style={{ padding:isMobile?18:24,textAlign:"center" }} glow>
          <div style={{ fontSize:11,color:T.sub,letterSpacing:1,marginBottom:8 }}>ELAPSED TIME</div>
          <div style={{ fontSize:isMobile?36:48,fontWeight:800,color:T.purple,fontVariantNumeric:"tabular-nums",letterSpacing:-2,lineHeight:1 }}>{elapsed}</div>
        </Card>
        <Card style={{ padding:isMobile?18:24,textAlign:"center" }} glow>
          <div style={{ fontSize:11,color:T.sub,letterSpacing:1,marginBottom:8 }}>ESTIMATED COST</div>
          <div style={{ fontSize:isMobile?36:48,fontWeight:800,color:T.green,letterSpacing:-2,lineHeight:1 }}>
            {spot.rate===0?"Free":`EGP ${cost}`}
          </div>
        </Card>
      </div>

      <Card style={{ padding:22,marginBottom:20 }}>
        <SectionLabel>Session Details</SectionLabel>
        [["Parking Slot","B4"],["Level & Gate","Level 2  •  Gate B"],["Vehicle","Toyota Corolla  •  BG 4567"],["Rate",`EGP ${spot.rate}/hr`],["Hours",spot.hours]].map(([l,v],i,arr)=>(
          <div key={l}>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 0" }}>
              <span style={{ color:T.sub,fontSize:14 }}>{l}</span>
              <span style={{ color:T.text,fontSize:14,fontWeight:600 }}>{v}</span>
            </div>
            {i<arr.length-1&&<Divider />}
          </div>
        ))
      </Card>

      {!ending
        ? <button onClick={()=>setEnding(true)} style={{ width:"100%",padding:16,borderRadius:14,background:"rgba(239,68,68,.1)",border:`1px solid rgba(239,68,68,.25)`,color:T.red,fontFamily:"inherit",fontSize:16,fontWeight:700,cursor:"pointer" }}>⏹ End Session</button>
        : <Card style={{ padding:24 }}>
            <div style={{ fontSize:17,fontWeight:700,marginBottom:8,textAlign:"center" }}>End your session?</div>
            <div style={{ fontSize:14,color:T.sub,textAlign:"center",marginBottom:20 }}>Total charge: <strong style={{ color:T.green }}>EGP {cost}</strong></div>
            <div style={{ display:"flex",gap:12 }}>
              <button onClick={()=>setEnding(false)} style={{ flex:1,padding:14,borderRadius:12,border:`1px solid ${T.border}`,background:"transparent",color:T.text,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer" }}>Cancel</button>
              <button onClick={onEnd} style={{ flex:1,padding:14,borderRadius:12,border:"none",background:T.red,color:"#fff",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer" }}>Confirm End</button>
            </div>
          </Card>
      }
    </div>
  );
}
