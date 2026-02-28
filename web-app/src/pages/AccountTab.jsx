import React from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";

import GradientBorder from "../components/ui/GradientBorder";
import SectionLabel from "../components/ui/SectionLabel";
import Divider from "../components/ui/Divider";
import Toggle from "../components/ui/Toggle";

/* ─── Account Tab ────────────────────────────────────────────── */
export default function AccountTab({ user, onLogout }){
  const { isMobile }=useBreakpoint();
  const sections=[
    { title:"My Vehicles", items:[{ icon:"🚗",label:"Toyota Corolla",sub:"BG 4567" },{ icon:"🚙",label:"Hyundai Tucson",sub:"MK 1234" }], add:"+ Add Vehicle" },
    { title:"Preferences", items:[{ icon:"🔔",label:"Notifications",sub:"Push alerts",toggle:true },{ icon:"📍",label:"Location Services",sub:"GPS access",toggle:true }] },
    { title:"Account", items:[{ icon:"👤",label:"Edit Profile",sub:"Name, email, phone" },{ icon:"🔒",label:"Security",sub:"Password & PIN" },{ icon:"💳",label:"Payment Methods",sub:"Cards & wallet" }] },
    { title:"Support", items:[{ icon:"❓",label:"Help Center",sub:"FAQs & guides" },{ icon:"💬",label:"Contact Us",sub:"Chat or email" }] },
  ];
  return(
    <div style={{ maxWidth:780,margin:"0 auto",padding:0 }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg,#2D0080,${T.purple} 60%,#4A0E9E)`,padding:isMobile?"32px 20px 28px":"40px 32px 32px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:20 }}>
          <div style={{ width:72,height:72,borderRadius:36,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,border:"2px solid rgba(255,255,255,.3)",flexShrink:0 }}>👤</div>
          <div>
            <div style={{ fontSize:22,fontWeight:800,color:"#fff" }}>{user.name}</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,.7)" }}>{user.email}</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:28,paddingTop:16,borderTop:"1px solid rgba(255,255,255,.2)" }}>
          [["18","Sessions"],["42h","Parked"],["2","Vehicles"]].map(([v,l])=>(
            <div key={l}><div style={{ fontSize:20,fontWeight:800,color:"#fff" }}>{v}</div><div style={{ fontSize:11,color:"rgba(255,255,255,.6)" }}>{l}</div></div>
          ))
        </div>
      </div>

      <div style={{ padding:isMobile?"16px":"28px",display:"flex",flexDirection:"column",gap:16 }}>
        {sections.map(sec=>(
          <GradientBorder key={sec.title}>
            <div style={{ padding:20 }}>
              <SectionLabel>{sec.title}</SectionLabel>
              {sec.items.map((item,i)=>(
                <div key={item.label}>
                  <div style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 0" }}>
                    <div style={{ width:38,height:38,borderRadius:10,background:"rgba(125,57,235,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>{item.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14,fontWeight:600 }}>{item.label}</div>
                      <div style={{ fontSize:12,color:T.sub }}>{item.sub}</div>
                    </div>
                    {item.toggle ? <Toggle /> : <span style={{ color:T.sub }}>›</span>}
                  </div>
                  {i<sec.items.length-1&&<Divider />}
                </div>
              ))}
              {sec.add&&(
                <button style={{ marginTop:12,padding:"8px 14px",borderRadius:10,border:`1.5px solid ${T.green}`,background:"transparent",color:T.green,fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer" }}>{sec.add}</button>
              )}
            </div>
          </GradientBorder>
        ))}
        <button onClick={onLogout} style={{ padding:14,borderRadius:14,background:"rgba(239,68,68,.08)",border:`1px solid rgba(239,68,68,.2)`,color:T.red,fontFamily:"inherit",fontSize:15,fontWeight:600,cursor:"pointer" }}>Sign Out</button>
      </div>
    </div>
  );
}
