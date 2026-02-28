import React, { useState } from "react";
import { T } from "../../constants/theme";
import GlowBtn from "../ui/GlowBtn";

export default function Navbar({ scrolled, isMobile, user, onEnter, onAuthOpen, onBusiness, onLocations, onForBusiness }){
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { label:"Features",     action:()=>{ document.getElementById("features")?.scrollIntoView({behavior:"smooth"}); setMenuOpen(false); } },
    { label:"Locations",    action:()=>{ onLocations?.(); setMenuOpen(false); } },
    { label:"For Business", action:()=>{ onForBusiness?.(); setMenuOpen(false); }, gold:true },
  ];

  return(
    <>
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,
        padding:0, height:68,
        display:"flex",alignItems:"center",gap:16,
        background:scrolled?"rgba(7,0,26,.94)":"transparent",
        backdropFilter:scrolled?"blur(14px)":"none",
        borderBottom:scrolled?`1px solid ${T.border}`:"none",
        transition:"all .3s",
      }}>
        <div style={{width:"100%",maxWidth:1200,margin:"0 auto",padding:`0 ${isMobile?"16px":"24px"}`,display:"flex",alignItems:"center",gap:16}}>

          <div onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
            style={{fontWeight:800,fontSize:22,letterSpacing:-0.5,flex:1,cursor:"pointer"}}>
            <span style={{color:T.purple}}>ez</span>rakna
          </div>

          {!isMobile && (
            <div style={{display:"flex",gap:4,marginRight:16}}>
              {links.map(l=>(
                <button key={l.label} onClick={l.action} style={{
                  background:"none", border:"none", cursor:"pointer",
                  padding:"8px 14px", borderRadius:10,
                  fontSize:14, fontWeight:600,
                  color: l.gold ? "#F0B429" : T.sub,
                  fontFamily:"inherit",
                  transition:"color .2s, background .2s",
                }}
                  onMouseEnter={e=>{ e.currentTarget.style.color=l.gold?"#FFD97D":T.text; e.currentTarget.style.background="rgba(125,57,235,.08)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.color=l.gold?"#F0B429":T.sub; e.currentTarget.style.background="transparent"; }}
                >{l.label}</button>
              ))}
            </div>
          )}

          <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
            {/* Business button — temporarily hidden
            {!isMobile && (
              <GlowBtn small gold noArrow onClick={onBusiness}>Business</GlowBtn>
            )}
            */}

            {user ? (
              <GlowBtn small noArrow onClick={onEnter}>Dashboard</GlowBtn>
            ) : (
              <div style={{display:"flex",gap:10}}>
                {!isMobile && <GlowBtn small outline noArrow onClick={onAuthOpen}>Log In</GlowBtn>}
                <GlowBtn small noArrow onClick={onAuthOpen}>Sign Up</GlowBtn>
              </div>
            )}

            {isMobile && (
              <button onClick={()=>setMenuOpen(v=>!v)} style={{
                background:"none", border:"none", cursor:"pointer",
                padding:6, display:"flex", flexDirection:"column",
                gap:5, alignItems:"center",
              }}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{
                    width:22, height:2, borderRadius:2, background:T.text,
                    transition:"transform .25s, opacity .25s",
                    transform: menuOpen
                      ? i===0 ? "translateY(7px) rotate(45deg)"
                      : i===2 ? "translateY(-7px) rotate(-45deg)"
                      : "scaleX(0)"
                      : "none",
                    opacity: menuOpen && i===1 ? 0 : 1,
                  }}/>
                ))}
              </button>
            )}
          </div>
        </div>
      </nav>

      {isMobile && (
        <div style={{
          position:"fixed", top:68, left:0, right:0, zIndex:99,
          background:"rgba(7,0,26,.97)",
          backdropFilter:"blur(18px)",
          borderBottom:`1px solid ${T.border}`,
          padding: menuOpen ? "12px 20px 24px" : "0 20px",
          maxHeight: menuOpen ? 400 : 0,
          overflow:"hidden",
          transition:"max-height .35s cubic-bezier(.22,1,.36,1), padding .3s",
        }}>
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            {links.map(l=>(
              <button key={l.label} onClick={l.action} style={{
                background:"none", border:"none", cursor:"pointer",
                padding:"14px 12px", borderRadius:10, textAlign:"left",
                fontSize:15, fontWeight:600,
                color: l.gold ? "#F0B429" : T.text,
                fontFamily:"inherit",
                borderBottom:`1px solid rgba(125,57,235,.1)`,
              }}>{l.label}</button>
            ))}
            <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:10}}>
              <GlowBtn full gold onClick={()=>{ onBusiness?.(); setMenuOpen(false); }} noArrow>Explore for Business</GlowBtn>
              {!user && (
                <GlowBtn full onClick={()=>{ onAuthOpen?.(); setMenuOpen(false); }} noArrow>Sign In</GlowBtn>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}