import React, { useState } from "react";
import { T } from "../../constants/theme";
import useBreakpoint from "../../hooks/useBreakpoint";
import GlowBtn from "../ui/GlowBtn";
import Card from "../ui/Card";
import BottomNav from "./BottomNav";

import FindTab from "../../pages/FindTab";
import SessionTab from "../../pages/SessionTab";
import WalletTab from "../../pages/WalletTab";
import HistoryTab from "../../pages/HistoryTab";
import AccountTab from "../../pages/AccountTab";

export default function AppShell({ user, onLogout, onBack, onAuthOpen, initialSpotId, onSpotDetailOpened }){
  const [tab,setTab]=useState("find");
  const [booked,setBooked]=useState(null);
  const { isMobile, isTablet }=useBreakpoint();
  const [mobileNav,setMobileNav]=useState(false);
  const [profile,setProfile]=useState({
    vehicles:[
      { icon:"🚗", label:"Toyota Corolla", sub:"BG 4567", isEV:false },
      { icon:"🚙", label:"Hyundai Tucson",  sub:"MK 1234", isEV:false },
    ],
    accessibility:false,
  });

  const tabs=[
    { id:"find",    label:"Find Parking", icon:"🔍" },
    { id:"session", label:"My Session",   icon:"⏱",  dot:!!booked },
    { id:"wallet",  label:"Wallet",       icon:"💳" },
    { id:"history", label:"History",      icon:"🕐" },
    { id:"account", label:"Account",      icon:"👤" },
  ];

  const setTabSafe = (id) => {
    // Guests can browse spots, but need to authenticate for session/wallet/history/account.
    if(!user && id!=="find"){
      onAuthOpen?.();
      return;
    }
    setTab(id);
  };


  return(
    <div style={{ minHeight:"100vh",background:T.dark,color:T.text,display:"flex",flexDirection:"column" }}>
      {/* Top bar */}
      <header style={{
        height:64,display:"flex",alignItems:"center",padding:`0 ${isMobile?"16px":"28px"}`,gap:16,
        borderBottom:`1px solid ${T.border}`,background:"rgba(17,0,48,.95)",
        backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:50,flexShrink:0,
      }}>
        <button onClick={onBack} style={{ background:"none",border:`1px solid ${T.border}`,borderRadius:10,color:T.sub,cursor:"pointer",padding:"6px 12px",fontSize:13,fontFamily:"inherit",whiteSpace:"nowrap" }}>← Home</button>
        <div style={{ fontWeight:800,fontSize:20,letterSpacing:-0.5,whiteSpace:"nowrap" }}><span style={{ color:T.purple }}>ez</span>rakna</div>
        <div style={{ flex:1 }} />

        {/* Desktop nav tabs */}
        {!isMobile && (
          <nav className="hideScroll" style={{ display:"flex",gap:4,overflowX:"auto",maxWidth:"60vw",paddingBottom:2,scrollbarWidth:"none" }}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTabSafe(t.id)} style={{
                padding:"8px 16px",borderRadius:10,border:"none",fontFamily:"inherit",
                background:tab===t.id?"rgba(125,57,235,.18)":"transparent",
                color:tab===t.id?T.text:T.sub,
                fontSize:13,fontWeight:tab===t.id?700:400,cursor:"pointer",
                position:"relative",whiteSpace:"nowrap",
              }}>
                {!isTablet&&`${t.icon} `}{!isTablet?t.label:t.icon}
                {t.dot&&<span style={{ position:"absolute",top:5,right:5,width:7,height:7,borderRadius:4,background:T.green,animation:"pls 1.5s infinite" }} />}
              </button>
            ))}
          </nav>
        )}

        {/* User */}
        <div style={{ display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
          {user ? (
            <>
              {!isMobile && <span style={{ fontSize:13,color:T.sub,whiteSpace:"nowrap" }}>{user.name}</span>}
              <button onClick={onLogout} style={{ background:"rgba(239,68,68,.1)",border:`1px solid rgba(239,68,68,.2)`,borderRadius:10,color:T.red,cursor:"pointer",padding:"6px 12px",fontSize:12,fontFamily:"inherit",whiteSpace:"nowrap" }}>Log out</button>
            </>
          ) : (
            <>
              {!isMobile && <GlowBtn small outline noArrow onClick={onAuthOpen}>Log In</GlowBtn>}
              <GlowBtn small noArrow onClick={onAuthOpen}>Sign Up</GlowBtn>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <div style={{ flex:1,overflow:"auto" }}>
        {tab==="find" && <FindTab user={user} onAuthOpen={onAuthOpen} onReserve={s=>{ setBooked(s); setTab("session"); }} initialSpotId={initialSpotId} onSpotDetailOpened={onSpotDetailOpened} profile={profile} />}
        {tab!=="find" && !user && (
          <div style={{ padding:28,maxWidth:720,margin:"0 auto" }}>
            <Card style={{ padding:24,textAlign:"center" }}>
              <div style={{ fontSize:26,marginBottom:10 }}>🔒</div>
              <div style={{ fontSize:18,fontWeight:800,marginBottom:8 }}>Please log in to access this section</div>
              <div style={{ color:T.sub,fontSize:14,lineHeight:1.7,marginBottom:16 }}>
                You can browse parking locations without an account. To reserve, manage sessions, or view your wallet and history, please log in.
              </div>
              <GlowBtn onClick={onAuthOpen}>Log In / Sign Up</GlowBtn>
            </Card>
          </div>
        )}
        {tab==="session" && user && <SessionTab spot={booked} onEnd={()=>{ setBooked(null); setTab("find"); }} />}
        {tab==="wallet"  && user && <WalletTab />}
        {tab==="history" && user && <HistoryTab />}
        {tab==="account" && user && <AccountTab user={user} onLogout={onLogout} profile={profile} onProfileUpdate={setProfile} />}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <BottomNav tabs={tabs} tab={tab} setTabSafe={setTabSafe} />
      )}
    </div>
  );
}