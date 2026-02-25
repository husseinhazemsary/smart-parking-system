import React, { useState } from "react";
import { T } from "./constants/theme";

import Landing from "./pages/Landing";
import AppShell from "./components/layout/AppShell";
import AuthModal from "./pages/Auth";

/* ─── Root ───────────────────────────────────────────────────── */
export default function Ezrakna(){
  const [view,setView]=useState("landing");   // landing | app
  const [authOpen,setAuthOpen]=useState(false);
  const [user,setUser]=useState(null);

  const handleAuth = (u) => { setUser(u); setAuthOpen(false); setView("app"); };
  const handleLogout = () => { setUser(null); setView("landing"); };
  const handleEnter = () => { setView("app"); };

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
        input{font-family:'Sora',sans-serif;}
        input::placeholder{color:#9B8EC4;}
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

      {view==="landing" && <Landing onEnter={handleEnter} onAuthOpen={()=>setAuthOpen(true)} user={user} />}
      {view==="app"     && <AppShell user={user} onLogout={handleLogout} onBack={()=>setView("landing")} onAuthOpen={()=>setAuthOpen(true)} />}

      <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onAuth={handleAuth} />
    </div>
  );
}
