import React, { useState, useEffect } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import useTimer from "../hooks/useTimer";
import { SPOTS, availColor, availLabel } from "../data/spots";

import Navbar from "../components/layout/Navbar";
import GlowBtn from "../components/ui/GlowBtn";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";

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

/* ─── Landing ────────────────────────────────────────────────── */
export default function Landing({ onEnter, onAuthOpen, user }){
  const [scrolled,setScrolled]=useState(false);
  const [mobileMenu,setMobileMenu]=useState(false);
  const { isMobile }=useBreakpoint();

  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>40);
    window.addEventListener("scroll",h);
    return()=>window.removeEventListener("scroll",h);
  },[]);

  return(
    <div style={{ color:T.text, width:"100%", overflowX:"hidden" }}>
      {/* Navbar */}
      <Navbar scrolled={scrolled} isMobile={isMobile} user={user} onEnter={onEnter} onAuthOpen={onAuthOpen} />

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
          <GlowBtn onClick={onEnter}>
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
            <GlowBtn small onClick={onEnter}>View All →</GlowBtn>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:`repeat(${isMobile?"1":isTabletVal()?"2":"3"},1fr)`,gap:20 }}>
            {SPOTS.slice(0,3).map(s=>(
              <LandingCard key={s.id} s={s} onReserve={onEnter} />
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
