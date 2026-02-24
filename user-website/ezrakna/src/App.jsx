import { useState, useEffect, useRef } from "react";

/* ─── Tokens ─────────────────────────────────────────────────── */
const T = {
  purple:"#7D39EB", purpleDim:"#4A1A9E", dark:"#07001A",
  surface:"#110030", accent:"#B2A8D2", green:"#22C55E",
  red:"#EF4444", amber:"#F59E0B", text:"#F0EAFA",
  sub:"#9B8EC4", border:"rgba(125,57,235,0.22)",
};

/* ─── Data ───────────────────────────────────────────────────── */
const SPOTS = [
  { id:1, name:"Arkan Mall Parking",      address:"Sheikh Zayed, Giza",              available:28, total:80,  rate:15, distance:0.5, category:"Mall",       hours:"7AM–12AM" },
  { id:2, name:"NGU Parking Lot",          address:"New Giza, Cairo-Alex Desert Rd",  available:12, total:60,  rate:0,  distance:0.9, category:"University", hours:"7AM–10PM" },
  { id:3, name:"Cairo Airport Terminal 2", address:"Cairo International Airport",     available:3,  total:200, rate:25, distance:1.2, category:"Airport",    hours:"24h"      },
  { id:4, name:"Tahrir Street Parking",    address:"Tahrir Square, Downtown Cairo",   available:45, total:100, rate:10, distance:2.1, category:"Street",     hours:"6AM–11PM" },
  { id:5, name:"City Stars Parking",       address:"Nasr City, Cairo",               available:0,  total:150, rate:20, distance:3.4, category:"Mall",       hours:"8AM–12AM" },
  { id:6, name:"Dandy Mega Mall",          address:"Sheikh Zayed, 6th of October",   available:62, total:120, rate:12, distance:4.1, category:"Mall",       hours:"9AM–11PM" },
];

const HISTORY_DATA = [
  { id:1, name:"Arkan Mall Parking",      address:"Sheikh Zayed, Giza",         date:"Dec 24, 2025", duration:"2h 15m", cost:"EGP 65",  status:"completed" },
  { id:2, name:"Cairo Festival City",     address:"Cairo Ring Road",             date:"Dec 18, 2025", duration:"3h 45m", cost:"EGP 90",  status:"completed" },
  { id:3, name:"Galleria 40",             address:"Sheikh Zayed, Giza",         date:"Dec 25, 2025", duration:"4h 20m", cost:"EGP 50",  status:"cancelled"  },
  { id:4, name:"NGU Parking Lot",         address:"New Giza, Giza",             date:"Dec 23, 2025", duration:"4h 20m", cost:"EGP 0",   status:"completed" },
  { id:5, name:"City Stars Parking",      address:"Nasr City, Cairo",           date:"Dec 10, 2025", duration:"1h 55m", cost:"EGP 40",  status:"completed" },
];

const TRANSACTIONS = [
  { id:1, name:"Cairo Airport Terminal 2", date:"Yesterday", duration:"4h 20m", cost:"-EGP 50",  status:"PAID",   color:T.green, failed:false },
  { id:2, name:"Galleria 40",              date:"Dec 25",    duration:"4h 20m", cost:"-EGP 50",  status:"FAILED", color:T.red,   failed:true  },
  { id:3, name:"NGU Parking Lot",          date:"Dec 23",    duration:"4h 20m", cost:"-EGP 0",   status:"PAID",   color:T.green, failed:false },
  { id:4, name:"Arkan Mall Parking",       date:"Dec 18",    duration:"2h 15m", cost:"-EGP 65",  status:"PAID",   color:T.green, failed:false },
  { id:5, name:"Cairo Festival City",      date:"Dec 15",    duration:"3h 45m", cost:"-EGP 90",  status:"PAID",   color:T.green, failed:false },
  { id:6, name:"Smart Village Hub",        date:"Dec 10",    duration:"8h 00m", cost:"-EGP 160", status:"FAILED", color:T.red,   failed:true  },
];

const FEATURES = [
  { icon:"🔍", title:"Find Instantly",       body:"Browse real-time availability across Cairo. Filter by area, price or category." },
  { icon:"📍", title:"Reserve Your Spot",    body:"Lock in a slot before you arrive — your space is held, no guessing required." },
  { icon:"⏱",  title:"Track Live Sessions",  body:"Watch your time and cost tick live. End your session remotely from the dashboard." },
  { icon:"💳", title:"Seamless Payments",    body:"Pay per session from your wallet. Full receipt and history always available." },
];

const STATS = [
  { value:"50+",   label:"Parking Locations" },
  { value:"12k+",  label:"Active Drivers"    },
  { value:"98%",   label:"Satisfaction Rate" },
  { value:"3 min", label:"Avg. Reserve Time" },
];

/* ─── Helpers ────────────────────────────────────────────────── */
const availColor = (a,t) => { const r=a/t; return r===0||r<0.1 ? T.red : r<0.4 ? T.amber : T.green; };
const availLabel = (a,t) => { const r=a/t; return r===0?"Full":r<0.1?"Almost Full":r<0.4?"Filling Fast":"Available"; };

function useTimer(start=5025){
  const [s,setS]=useState(start);
  useEffect(()=>{ const id=setInterval(()=>setS(v=>v+1),1000); return()=>clearInterval(id); },[]);
  return [String(Math.floor(s/3600)).padStart(2,"0"),String(Math.floor((s%3600)/60)).padStart(2,"0"),String(s%60).padStart(2,"0")].join(":");
}

function useBreakpoint(){
  const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{ const h=()=>setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return { isMobile:w<768, isTablet:w<1024, w };
}

/* ─── Shared UI ──────────────────────────────────────────────── */
function GlowBtn({ children, onClick, small, outline, danger, full, style={} }){
  const bg = danger ? T.red : outline ? "transparent" : `linear-gradient(135deg,${T.purple},${T.purpleDim})`;
  const border = outline ? `1.5px solid ${T.purple}` : danger ? `1px solid ${T.red}` : "none";
  const shadow = outline||danger ? "none" : "0 4px 24px rgba(125,57,235,.45)";
  return(
    <button onClick={onClick} style={{
      padding:small?"9px 20px":"14px 32px", borderRadius:999, border,
      background:bg, color:"#fff", fontFamily:"inherit", fontWeight:700,
      fontSize:small?13:15, cursor:"pointer", letterSpacing:0.3,
      boxShadow:shadow, transition:"opacity .15s",
      width:full?"100%":"auto", ...style,
    }}
      onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
      onMouseLeave={e=>e.currentTarget.style.opacity="1"}
    >{children}</button>
  );
}

function Card({ children, style={}, glow=false, onClick }){
  return(
    <div onClick={onClick} style={{
      background:T.surface, borderRadius:20, border:`1px solid ${T.border}`,
      boxShadow:glow?"0 0 32px rgba(125,57,235,.12)":"none",
      cursor:onClick?"pointer":"default", ...style,
    }}>{children}</div>
  );
}

function GradientBorder({ children, radius=16, style={} }){
  return(
    <div style={{ padding:1.5, borderRadius:radius, background:"linear-gradient(90deg,rgba(125,57,235,.55),rgba(10,3,32,.55))", ...style }}>
      <div style={{ borderRadius:radius-1.5, overflow:"hidden", background:T.surface }}>{children}</div>
    </div>
  );
}

function ProgressBar({ value, color }){
  return(
    <div style={{ height:5, borderRadius:4, background:"rgba(255,255,255,.07)", overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.max(0,Math.min(1,value))*100}%`, background:color, borderRadius:4, transition:"width .4s" }} />
    </div>
  );
}

function Divider(){ return <div style={{ height:1, background:T.border, margin:"0" }} />; }

function Modal({ open, onClose, children, maxWidth=520 }){
  useEffect(()=>{ document.body.style.overflow=open?"hidden":""; return()=>{ document.body.style.overflow=""; }; },[open]);
  if(!open) return null;
  return(
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.75)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.surface,borderRadius:24,border:`1px solid ${T.border}`,width:"100%",maxWidth,maxHeight:"90vh",overflowY:"auto",animation:"fadeUp .25s ease" }}>
        {children}
      </div>
    </div>
  );
}

function Tag({ children, color }){
  return <span style={{ padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:700,background:`${color}22`,color }}>{children}</span>;
}

function SectionLabel({ children }){
  return <div style={{ fontSize:12,fontWeight:700,color:T.sub,letterSpacing:1,marginBottom:14,textTransform:"uppercase" }}>{children}</div>;
}

/* ─── Auth screens ───────────────────────────────────────────── */
function AuthModal({ open, onClose, onAuth }){
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({ name:"",email:"",password:"" });
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const submit = () => { if(form.email&&form.password) onAuth({ name: form.name||"Nour Ahmed", email:form.email }); };

  return(
    <Modal open={open} onClose={onClose} maxWidth={440}>
      <div style={{ padding:"36px 32px" }}>
        {/* Logo */}
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ fontSize:28,fontWeight:800,letterSpacing:-1 }}>
            <span style={{ color:T.purple }}>ez</span>rakna
          </div>
          <div style={{ color:T.sub,fontSize:14,marginTop:6 }}>
            {mode==="login" ? "Welcome back" : "Create your account"}
          </div>
        </div>

        <div style={{ display:"flex",gap:0,marginBottom:28,borderRadius:12,overflow:"hidden",border:`1px solid ${T.border}` }}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{
              flex:1, padding:"11px", border:"none", fontFamily:"inherit",
              background:mode===m?T.purple:"transparent",
              color:mode===m?"#fff":T.sub, fontWeight:700, fontSize:14, cursor:"pointer",
            }}>{m==="login"?"Log In":"Sign Up"}</button>
          ))}
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {mode==="signup" && (
            <input value={form.name} onChange={set("name")} placeholder="Full name"
              style={inputStyle} />
          )}
          <input value={form.email} onChange={set("email")} placeholder="Email address" type="email"
            style={inputStyle} />
          <input value={form.password} onChange={set("password")} placeholder="Password" type="password"
            style={inputStyle} />
        </div>

        {mode==="login" && (
          <div style={{ textAlign:"right",marginTop:8 }}>
            <button style={{ background:"none",border:"none",color:T.purple,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>Forgot password?</button>
          </div>
        )}

        <GlowBtn full onClick={submit} style={{ marginTop:24 }}>
          {mode==="login" ? "Log In →" : "Create Account →"}
        </GlowBtn>

        <div style={{ textAlign:"center",marginTop:16,fontSize:13,color:T.sub }}>
          {mode==="login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={()=>setMode(mode==="login"?"signup":"login")}
            style={{ background:"none",border:"none",color:T.purple,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>
            {mode==="login"?"Sign Up":"Log In"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
const inputStyle = {
  width:"100%", height:48, borderRadius:12, border:`1px solid ${T.border}`,
  background:"rgba(255,255,255,.04)", color:T.text, fontFamily:"inherit",
  fontSize:14, padding:"0 16px", outline:"none", boxSizing:"border-box",
};

/* ─── Landing ────────────────────────────────────────────────── */
function Landing({ onEnter, onAuthOpen, user }){
  const [scrolled,setScrolled]=useState(false);
  const [mobileMenu,setMobileMenu]=useState(false);
  const { isMobile }=useBreakpoint();

  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>40);
    window.addEventListener("scroll",h);
    return()=>window.removeEventListener("scroll",h);
  },[]);

  return(
    <div style={{ color:T.text }}>
      {/* Navbar */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,
        padding:`0 ${isMobile?"16px":"5%"}`, height:68,
        display:"flex",alignItems:"center",gap:16,
        background:scrolled?"rgba(7,0,26,.94)":"transparent",
        backdropFilter:scrolled?"blur(14px)":"none",
        borderBottom:scrolled?`1px solid ${T.border}`:"none",
        transition:"all .3s",
      }}>
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
      </nav>

      {/* Hero */}
      <section style={{ minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:`${isMobile?"110px 20px 80px":"120px 5% 80px"}`,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:"15%",left:"5%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(125,57,235,.16),transparent 70%)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",bottom:"10%",right:"5%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(125,57,235,.1),transparent 70%)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(125,57,235,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(125,57,235,.05) 1px,transparent 1px)`,backgroundSize:"60px 60px",pointerEvents:"none" }} />

        <span style={{ padding:"4px 14px",borderRadius:999,fontSize:12,fontWeight:700,background:`${T.purple}22`,color:T.purple }}>🚀 Live across Cairo & Giza</span>

        <h1 style={{ fontSize:`clamp(38px,7vw,88px)`,fontWeight:800,lineHeight:1.05,letterSpacing:-2,margin:"22px 0 18px",maxWidth:820 }}>
          Park smarter.<br />
          <span style={{ WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundImage:`linear-gradient(90deg,${T.purple},#C084FC,${T.purple})`,backgroundSize:"200% auto",animation:"shimmer 3s linear infinite" }}>
            Not harder.
          </span>
        </h1>

        <p style={{ fontSize:`clamp(15px,2vw,19px)`,color:T.sub,maxWidth:540,lineHeight:1.75,marginBottom:40 }}>
          Find, reserve and track parking across Cairo in seconds.
          No more circling. No more guessing.
        </p>

        <div style={{ display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center" }}>
          <GlowBtn onClick={()=>{ user?onEnter():onAuthOpen(); }}>
            {user?"Go to Dashboard":"Find Parking Now"}
          </GlowBtn>
          <GlowBtn outline onClick={()=>document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}>
            How It Works
          </GlowBtn>
        </div>

        <div style={{ marginTop:72,width:"100%",maxWidth:440,animation:"float 4s ease-in-out infinite" }}>
          <HeroCard />
        </div>
      </section>

      {/* Stats */}
      <div style={{ borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,padding:"36px 5%" }}>
        <div style={{ maxWidth:960,margin:"0 auto",display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:24 }}>
          {STATS.map(s=>(
            <div key={s.label} style={{ textAlign:"center" }}>
              <div style={{ fontSize:`clamp(28px,4vw,40px)`,fontWeight:800,color:T.purple,letterSpacing:-1 }}>{s.value}</div>
              <div style={{ fontSize:13,color:T.sub,marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={{ padding:`${isMobile?"64px 20px":"100px 5%"}` }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div style={{ textAlign:"center",marginBottom:60 }}>
            <span style={{ padding:"4px 14px",borderRadius:999,fontSize:12,fontWeight:700,background:`${T.green}22`,color:T.green }}>✦ Features</span>
            <h2 style={{ fontSize:`clamp(26px,4vw,52px)`,fontWeight:800,letterSpacing:-1,margin:"16px 0 10px" }}>Everything you need to park well</h2>
            <p style={{ color:T.sub,fontSize:16,maxWidth:480,margin:"0 auto" }}>Built for drivers who value their time.</p>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:`repeat(${isMobile?"1":isTabletVal()?"2":"4"},1fr)`,gap:20 }}>
            {FEATURES.map(f=>(
              <Card key={f.title} style={{ padding:28 }} glow>
                <div style={{ width:52,height:52,borderRadius:14,background:"rgba(125,57,235,.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:18 }}>{f.icon}</div>
                <div style={{ fontSize:17,fontWeight:700,marginBottom:10 }}>{f.title}</div>
                <div style={{ color:T.sub,fontSize:14,lineHeight:1.7 }}>{f.body}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding:`${isMobile?"64px 20px":"80px 5%"}`,background:"rgba(125,57,235,.04)",borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}` }}>
        <div style={{ maxWidth:900,margin:"0 auto",textAlign:"center" }}>
          <h2 style={{ fontSize:`clamp(26px,4vw,48px)`,fontWeight:800,letterSpacing:-1,marginBottom:56 }}>Three steps to a parked car</h2>
          <div style={{ display:"grid",gridTemplateColumns:`repeat(${isMobile?"1":"3"},1fr)`,gap:40 }}>
            {[
              { n:"01",title:"Search",body:"Enter your destination or browse spots. Filter by price, category or distance." },
              { n:"02",title:"Reserve",body:"Pick your slot, confirm your vehicle, and lock it in — under 30 seconds." },
              { n:"03",title:"Park",   body:"Drive in, track your session live, and end it remotely whenever you're done." },
            ].map(s=>(
              <div key={s.n}>
                <div style={{ width:56,height:56,borderRadius:28,border:`2px solid ${T.purple}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:13,fontWeight:800,color:T.purple,background:"rgba(125,57,235,.08)" }}>{s.n}</div>
                <div style={{ fontSize:20,fontWeight:700,marginBottom:10 }}>{s.title}</div>
                <div style={{ color:T.sub,fontSize:14,lineHeight:1.7 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations preview */}
      <section id="locations" style={{ padding:`${isMobile?"64px 20px":"100px 5%"}` }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:40,flexWrap:"wrap",gap:16 }}>
            <div>
              <span style={{ padding:"4px 14px",borderRadius:999,fontSize:12,fontWeight:700,background:`${T.amber}22`,color:T.amber }}>📍 Live Spots</span>
              <h2 style={{ fontSize:`clamp(24px,4vw,44px)`,fontWeight:800,letterSpacing:-1,marginTop:12 }}>Spots near you right now</h2>
            </div>
            <GlowBtn small onClick={()=>{ user?onEnter():onAuthOpen(); }}>View All →</GlowBtn>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:`repeat(${isMobile?"1":isTabletVal()?"2":"3"},1fr)`,gap:20 }}>
            {SPOTS.slice(0,3).map(s=>(
              <LandingCard key={s.id} s={s} onReserve={()=>{ user?onEnter():onAuthOpen(); }} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" style={{ padding:`${isMobile?"64px 20px":"100px 5%"}`,textAlign:"center" }}>
        <div style={{ maxWidth:640,margin:"0 auto" }}>
          <div style={{ fontSize:56,marginBottom:24 }}>🅿️</div>
          <h2 style={{ fontSize:`clamp(28px,4vw,56px)`,fontWeight:800,letterSpacing:-1.5,marginBottom:16 }}>Ready to park without the stress?</h2>
          <p style={{ color:T.sub,fontSize:17,marginBottom:40,lineHeight:1.7 }}>
            Join thousands of Cairo drivers. No subscription — pay only when you park.
          </p>
          <GlowBtn onClick={()=>{ user?onEnter():onAuthOpen(); }} style={{ fontSize:17,padding:"16px 48px" }}>
            {user?"Open Dashboard →":"Get Started Free →"}
          </GlowBtn>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:`1px solid ${T.border}`,padding:`20px ${isMobile?"20px":"5%"}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
        <div style={{ fontWeight:800,fontSize:18 }}><span style={{ color:T.purple }}>ez</span>rakna</div>
        <div style={{ color:T.sub,fontSize:13 }}>© 2025 ezrakna. Cairo, Egypt.</div>
        <div style={{ display:"flex",gap:20 }}>
          {["Privacy","Terms","Contact"].map(l=>(<a key={l} href="#" style={{ color:T.sub,fontSize:13,textDecoration:"none" }}>{l}</a>))}
        </div>
      </footer>
    </div>
  );
}

function isTabletVal(){ return typeof window!=="undefined" && window.innerWidth<1024 && window.innerWidth>=768; }

function HeroCard(){
  const elapsed=useTimer(3720);
  return(
    <Card glow style={{ padding:24,textAlign:"left",position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(125,57,235,.25),transparent 70%)",pointerEvents:"none" }} />
      <div style={{ fontSize:11,color:T.sub,letterSpacing:1,marginBottom:14 }}>ACTIVE SESSION</div>
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18 }}>
        <div style={{ width:40,height:40,borderRadius:12,background:"rgba(125,57,235,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>🅿️</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontWeight:700,fontSize:15 }}>Arkan Mall Parking</div>
          <div style={{ fontSize:12,color:T.sub }}>Sheikh Zayed, Giza</div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:5,flexShrink:0 }}>
          <div style={{ width:8,height:8,borderRadius:4,background:T.green,animation:"pls 1.5s infinite" }} />
          <span style={{ fontSize:12,color:T.green,fontWeight:600 }}>Live</span>
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
        <div style={{ padding:"12px 14px",borderRadius:12,background:"rgba(125,57,235,.08)",border:`1px solid rgba(125,57,235,.2)` }}>
          <div style={{ fontSize:11,color:T.sub,marginBottom:4 }}>ELAPSED</div>
          <div style={{ fontSize:22,fontWeight:800,color:T.purple,fontVariantNumeric:"tabular-nums",letterSpacing:-1 }}>{elapsed}</div>
        </div>
        <div style={{ padding:"12px 14px",borderRadius:12,background:"rgba(34,197,94,.06)",border:`1px solid rgba(34,197,94,.18)` }}>
          <div style={{ fontSize:11,color:T.sub,marginBottom:4 }}>EST. COST</div>
          <div style={{ fontSize:22,fontWeight:800,color:T.green,letterSpacing:-1 }}>EGP 50</div>
        </div>
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",marginTop:12,fontSize:12,color:T.sub }}>
        <span>Slot B4  •  Level 2</span><span>Started 09:30 PM</span>
      </div>
    </Card>
  );
}

function LandingCard({ s, onReserve }){
  const ac=availColor(s.available,s.total);
  const al=availLabel(s.available,s.total);
  const [hov,setHov]=useState(false);
  return(
    <Card style={{ overflow:"hidden",transition:"transform .2s,box-shadow .2s",transform:hov?"translateY(-4px)":"none",boxShadow:hov?"0 12px 40px rgba(125,57,235,.2)":"none" }}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{ height:120,background:"linear-gradient(135deg,rgba(125,57,235,.4),rgba(10,3,32,.9))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40 }}>🅿️</div>
      <div style={{ padding:"16px 18px 18px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
          <div>
            <div style={{ fontWeight:700,fontSize:15,marginBottom:2 }}>{s.name}</div>
            <div style={{ fontSize:12,color:T.sub }}>{s.address}</div>
          </div>
          <span style={{ fontSize:13,fontWeight:700,color:T.green,whiteSpace:"nowrap",marginLeft:8 }}>EGP {s.rate}/hr</span>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
            <span style={{ fontSize:12,color:ac,fontWeight:600 }}>{al}</span>
            <span style={{ fontSize:12,color:T.sub }}>{s.available}/{s.total} spots</span>
          </div>
          <ProgressBar value={1-(s.available/s.total)} color={ac} />
        </div>
        <GlowBtn full small onClick={onReserve}>Reserve a Spot →</GlowBtn>
      </div>
    </Card>
  );
}

/* ─── App shell ──────────────────────────────────────────────── */
function AppShell({ user, onLogout, onBack }){
  const [tab,setTab]=useState("find");
  const [booked,setBooked]=useState(null);
  const { isMobile, isTablet }=useBreakpoint();
  const [mobileNav,setMobileNav]=useState(false);

  const tabs=[
    { id:"find",    label:"Find Parking", icon:"🔍" },
    { id:"session", label:"My Session",   icon:"⏱",  dot:!!booked },
    { id:"wallet",  label:"Wallet",       icon:"💳" },
    { id:"history", label:"History",      icon:"🕐" },
    { id:"account", label:"Account",      icon:"👤" },
  ];

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
          <nav style={{ display:"flex",gap:4 }}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
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
          {!isMobile && <span style={{ fontSize:13,color:T.sub }}>{user.name}</span>}
          <button onClick={onLogout} style={{ background:"rgba(239,68,68,.1)",border:`1px solid rgba(239,68,68,.2)`,borderRadius:10,color:T.red,cursor:"pointer",padding:"6px 12px",fontSize:12,fontFamily:"inherit",whiteSpace:"nowrap" }}>Log out</button>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex:1,overflow:"auto" }}>
        {tab==="find"    && <FindTab onReserve={s=>{ setBooked(s); setTab("session"); }} />}
        {tab==="session" && <SessionTab spot={booked} onEnd={()=>{ setBooked(null); setTab("find"); }} />}
        {tab==="wallet"  && <WalletTab />}
        {tab==="history" && <HistoryTab />}
        {tab==="account" && <AccountTab user={user} onLogout={onLogout} />}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <div style={{ position:"sticky",bottom:0,display:"flex",borderTop:`1px solid ${T.border}`,background:"rgba(17,0,48,.97)",backdropFilter:"blur(12px)",zIndex:50 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
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
      )}
    </div>
  );
}

/* ─── Find & Reserve tab ─────────────────────────────────────── */
function FindTab({ onReserve }){
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");
  const [selected,setSelected]=useState(null);
  const [modal,setModal]=useState(false);
  const { isMobile }=useBreakpoint();
  const cats=["All","Mall","University","Airport","Street"];
  const filtered=SPOTS.filter(s=>(cat==="All"||s.category===cat)&&(s.name.toLowerCase().includes(search.toLowerCase())||s.address.toLowerCase().includes(search.toLowerCase())));

  return(
    <div style={{ display:"flex",height:isMobile?"auto":"calc(100vh - 64px)",flexDirection:isMobile?"column":"row" }}>

      {/* List panel */}
      <div style={{ width:isMobile?"100%":420,borderRight:isMobile?"none":`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0,borderBottom:isMobile?`1px solid ${T.border}`:"none" }}>
        <div style={{ padding:"20px 20px 0" }}>
          <div style={{ position:"relative",marginBottom:12 }}>
            <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:T.sub,pointerEvents:"none" }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or area..."
              style={{ ...inputStyle,paddingLeft:42,width:"100%" }} />
          </div>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",paddingBottom:14 }}>
            {cats.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{
                padding:"5px 14px",borderRadius:999,border:`1px solid ${cat===c?T.purple:T.border}`,
                background:cat===c?T.purple:"transparent",color:cat===c?"#fff":T.sub,
                fontSize:12,fontWeight:cat===c?700:400,cursor:"pointer",fontFamily:"inherit",
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ flex:1,overflowY:"auto",padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:12,maxHeight:isMobile?360:"none" }}>
          {filtered.map(s=>{
            const ac=availColor(s.available,s.total);
            const al=availLabel(s.available,s.total);
            const isSel=selected?.id===s.id;
            return(
              <div key={s.id} onClick={()=>{ setSelected(s); if(isMobile) setModal(true); }}
                style={{ borderRadius:16,border:`1.5px solid ${isSel?T.purple:T.border}`,background:isSel?"rgba(125,57,235,.1)":T.surface,cursor:"pointer",overflow:"hidden",transition:"all .15s",boxShadow:isSel?`0 0 20px rgba(125,57,235,.2)`:"none" }}>
                <div style={{ padding:"14px 14px 0" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                    <div style={{ flex:1,minWidth:0,marginRight:8 }}>
                      <div style={{ fontWeight:700,fontSize:14,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name}</div>
                      <div style={{ fontSize:12,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.address}</div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontSize:14,fontWeight:800,color:T.green }}>EGP {s.rate}<span style={{ fontSize:11,fontWeight:400,color:T.sub }}>/hr</span></div>
                      <div style={{ fontSize:11,color:T.sub }}>{s.distance} km</div>
                    </div>
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                      <span style={{ fontSize:12,color:ac,fontWeight:600 }}>{al}</span>
                      <span style={{ fontSize:12,color:T.sub }}>{s.available}/{s.total}</span>
                    </div>
                    <ProgressBar value={1-(s.available/s.total)} color={ac} />
                  </div>
                </div>
                <button onClick={e=>{ e.stopPropagation(); setSelected(s); setModal(true); }}
                  style={{ width:"100%",padding:"9px",border:"none",borderTop:`1px solid rgba(125,57,235,.2)`,background:"transparent",color:T.purple,fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                  View Details →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map area (desktop) */}
      {!isMobile && (
        <div style={{ flex:1,position:"relative",background:`radial-gradient(ellipse at 60% 40%,rgba(125,57,235,.1),transparent 60%),linear-gradient(180deg,rgba(17,0,48,.9),${T.dark})`,overflow:"hidden" }}>
          <div style={{ position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(125,57,235,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(125,57,235,.06) 1px,transparent 1px)`,backgroundSize:"48px 48px" }} />
          {!selected && (
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:T.sub }}>
              <span style={{ fontSize:48 }}>🗺</span>
              <span style={{ fontSize:15,fontWeight:600 }}>Select a location to preview</span>
            </div>
          )}
          {filtered.map((s,i)=>{
            const isSel=selected?.id===s.id;
            const ac=availColor(s.available,s.total);
            return(
              <div key={s.id} onClick={()=>setSelected(s)} style={{ position:"absolute",left:`${18+(i*15)%52}%`,top:`${22+(i*19)%46}%`,transform:"translate(-50%,-50%)",cursor:"pointer",zIndex:2 }}>
                <div style={{ padding:"5px 12px",borderRadius:999,fontWeight:700,fontSize:12,background:isSel?T.purple:"rgba(17,0,48,.92)",border:`1.5px solid ${isSel?T.purple:ac}`,color:isSel?"#fff":ac,boxShadow:isSel?`0 4px 20px rgba(125,57,235,.5)`:"0 2px 8px rgba(0,0,0,.4)",transition:"all .2s",whiteSpace:"nowrap" }}>
                  {s.name.split(" ")[0]}  EGP {s.rate}
                </div>
                <div style={{ width:8,height:8,borderRadius:4,background:isSel?T.purple:ac,margin:"3px auto 0" }} />
              </div>
            );
          })}
          {selected && <SpotDetailPanel spot={selected} onReserve={()=>onReserve(selected)} onClose={()=>setSelected(null)} />}
        </div>
      )}

      {/* Mobile: detail modal */}
      <Modal open={modal&&!!selected} onClose={()=>setModal(false)}>
        {selected && (
          <div style={{ padding:24 }}>
            <SpotDetailContent spot={selected} onReserve={()=>{ setModal(false); onReserve(selected); }} onClose={()=>setModal(false)} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function SpotDetailPanel({ spot, onReserve, onClose }){
  return(
    <div style={{ borderTop:`1px solid ${T.border}`,background:T.surface,padding:"24px 28px",animation:"slideUp .2s ease" }}>
      <SpotDetailContent spot={spot} onReserve={onReserve} onClose={onClose} />
    </div>
  );
}

function SpotDetailContent({ spot, onReserve, onClose }){
  const ac=availColor(spot.available,spot.total);
  return(
    <>
      <div style={{ display:"flex",alignItems:"flex-start",gap:14,marginBottom:18 }}>
        <div style={{ width:52,height:52,borderRadius:14,background:"rgba(125,57,235,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0 }}>🅿️</div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",justifyContent:"space-between" }}>
            <div>
              <div style={{ fontWeight:800,fontSize:17,marginBottom:2 }}>{spot.name}</div>
              <div style={{ fontSize:13,color:T.sub }}>{spot.address}</div>
            </div>
            <button onClick={onClose} style={{ background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:18,lineHeight:1 }}>✕</button>
          </div>
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16 }}>
        {[{ l:"Rate",v:`EGP ${spot.rate}/hr`,c:T.green },{ l:"Spots",v:`${spot.available}/${spot.total}`,c:ac },{ l:"Distance",v:`${spot.distance}km`,c:T.purple },{ l:"Hours",v:spot.hours,c:T.sub }].map(s=>(
          <div key={s.l} style={{ padding:"10px 8px",borderRadius:12,background:"rgba(255,255,255,.04)",border:`1px solid ${T.border}`,textAlign:"center" }}>
            <div style={{ fontSize:12,fontWeight:700,color:s.c,marginBottom:2 }}>{s.v}</div>
            <div style={{ fontSize:10,color:T.sub }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
          <span style={{ fontSize:13,color:T.sub }}>Occupancy</span>
          <span style={{ fontSize:13,color:ac,fontWeight:600 }}>{Math.round((1-spot.available/spot.total)*100)}% full</span>
        </div>
        <ProgressBar value={1-(spot.available/spot.total)} color={ac} />
      </div>
      {spot.available>0
        ? <GlowBtn full onClick={onReserve}>Reserve This Spot →</GlowBtn>
        : <div style={{ textAlign:"center",padding:14,borderRadius:999,background:"rgba(239,68,68,.08)",border:`1px solid rgba(239,68,68,.2)`,color:T.red,fontWeight:700 }}>Lot Full</div>
      }
    </>
  );
}

/* ─── Session Tab ────────────────────────────────────────────── */
function SessionTab({ spot, onEnd }){
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
        {[["Parking Slot","B4"],["Level & Gate","Level 2  •  Gate B"],["Vehicle","Toyota Corolla  •  BG 4567"],["Rate",`EGP ${spot.rate}/hr`],["Hours",spot.hours]].map(([l,v],i,arr)=>(
          <div key={l}>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 0" }}>
              <span style={{ color:T.sub,fontSize:14 }}>{l}</span>
              <span style={{ color:T.text,fontSize:14,fontWeight:600 }}>{v}</span>
            </div>
            {i<arr.length-1&&<Divider />}
          </div>
        ))}
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

/* ─── Wallet Tab ─────────────────────────────────────────────── */
function WalletTab(){
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

/* ─── History Tab ────────────────────────────────────────────── */
function HistoryTab(){
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
                {[["DATE",s.date],["DURATION",s.duration],["COST",s.cost]].map(([l,v])=>(
                  <div key={l}>
                    <div style={{ fontSize:10,color:T.sub,letterSpacing:.8,marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:13,fontWeight:600,color:l==="COST"?T.accent:T.text,textDecoration:s.status==="cancelled"&&l==="COST"?"line-through":"none",textDecorationColor:T.red }}>{v}</div>
                  </div>
                ))}
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
            {[["Location",receipt.name],["Address",receipt.address],["Date",receipt.date],["Duration",receipt.duration],["Vehicle","Toyota Corolla  •  BG 4567"],["Slot","Level 2 – B4"]].map(([l,v],i,arr)=>(
              <div key={l}>
                <div style={{ display:"flex",justifyContent:"space-between",padding:"9px 0" }}>
                  <span style={{ color:T.sub,fontSize:13 }}>{l}</span>
                  <span style={{ color:T.text,fontSize:13,fontWeight:600,textAlign:"right",maxWidth:"60%" }}>{v}</span>
                </div>
                {i<arr.length-1&&<Divider />}
              </div>
            ))}
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

/* ─── Account Tab ────────────────────────────────────────────── */
function AccountTab({ user, onLogout }){
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
          {[["18","Sessions"],["42h","Parked"],["2","Vehicles"]].map(([v,l])=>(
            <div key={l}><div style={{ fontSize:20,fontWeight:800,color:"#fff" }}>{v}</div><div style={{ fontSize:11,color:"rgba(255,255,255,.6)" }}>{l}</div></div>
          ))}
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

function Toggle(){
  const [on,setOn]=useState(true);
  return(
    <div onClick={()=>setOn(o=>!o)} style={{ width:40,height:22,borderRadius:11,background:on?T.purple:"#555",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0 }}>
      <div style={{ width:18,height:18,borderRadius:9,background:"#fff",position:"absolute",top:2,left:on?20:2,transition:"left .2s" }} />
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────────── */
export default function Ezrakna(){
  const [view,setView]=useState("landing");   // landing | app
  const [authOpen,setAuthOpen]=useState(false);
  const [user,setUser]=useState(null);

  const handleAuth = (u) => { setUser(u); setAuthOpen(false); setView("app"); };
  const handleLogout = () => { setUser(null); setView("landing"); };
  const handleEnter = () => { user ? setView("app") : setAuthOpen(true); };

  return(
    <div style={{ background:T.dark,minHeight:"100vh",color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html{font-family:'Sora',sans-serif;}
        body{background:#07001A;}
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
        a:hover{opacity:.8;}
        section{scroll-margin-top:68px;}
      `}</style>

      {view==="landing" && <Landing onEnter={handleEnter} onAuthOpen={()=>setAuthOpen(true)} user={user} />}
      {view==="app"     && <AppShell user={user} onLogout={handleLogout} onBack={()=>setView("landing")} />}

      <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onAuth={handleAuth} />
    </div>
  );
}