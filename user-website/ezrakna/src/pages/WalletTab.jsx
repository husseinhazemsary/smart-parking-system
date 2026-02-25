import React, { useState } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { TRANSACTIONS } from "../data/transactions";

import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";

/* ─── Wallet Tab ─────────────────────────────────────────────── */
export default function WalletTab(){
  const [showAll,setShowAll]=useState(false);
  const { isMobile }=useBreakpoint();
  return(
    <div style={{ maxWidth:780,margin:"0 auto",padding:isMobile?"20px 16px":"40px 28px" }}>
      {/* Balance card */}
      <div style={{ borderRadius:24,padding:"28px 24px",marginBottom:28,background:`linear-gradient(135deg,#4A0E9E,${T.purple} 50%,#2D0080)`,color:"#fff",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-30,right:-30,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,.06)",pointerEvents:"none" }} />
        <div style={{ fontSize:12,opacity:.75,marginBottom:4,letterSpacing:1 }}>AVAILABLE BALANCE</div>
        <div style={{ fontSize:`clamp(32px,5vw,44px)`,fontWeight:800,marginBottom:4 }}>EGP 1,250.00</div>
        <div style={{ fontSize:13,opacity:.65,marginBottom:20,letterSpacing:2 }}>•••• •••• •••• 4582</div>
        <div style={{ display:"flex",justifyContent:"space-between" }}>
          <div><div style={{ fontSize:10,opacity:.65 }}>CARDHOLDER</div><div style={{ fontSize:14,fontWeight:600 }}>Nour Ahmed</div></div>
          <div style={{ textAlign:"right" }}><div style={{ fontSize:10,opacity:.65 }}>EXPIRES</div><div style={{ fontSize:14,fontWeight:600 }}>09/28</div></div>
        </div>
      </div>

      {/* Add card */}
      <div style={{ borderRadius:14,padding:"14px 18px",marginBottom:28,border:`1.5px dashed ${T.green}`,display:"flex",alignItems:"center",gap:10,cursor:"pointer" }}>
        <span style={{ fontSize:22,color:T.green }}>＋</span>
        <span style={{ fontSize:14,fontWeight:600,color:T.green }}>Add new card</span>
      </div>

      {/* Active session mini */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <span style={{ fontSize:18,fontWeight:700 }}>Active Session</span>
        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
          <div style={{ width:8,height:8,borderRadius:4,background:T.green,animation:"pls 1.5s infinite" }} />
          <span style={{ fontSize:12,color:T.green,fontWeight:600 }}>Live</span>
        </div>
      </div>
      <Card style={{ padding:16,marginBottom:28 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
          <span style={{ fontSize:15,fontWeight:600 }}>Arkan Mall Parking</span>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10,color:T.sub,letterSpacing:.8 }}>EST. COST</div>
            <div style={{ fontSize:15,fontWeight:700 }}>EGP 50</div>
          </div>
        </div>
        <div style={{ fontSize:13,color:T.sub,marginBottom:12 }}>📍 Level 2 – B4</div>
        <div style={{ display:"flex",justifyContent:"flex-end" }}>
          <span style={{ fontSize:12,fontWeight:600,color:T.green,cursor:"pointer" }}>View Details →</span>
        </div>
      </Card>

      {/* Transactions */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <span style={{ fontSize:18,fontWeight:700 }}>Recent Activity</span>
        <button onClick={()=>setShowAll(true)} style={{ background:"none",border:"none",color:T.green,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>View all transactions</button>
      </div>
      {TRANSACTIONS.slice(0,3).map(t=><TxRow key={t.id} t={t} />)}

      <Modal open={showAll} onClose={()=>setShowAll(false)}>
        <div style={{ padding:"28px 24px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:"rgba(125,57,235,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>🧾</div>
            <div style={{ fontSize:20,fontWeight:700 }}>All Transactions</div>
          </div>
          {TRANSACTIONS.map(t=><TxRow key={t.id} t={t} />)}
        </div>
      </Modal>
    </div>
  );
}

function TxRow({ t }){
  return(
    <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,background:t.failed?"rgba(239,68,68,.05)":"rgba(125,57,235,.05)",marginBottom:10 }}>
      <div style={{ width:40,height:40,borderRadius:20,background:`${t.failed?T.red:T.purple}22`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:t.failed?T.red:T.purple,flexShrink:0 }}>
        {t.failed?"✕":"P"}
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.name}</div>
        <div style={{ fontSize:12,color:T.sub }}>{t.date}  •  {t.duration}</div>
      </div>
      <div style={{ textAlign:"right",flexShrink:0 }}>
        <div style={{ fontSize:13,fontWeight:700,color:T.accent }}>{t.cost}</div>
        <div style={{ fontSize:12,color:t.color,fontWeight:500 }}>{t.status}</div>
      </div>
    </div>
  );
}
