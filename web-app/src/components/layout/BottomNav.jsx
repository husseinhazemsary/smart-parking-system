import React from "react";
import { T } from "../../constants/theme";

export default function BottomNav({ tabs, tab, setTabSafe }){
  return(
    <div style={{ position:"sticky",bottom:0,display:"flex",borderTop:`1px solid ${T.border}`,background:"rgba(17,0,48,.97)",backdropFilter:"blur(12px)",zIndex:50 }}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>setTabSafe(t.id)} style={{
          flex:1,padding:"10px 4px 12px",border:"none",background:"none",
          display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",
          position:"relative",
        }}>
          <span style={{ fontSize:18,filter:tab===t.id?"none":"grayscale(1) opacity(.5)" }}>{t.icon}</span>
          <span style={{ fontSize:9,color:tab===t.id?T.purple:T.sub,fontWeight:tab===t.id?700:400,fontFamily:"inherit" }}>{t.label.split(" ")[0]}</span>
          {t.dot&&<span style={{ position:"absolute",top:8,right:"25%",width:7,height:7,borderRadius:4,background:T.green,animation:"pls 1.5s infinite" }} />}
        </button>
      ))}
    </div>
  );
}
