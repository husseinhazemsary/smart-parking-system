import React from "react";
import { T } from "../../constants/theme";
import GlowBtn from "../ui/GlowBtn";

export default function Navbar({ scrolled, isMobile, user, onEnter, onAuthOpen }){
  return(
    <nav style={{
      position:"fixed",top:0,left:0,right:0,zIndex:100,
      padding:0, height:68,
      display:"flex",alignItems:"center",gap:16,
      background:scrolled?"rgba(7,0,26,.94)":"transparent",
      backdropFilter:scrolled?"blur(14px)":"none",
      borderBottom:scrolled?`1px solid ${T.border}`:"none",
      transition:"all .3s",
    }}>
      <div style={{ width:"100%",maxWidth:1200,margin:"0 auto",padding:`0 ${isMobile?"16px":"24px"}`,display:"flex",alignItems:"center",gap:16 }}>
      <div style={{ fontWeight:800,fontSize:22,letterSpacing:-0.5,flex:1,cursor:"pointer" }}>
        <span style={{ color:T.purple }}>ez</span>rakna
      </div>

      {!isMobile && (
        <div style={{ display:"flex",gap:28,marginRight:32 }}>
          {["features","locations","pricing"].map(l=>(
            <a key={l} href={`#${l}`} style={{ color:T.sub,fontSize:14,fontWeight:500,textDecoration:"none",textTransform:"capitalize" }}
              onMouseEnter={e=>e.target.style.color=T.text}
              onMouseLeave={e=>e.target.style.color=T.sub}
            >{l.charAt(0).toUpperCase()+l.slice(1)}</a>
          ))}
        </div>
      )}

      {user ? (
        <GlowBtn small onClick={onEnter}>Dashboard →</GlowBtn>
      ) : (
        <div style={{ display:"flex",gap:10 }}>
          {!isMobile && <GlowBtn small outline onClick={onAuthOpen}>Log In</GlowBtn>}
          <GlowBtn small onClick={onAuthOpen}>Sign Up</GlowBtn>
        </div>
      )}
      </div>
    </nav>
  );
}
