import React, { useState } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { HISTORY_DATA } from "../data/history";

import GradientBorder from "../components/ui/GradientBorder";
import Modal from "../components/ui/Modal";
import Divider from "../components/ui/Divider";
import GlowBtn from "../components/ui/GlowBtn";
import Tag from "../components/ui/Tag";

/* ─── History Tab ────────────────────────────────────────────── */
export default function HistoryTab(){
  const [filter,setFilter]=useState("All");
  const [receipt,setReceipt]=useState(null);
  const { isMobile }=useBreakpoint();
  const filters=["All","Completed","Cancelled"];
  const shown=filter==="All"?HISTORY_DATA:HISTORY_DATA.filter(h=>h.status===filter.toLowerCase());

  return(
    <div style={{ maxWidth:780,margin:"0 auto",padding:isMobile?"20px 16px":"40px 28px" }}>
      <div style={{ fontSize:22,fontWeight:800,marginBottom:20 }}>History</div>
      <div style={{ display:"flex",gap:8,marginBottom:24,flexWrap:"wrap" }}>
        {filters.map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"7px 18px",borderRadius:999,border:`1px solid ${filter===f?T.purple:T.border}`,background:filter===f?T.purple:"transparent",color:filter===f?"#fff":T.sub,fontSize:13,fontWeight:filter===f?700:400,cursor:"pointer",fontFamily:"inherit" }}>{f}</button>
        ))}
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        {shown.map(s=>(
          <GradientBorder key={s.id}>
            <div style={{ padding:16 }}>
              <div style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:12 }}>
                <div style={{ width:48,height:48,borderRadius:10,background:"rgba(125,57,235,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>🅿️</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:15,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name}</div>
                  <div style={{ fontSize:11,color:T.sub }}>{s.address}</div>
                </div>
                <Tag color={s.status==="completed"?T.green:T.red}>{s.status==="completed"?"✓ Completed":"✕ Cancelled"}</Tag>
              </div>
              <div style={{ display:"flex",gap:20,marginBottom:12,flexWrap:"wrap" }}>
                [["DATE",s.date],["DURATION",s.duration],["COST",s.cost]].map(([l,v])=>(
                  <div key={l}>
                    <div style={{ fontSize:10,color:T.sub,letterSpacing:.8,marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:13,fontWeight:600,color:l==="COST"?T.accent:T.text,textDecoration:s.status==="cancelled"&&l==="COST"?"line-through":"none",textDecorationColor:T.red }}>{v}</div>
                  </div>
                ))
              </div>
              <button onClick={()=>setReceipt(s)} style={{ padding:"7px 14px",borderRadius:10,border:"none",background:"rgba(125,57,235,.12)",color:T.purple,fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer" }}>View Receipt →</button>
            </div>
          </GradientBorder>
        ))}
      </div>

      <Modal open={!!receipt} onClose={()=>setReceipt(null)} maxWidth={460}>
        {receipt&&(
          <div style={{ padding:"28px 24px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
              <div style={{ width:44,height:44,borderRadius:12,background:"rgba(34,197,94,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>🧾</div>
              <div><div style={{ fontSize:20,fontWeight:700 }}>Receipt</div><div style={{ fontSize:12,color:T.sub }}>{receipt.name}</div></div>
            </div>
            [["Location",receipt.name],["Address",receipt.address],["Date",receipt.date],["Duration",receipt.duration],["Vehicle","Toyota Corolla  •  BG 4567"],["Slot","Level 2 – B4"]].map(([l,v],i,arr)=>(
              <div key={l}>
                <div style={{ display:"flex",justifyContent:"space-between",padding:"9px 0" }}>
                  <span style={{ color:T.sub,fontSize:13 }}>{l}</span>
                  <span style={{ color:T.text,fontSize:13,fontWeight:600,textAlign:"right",maxWidth:"60%" }}>{v}</span>
                </div>
                {i<arr.length-1&&<Divider />}
              </div>
            ))
            <div style={{ display:"flex",justifyContent:"space-between",padding:"12px 0 24px" }}>
              <span style={{ fontSize:15,fontWeight:700 }}>Total</span>
              <span style={{ fontSize:18,fontWeight:800,color:T.green }}>{receipt.cost}</span>
            </div>
            <GlowBtn full>⬇ Download PDF</GlowBtn>
          </div>
        )}
      </Modal>
    </div>
  );
}
