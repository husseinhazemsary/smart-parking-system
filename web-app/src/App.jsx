import React, { useState } from "react";
import { T } from "./constants/theme";

import Landing from "./pages/Landing";
import AppShell from "./components/layout/AppShell";
import AuthModal from "./pages/Auth";
import BusinessPage from "./pages/BusinessPage";

/* ─── Root ───────────────────────────────────────────────────── */
export default function Ezrakna(){
  const [view,setView]=useState("landing");   // landing | app | business
  const [authOpen,setAuthOpen]=useState(false);
  const [user,setUser]=useState(null);
  const [initialSpotId,setInitialSpotId]=useState(null);

  const go = (v) => { setView(v); };

  // Restore session from localStorage on first load
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const name  = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    const id    = localStorage.getItem("userId");
    if (token && email) setUser({ id, name, email, token });
  }, []);

  React.useEffect(() => { window.scrollTo({top:0,left:0,behavior:"instant"}); }, [view]);

  const handleAuth = (u) => { setUser(u); setAuthOpen(false); go("app"); };
  const handleLogout = () => {
    setUser(null);
    go("landing");
    ["token","refreshToken","userId","userName","userEmail"].forEach(k => localStorage.removeItem(k));
  };
  const handleEnter = () => { go("app"); };
  const handleEnterWithSpot = (spot) => { setInitialSpotId(spot.id); go("app"); };
  const handleBusiness = () => { go("business"); };

  return(
    <div style={{ background:T.dark,minHeight:"100vh",color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html{font-family:'Sora',sans-serif;}
        body{background:#07001A;}
        #root{width:100%;max-width:none;margin:0;padding:0;}
        html,body{width:100%;overflow-x:hidden;}
        
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:rgba(255,255,255,.02);}
        ::-webkit-scrollbar-thumb{background:rgba(125,57,235,.4);border-radius:3px;}
        input,select,textarea{font-family:'Sora',sans-serif;}
        input::placeholder{color:#9B8EC4;}
        select option{background:#110030;color:#F0EAFA;}
        @keyframes shimmer{0%{background-position:0% center}100%{background-position:200% center}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes pls{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(2.2);opacity:0}}
        .hideScroll::-webkit-scrollbar{height:0;}
        .hideScroll{msOverflowStyle:none;}
        a:hover{opacity:.8;}
        section{scroll-margin-top:68px;}
      `}</style>

      {view==="landing"  && <Landing onEnter={handleEnter} onViewDetails={handleEnterWithSpot} onAuthOpen={()=>setAuthOpen(true)} onBusiness={handleBusiness} user={user} />}
      {view==="app"      && <AppShell user={user} onLogout={handleLogout} onBack={()=>go("landing")} onAuthOpen={()=>setAuthOpen(true)} initialSpotId={initialSpotId} onSpotDetailOpened={()=>setInitialSpotId(null)} />}
      {view==="business" && <BusinessPage onBack={()=>go("landing")} />}

      <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onAuth={handleAuth} />
    </div>
  );
}