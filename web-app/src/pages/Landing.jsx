import React, { useState, useEffect, useRef } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import apiFetch from "../api/client";

// ─── constants ────────────────────────────────────────────────────────────────

const CYCLE_WORDS = ["Cairo", "Giza", "your city", "seconds"];

const CAROUSEL_FEATURES = [
  { num:"01", tag:"Live",    title:"Real-Time Availability",  desc:"Live occupancy from 2,847 sensors. See open spots before you leave home.",                viz:"circles" },
  { num:"02", tag:"Reserve", title:"Instant Reservation",     desc:"Guarantee availability at your chosen lot. Released automatically if you don't arrive.", viz:"cards"   },
  { num:"03", tag:"Route",   title:"Smart Navigation",        desc:"Turn-by-turn to your exact bay number — underground decks included.",                     viz:"diamond" },
  { num:"04", tag:"Pay",     title:"Digital Payments",        desc:"Auto-pay on exit. No machines, no tickets. Receipts emailed instantly.",                  viz:"paycard" },
  { num:"05", tag:"Track",   title:"Live Tracking",           desc:"Real-time session timer, smart alerts, and a one-tap extend if you need more time.",       viz:"ripple"  },
  { num:"06", tag:"AI",      title:"Plate Recognition",       desc:"AI cameras at the gate read your plate on entry and exit — fully hands-free.",             viz:"plate"   },
];

const HIW_STEPS = [
  { title:"Search.",  desc:"Nearby lots, live availability — find your spot before you leave." },
  { title:"Reserve.", desc:"Reserve availability at a lot. Arrival guaranteed, no specific bay locked." },
  { title:"Arrive.",  desc:"The gate reads your plate. No check-in, no ticket, no interaction needed." },
  { title:"Pay.",     desc:"Drive out. Session closes. Auto-pay — no cash, no machines." },
];

const BIZ_CARDS = [
  {
    title:"License plate recognition",
    desc:"99.6% accuracy under any light. Plates checked in 50ms, mapped to a driver session automatically.",
    svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><rect x="3" y="7" width="18" height="11" rx="2"/><path d="M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2M7 12h2M11 12h2M15 12h2"/></svg>,
  },
  {
    title:"Real-time occupancy",
    desc:"Stream every bay. Per-floor, per-zone, per-lane — visible in your dashboard or pushed to Ezrakna's network.",
    svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/><circle cx="12" cy="12" r="4"/></svg>,
  },
  {
    title:"Automated billing",
    desc:"Settle with drivers, partners, and ride-hails through one ledger. Daily payouts, monthly statements.",
    svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1.5" fill="currentColor"/></svg>,
  },
  {
    title:"Analytics dashboard",
    desc:"Demand by hour, revenue by zone, churn by entry — exportable to BI tools or stored in Ezrakna's data lake.",
    svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>,
  },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function Reveal({ children, delay=0, direction="up", style={} }){
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const obs = new IntersectionObserver(([e])=>{ setVis(e.isIntersecting); },{ threshold:0.12 });
    obs.observe(el);
    return ()=>obs.disconnect();
  },[]);
  const from = direction==="up"?"translateY(40px)":direction==="down"?"translateY(-40px)":direction==="left"?"translateX(-40px)":"translateX(40px)";
  return (
    <div ref={ref} style={{
      opacity:vis?1:0,
      transform:vis?"translate(0,0)":from,
      transition:`opacity .9s cubic-bezier(.22,1,.36,1) ${delay}ms,transform .9s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

function Counter({ target, suffix="", duration=1600 }){
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const timer = useRef(null);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const obs = new IntersectionObserver(([e])=>{
      if(e.isIntersecting){
        clearInterval(timer.current);
        let cur=0; const steps=60, inc=target/steps;
        timer.current = setInterval(()=>{
          cur+=inc;
          if(cur>=target){ setCount(target); clearInterval(timer.current); }
          else setCount(Math.floor(cur));
        }, duration/steps);
      } else { clearInterval(timer.current); setCount(0); }
    },{ threshold:0.4 });
    obs.observe(el);
    return ()=>{ obs.disconnect(); clearInterval(timer.current); };
  },[target,duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── viz SVGs for carousel ────────────────────────────────────────────────────

function VizCircles(){
  return (
    <svg viewBox="0 0 140 140" style={{width:"100%",height:"100%",overflow:"visible"}}>
      <defs>
        <linearGradient id="vG1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B2A8D2"/><stop offset="100%" stopColor="#7D39EB"/>
        </linearGradient>
        <radialGradient id="vG2">
          <stop offset="0%" stopColor="#B2A8D2" stopOpacity="0.9"/>
          <stop offset="60%" stopColor="#7D39EB" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#4A1A9E" stopOpacity="0.5"/>
        </radialGradient>
      </defs>
      <style>{`
        .vr1{stroke:url(#vG1);stroke-width:1.4;fill:none;transform-origin:70px 70px;animation:rp 3s ease-in-out infinite}
        .vr2{stroke:url(#vG1);stroke-width:1.4;fill:none;transform-origin:70px 70px;animation:rp 3s ease-in-out -1s infinite}
        .vr3{stroke:url(#vG1);stroke-width:1.4;fill:none;transform-origin:70px 70px;animation:rp 3s ease-in-out -2s infinite}
        .vc{fill:url(#vG2);transform-origin:70px 70px;animation:cp 2.5s ease-in-out infinite}
        @keyframes rp{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
        @keyframes cp{0%,100%{transform:scale(1);filter:drop-shadow(0 0 12px rgba(125,57,235,.7))}50%{transform:scale(1.15);filter:drop-shadow(0 0 24px rgba(125,57,235,1))}}
      `}</style>
      <circle className="vr1" cx="70" cy="70" r="60"/>
      <circle className="vr2" cx="70" cy="70" r="42"/>
      <circle className="vr3" cx="70" cy="70" r="24"/>
      <circle className="vc" cx="70" cy="70" r="10"/>
    </svg>
  );
}
function VizCards(){
  return (
    <svg viewBox="0 0 140 140" style={{width:"100%",height:"100%",overflow:"visible"}}>
      <defs>
        <radialGradient id="vG2b">
          <stop offset="0%" stopColor="#B2A8D2" stopOpacity="0.9"/>
          <stop offset="60%" stopColor="#7D39EB" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#4A1A9E" stopOpacity="0.5"/>
        </radialGradient>
      </defs>
      <style>{`
        .vca{fill:url(#vG2b);stroke:rgba(125,57,235,.6);stroke-width:1;transform-origin:70px 70px;animation:cst 4s ease-in-out infinite}
        .vcb{fill:url(#vG2b);stroke:rgba(125,57,235,.6);stroke-width:1;opacity:.7;transform-origin:70px 70px;animation:cst 4s ease-in-out -1.3s infinite}
        .vcc{fill:url(#vG2b);stroke:rgba(125,57,235,.6);stroke-width:1;opacity:.4;transform-origin:70px 70px;animation:cst 4s ease-in-out -2.6s infinite}
        @keyframes cst{0%,100%{transform:rotate(-6deg) translateY(0)}50%{transform:rotate(6deg) translateY(-4px)}}
      `}</style>
      <rect className="vcc" x="22" y="36" width="96" height="68" rx="12"/>
      <rect className="vcb" x="22" y="36" width="96" height="68" rx="12"/>
      <rect className="vca" x="22" y="36" width="96" height="68" rx="12"/>
      <path d="M50 70 l12 12 l28-28" stroke="#F0EAFA" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function VizDiamond(){
  return (
    <svg viewBox="0 0 140 140" style={{width:"100%",height:"100%",overflow:"visible"}}>
      <defs>
        <linearGradient id="vG3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B2A8D2"/><stop offset="100%" stopColor="#7D39EB"/>
        </linearGradient>
        <radialGradient id="vG2c">
          <stop offset="0%" stopColor="#B2A8D2" stopOpacity="0.9"/>
          <stop offset="60%" stopColor="#7D39EB" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#4A1A9E" stopOpacity="0.5"/>
        </radialGradient>
      </defs>
      <style>{`.vdm{transform-origin:70px 70px;animation:ss 12s linear infinite}@keyframes ss{to{transform:rotate(360deg)}}`}</style>
      <g className="vdm">
        <rect x="35" y="35" width="70" height="70" rx="10" transform="rotate(45 70 70)" fill="url(#vG2c)" stroke="rgba(125,57,235,.6)" strokeWidth="1"/>
      </g>
      <path d="M55 78L70 55L85 78M70 55L70 92" stroke="url(#vG3)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function VizPayCard(){
  return (
    <svg viewBox="0 0 140 140" style={{width:"100%",height:"100%",overflow:"visible"}}>
      <defs>
        <radialGradient id="vG2d">
          <stop offset="0%" stopColor="#B2A8D2" stopOpacity="0.9"/>
          <stop offset="60%" stopColor="#7D39EB" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#4A1A9E" stopOpacity="0.5"/>
        </radialGradient>
        <linearGradient id="vGGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0EAFA"/><stop offset="100%" stopColor="#B2A8D2"/>
        </linearGradient>
      </defs>
      <style>{`.vpcg{transform-origin:70px 70px;animation:cf 5s ease-in-out infinite}@keyframes cf{0%,100%{transform:rotate(-8deg) translateY(0)}50%{transform:rotate(-2deg) translateY(-6px)}}`}</style>
      <g className="vpcg">
        <rect x="20" y="38" width="100" height="64" rx="10" fill="url(#vG2d)" stroke="rgba(125,57,235,.6)" strokeWidth="1"/>
        <rect x="20" y="50" width="100" height="9" fill="rgba(125,57,235,.3)"/>
        <rect x="32" y="72" width="18" height="14" rx="2" fill="url(#vGGold)"/>
        <circle cx="100" cy="86" r="6" fill="rgba(125,57,235,.7)"/>
        <circle cx="90" cy="86" r="6" fill="rgba(178,168,210,.5)"/>
      </g>
    </svg>
  );
}
function VizRipple(){
  return (
    <svg viewBox="0 0 140 140" style={{width:"100%",height:"100%",overflow:"visible"}}>
      <defs>
        <linearGradient id="vG4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B2A8D2"/><stop offset="100%" stopColor="#7D39EB"/>
        </linearGradient>
        <radialGradient id="vG2e">
          <stop offset="0%" stopColor="#B2A8D2" stopOpacity="0.9"/>
          <stop offset="60%" stopColor="#7D39EB" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#4A1A9E" stopOpacity="0.5"/>
        </radialGradient>
      </defs>
      <style>{`
        .vrp{fill:none;stroke:url(#vG4);stroke-width:1.6;transform-origin:70px 70px;animation:ra 2.4s ease-out infinite;opacity:0}
        .vrp2{animation-delay:-.8s}.vrp3{animation-delay:-1.6s}
        @keyframes ra{0%{transform:scale(.3);opacity:1}100%{transform:scale(1.8);opacity:0}}
      `}</style>
      <circle className="vrp" cx="70" cy="70" r="28"/>
      <circle className="vrp vrp2" cx="70" cy="70" r="28"/>
      <circle className="vrp vrp3" cx="70" cy="70" r="28"/>
      <circle cx="70" cy="70" r="14" fill="url(#vG2e)"/>
    </svg>
  );
}
function VizPlate(){
  return (
    <svg viewBox="0 0 140 140" style={{width:"100%",height:"100%",overflow:"visible"}}>
      <defs>
        <radialGradient id="vG2f">
          <stop offset="0%" stopColor="#B2A8D2" stopOpacity="0.9"/>
          <stop offset="60%" stopColor="#7D39EB" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#4A1A9E" stopOpacity="0.5"/>
        </radialGradient>
        <linearGradient id="vG5" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#B2A8D2"/><stop offset="100%" stopColor="#7D39EB"/>
        </linearGradient>
      </defs>
      <style>{`.vsb{fill:rgba(125,57,235,.28);animation:sb 2.2s ease-in-out infinite}@keyframes sb{0%{transform:translateY(-20px);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateY(20px);opacity:0}}`}</style>
      <rect x="22" y="50" width="96" height="40" rx="6" fill="url(#vG2f)" stroke="rgba(125,57,235,.6)" strokeWidth="1"/>
      <rect x="33" y="62" width="7" height="16" rx="2" fill="rgba(178,168,210,.45)"/>
      <rect x="45" y="62" width="5" height="16" rx="2" fill="rgba(178,168,210,.45)"/>
      <rect x="55" y="62" width="9" height="16" rx="2" fill="rgba(178,168,210,.45)"/>
      <rect x="70" y="62" width="5" height="16" rx="2" fill="rgba(178,168,210,.45)"/>
      <rect x="80" y="62" width="7" height="16" rx="2" fill="rgba(178,168,210,.45)"/>
      <rect x="92" y="62" width="6" height="16" rx="2" fill="rgba(178,168,210,.45)"/>
      <rect className="vsb" x="22" y="64" width="96" height="5" rx="2"/>
      <path d="M22 60L22 50L32 50M118 60L118 50L108 50M22 80L22 90L32 90M118 80L118 90L108 90" stroke="url(#vG5)" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}
const VIZ = { circles:VizCircles, cards:VizCards, diamond:VizDiamond, paycard:VizPayCard, ripple:VizRipple, plate:VizPlate };

// ─── features carousel ────────────────────────────────────────────────────────

function FeaturesCarousel({ isMobile }){
  const N = CAROUSEL_FEATURES.length;
  const [center, setCenter] = useState(0);
  const [entered, setEntered] = useState(false);
  const ref = useRef(null);

  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting) setEntered(true); },{ threshold:0.2 });
    obs.observe(el); return ()=>obs.disconnect();
  },[]);

  // Auto-advance every 4s
  useEffect(()=>{
    const id = setInterval(()=>{ setCenter(c=>(c+1)%N); }, 4000);
    return ()=>clearInterval(id);
  },[N]);

  function layout(i){
    let offset = ((i - center) + N) % N;
    let pos = offset <= N/2 ? offset : offset - N;
    return {
      tx: pos * (isMobile ? 240 : 420),
      tz: -Math.abs(pos) * 280,
      ry: pos * -22,
      sc: 1 - Math.abs(pos) * 0.08,
      op: 1 - Math.abs(pos) * 0.28,
      zi: N - Math.abs(pos),
      isCenter: pos === 0,
    };
  }

  return (
    <div ref={ref} style={{position:"relative",height:520,perspective:"1800px",overflow:"visible",margin:"0 auto"}}>
      {/* arrows */}
      {[{side:"left",icon:"M15 6l-6 6 6 6",dir:-1},{side:"right",icon:"M9 6l6 6-6 6",dir:1}].map(({side,icon,dir})=>(
        <button key={side} onClick={()=>setCenter(c=>(c+dir+N)%N)} style={{
          position:"absolute",top:"50%",transform:"translateY(-50%)",
          [side]: isMobile ? 0 : 24,
          width:54,height:54,borderRadius:"50%",
          background:"rgba(22,0,55,.65)",border:"1px solid rgba(125,57,235,.22)",
          backdropFilter:"blur(10px)",color:T.text,cursor:"pointer",
          display:"grid",placeItems:"center",zIndex:10,
          transition:"background .25s,border-color .25s",
        }}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(125,57,235,.25)";e.currentTarget.style.borderColor=T.purple;}}
        onMouseLeave={e=>{e.currentTarget.style.background="rgba(22,0,55,.65)";e.currentTarget.style.borderColor="rgba(125,57,235,.22)";}}>
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon}/>
          </svg>
        </button>
      ))}

      {/* cards */}
      <div style={{position:"absolute",inset:0,transformStyle:"preserve-3d",transform:"rotateX(2deg)"}}>
        {CAROUSEL_FEATURES.map((f,i)=>{
          const l = layout(i);
          const Viz = VIZ[f.viz];
          return (
            <div key={i} onClick={()=>setCenter(i)} style={{
              position:"absolute",left:"50%",top:"50%",
              width:380,height:480,
              marginLeft:-190,marginTop:-240,
              borderRadius:28,
              background:"linear-gradient(180deg,rgba(22,0,55,.78),rgba(10,0,32,.78))",
              border:`1px solid ${l.isCenter?"rgba(125,57,235,.55)":"rgba(125,57,235,.22)"}`,
              backdropFilter:"blur(14px)",
              padding:"44px 36px 36px",
              display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",
              cursor:"pointer",
              transform:`translate3d(${l.tx}px,${entered?0:60}px,${l.tz}px) rotateY(${l.ry}deg) scale(${l.sc})`,
              opacity: entered ? l.op : 0,
              zIndex:l.zi,
              transition:`transform .85s cubic-bezier(.22,1,.36,1) ${i*0.05}s,opacity .65s ease ${i*0.05}s,border-color .35s`,
              boxShadow: l.isCenter
                ? "0 40px 80px -20px rgba(0,0,0,.65),0 0 100px -10px rgba(125,57,235,.45)"
                : "0 30px 60px -20px rgba(0,0,0,.45)",
            }}>
              <div style={{width:140,height:140,marginBottom:32,filter:"drop-shadow(0 0 22px rgba(125,57,235,.55))"}}>
                <Viz/>
              </div>
              <div style={{fontFamily:"'Geist Mono',monospace",fontSize:11,color:l.isCenter?T.purple:T.sub,letterSpacing:".22em",textTransform:"uppercase",marginBottom:14}}>
                {f.num} · {f.tag}
              </div>
              <h3 style={{fontSize:26,fontWeight:600,letterSpacing:"-.02em",color:T.text,lineHeight:1.15,maxWidth:"14ch",marginBottom:14}}>{f.title}</h3>
              <p style={{color:T.sub,fontSize:14,lineHeight:1.55,maxWidth:"30ch"}}>{f.desc}</p>
            </div>
          );
        })}
      </div>

      {/* dots */}
      <div style={{position:"absolute",left:"50%",bottom:-50,transform:"translateX(-50%)",display:"flex",gap:10,zIndex:10}}>
        {CAROUSEL_FEATURES.map((_,i)=>(
          <button key={i} onClick={()=>setCenter(i)} style={{
            width: i===center ? 28 : 8,
            height:8,borderRadius:999,border:"none",cursor:"pointer",padding:0,
            background: i===center ? T.purple : "rgba(125,57,235,.18)",
            boxShadow: i===center ? "0 0 14px rgba(125,57,235,.7)" : "none",
            transition:"width .3s,background .3s",
          }}/>
        ))}
      </div>
    </div>
  );
}

// ─── how it works isometric grid ──────────────────────────────────────────────

function IsoGrid({ step }){
  // step 0: show base grid, step 1: one cell reserved, step 2: reserved→confirmed, step 3: pay vis
  const cells = [
    {s:"occupied"},{s:"available"},{s:"occupied"},
    {s:"available"},{s:"occupied"},{s:"available"},
    {s:"occupied"},{s:"available"},{s:"occupied"},
  ];
  // override slot 1 for step≥1
  if(step===1) cells[1].s = "reserved";
  if(step===2) cells[1].s = "confirmed";
  if(step===3) cells[1].s = "confirmed";

  return (
    <div style={{perspective:"1100px",perspectiveOrigin:"50% 40%",display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>
      <div style={{
        transform:"rotateX(52deg) rotateZ(-42deg)",
        transformStyle:"preserve-3d",
        animation:"hiwIsoFloat 7s ease-in-out infinite",
        position:"relative",
      }}>
        <style>{`
          @keyframes hiwIsoFloat{0%{transform:rotateX(52deg) rotateZ(-42deg) translateY(0) scale(1)}33%{transform:rotateX(54deg) rotateZ(-40deg) translateY(-8px) scale(1.02)}66%{transform:rotateX(50deg) rotateZ(-44deg) translateY(-14px) scale(1.01)}100%{transform:rotateX(52deg) rotateZ(-42deg) translateY(0) scale(1)}}
          @keyframes hiwDotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
          @keyframes cellPulseR{0%,100%{box-shadow:0 0 32px rgba(125,57,235,.7),inset 0 1px 0 rgba(255,255,255,.2)}50%{box-shadow:0 0 54px rgba(125,57,235,.95),inset 0 1px 0 rgba(255,255,255,.32)}}
          @keyframes cellPulseC{0%,100%{box-shadow:0 0 32px rgba(34,197,94,.7),inset 0 1px 0 rgba(255,255,255,.2)}50%{box-shadow:0 0 54px rgba(34,197,94,.95),inset 0 1px 0 rgba(255,255,255,.32)}}
        `}</style>
        <div style={{position:"absolute",top:"8%",left:"4%",right:"4%",bottom:"-6%",background:"radial-gradient(ellipse,rgba(125,57,235,.18) 0%,transparent 70%)",transform:"translateZ(-2px)"}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,80px)",gap:10,transformStyle:"preserve-3d"}}>
          {cells.map((c,i)=>{
            const isOcc = c.s==="occupied";
            const isAvail = c.s==="available";
            const isRes = c.s==="reserved";
            const isConf = c.s==="confirmed";
            const bg = isOcc
              ? "linear-gradient(140deg,rgba(160,80,255,.34),rgba(105,32,205,.22))"
              : isAvail
              ? "linear-gradient(140deg,rgba(55,218,105,.26),rgba(20,165,68,.16))"
              : isRes
              ? "linear-gradient(140deg,rgba(170,88,255,.5),rgba(118,36,220,.38))"
              : "linear-gradient(140deg,rgba(68,228,118,.5),rgba(20,178,78,.38))";
            const border = isOcc?"rgba(125,57,235,.52)":isAvail?"rgba(34,197,94,.46)":isRes?"rgba(125,57,235,.9)":"rgba(34,197,94,.9)";
            const anim = isRes?"cellPulseR 1.5s ease-in-out infinite":isConf?"cellPulseC 1.5s ease-in-out infinite":"none";
            return (
              <div key={i} style={{
                width:80,height:80,borderRadius:8,
                background:bg,
                border:`1px solid ${border}`,
                boxShadow: isRes||isConf?"0 0 32px rgba(125,57,235,.5)":"0 0 16px rgba(34,197,94,.1)",
                animation:anim,
                display:"flex",alignItems:"center",justifyContent:"center",
                position:"relative",
              }}>
                {isOcc && <div style={{position:"absolute",inset:"12px 14px",background:"linear-gradient(160deg,rgba(158,88,255,.72),rgba(102,28,205,.56))",borderRadius:5,boxShadow:"inset 0 2px 4px rgba(0,0,0,.32)"}}/>}
                {isAvail && <div style={{width:10,height:10,borderRadius:"50%",background:"#22C55E",boxShadow:"0 0 10px #22C55E",animation:"hiwDotPulse 1.8s ease-in-out infinite"}}/>}
                {isRes && <div style={{width:10,height:10,borderRadius:"50%",background:T.purple,boxShadow:`0 0 14px ${T.purple}`}}/>}
                {isConf && <div style={{width:10,height:10,borderRadius:"50%",background:"#22C55E",boxShadow:"0 0 14px #22C55E"}}/>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── location card (real data) ────────────────────────────────────────────────

function LocationCard({ s, onViewDetails, index=0 }){
  const [hov, setHov] = useState(false);
  const pct = s.total > 0 ? s.available / s.total : 0;
  const statusLabel = pct > 0.5 ? "Available" : pct > 0.2 ? "Limited" : "Full";
  const statusColor = pct > 0.5 ? "#22C55E" : pct > 0.2 ? "#F59E0B" : "#EF4444";
  const statusBg = pct > 0.5 ? "rgba(34,197,94,.18)" : pct > 0.2 ? "rgba(245,158,11,.18)" : "rgba(239,68,68,.18)";
  const statusBorder = pct > 0.5 ? "rgba(34,197,94,.35)" : pct > 0.2 ? "rgba(245,158,11,.35)" : "rgba(239,68,68,.35)";

  return (
    <Reveal delay={index * 120}>
      <div
        onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{
          borderRadius:22,overflow:"hidden",
          background:"linear-gradient(180deg,rgba(22,0,55,.5),rgba(10,0,32,.5))",
          border:`1px solid ${hov?"rgba(125,57,235,.7)":T.border}`,
          transform:hov?"translateY(-8px)":"translateY(0)",
          boxShadow:hov?"0 30px 60px -20px rgba(0,0,0,.5),0 0 60px -8px rgba(125,57,235,.45)":"none",
          transition:"border-color .35s,transform .35s,box-shadow .35s",
          cursor:"pointer",display:"flex",flexDirection:"column",
        }}>

        {/* image / placeholder */}
        <div style={{height:180,position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#160037,#0a0020)",borderBottom:`1px solid ${T.border}`}}>
          {s.imageUrl && (
            <img src={s.imageUrl} alt={s.name} onError={e=>e.target.style.display="none"}
              style={{width:"100%",height:"100%",objectFit:"cover",transform:hov?"scale(1.06)":"scale(1)",transition:"transform .5s"}}/>
          )}
          {/* grid overlay */}
          <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(125,57,235,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(125,57,235,.08) 1px,transparent 1px)",backgroundSize:"24px 24px",maskImage:"radial-gradient(ellipse at center,black,transparent 80%)",WebkitMaskImage:"radial-gradient(ellipse at center,black,transparent 80%)"}}/>
          {/* status badge */}
          <span style={{position:"absolute",top:14,right:14,display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,fontSize:10,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",background:statusBg,color:statusColor,border:`1px solid ${statusBorder}`,backdropFilter:"blur(8px)"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"currentColor",boxShadow:"0 0 8px currentColor"}}/>
            {statusLabel}
          </span>
        </div>

        {/* body */}
        <div style={{padding:26,display:"flex",flexDirection:"column",flex:1}}>
          <h3 style={{fontSize:22,fontWeight:600,color:T.text,letterSpacing:"-.02em",lineHeight:1.2,marginBottom:6}}>{s.name}</h3>
          <p style={{fontSize:13,color:T.sub}}>{s.address}</p>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:28,paddingTop:20,borderTop:`1px solid ${T.border}`,gap:16}}>
            <div>
              <div style={{fontSize:10,color:T.sub,textTransform:"uppercase",letterSpacing:".16em",fontWeight:500,marginBottom:6}}>Rate</div>
              <div style={{fontFamily:"'Geist Mono',monospace",fontSize:22,color:T.text,fontWeight:500,lineHeight:1}}>
                {s.rate===0?"Free":<>EGP {s.rate}<span style={{fontSize:11,color:T.sub,marginLeft:3}}>/hr</span></>}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:T.sub,textTransform:"uppercase",letterSpacing:".16em",fontWeight:500,marginBottom:6}}>Spots</div>
              <div style={{fontFamily:"'Geist Mono',monospace",fontSize:22,color:T.text,fontWeight:500,lineHeight:1}}>
                {s.available}<span style={{color:T.sub,fontSize:"0.7em",marginLeft:1}}>/{s.total}</span>
              </div>
            </div>
          </div>
          <div onClick={()=>onViewDetails(s)} style={{marginTop:20,display:"flex",alignItems:"center",justifyContent:"space-between",color:hov?T.purple:T.text,fontSize:13,fontWeight:500,transition:"color .2s"}}>
            View details
            <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform:hov?"translateX(4px)":"translateX(0)",transition:"transform .25s"}}>
              <path d="M3 8h10M9 4l4 4-4 4"/>
            </svg>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ─── HIW 3D: Phone (step 0 — Search) ─────────────────────────────────────────

function HiwPhone({ active }){
  return (
    <div style={{perspective:"1000px",perspectiveOrigin:"50% 40%",display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>
      <div style={{
        width:200,height:400,
        transformStyle:"preserve-3d",
        transform:"rotateZ(14deg)",
        animation:"phone3dFloat 6s ease-in-out infinite",
        position:"relative",
      }}>
        {/* Front */}
        <div style={{position:"absolute",width:200,height:400,borderRadius:32,background:"linear-gradient(160deg,#1e0048,#0d0025)",border:"1.5px solid rgba(125,57,235,.65)",boxShadow:"0 0 0 1px rgba(255,255,255,.07) inset,0 36px 80px -18px rgba(0,0,0,.75),0 0 60px -6px rgba(125,57,235,.5)",transform:"translateZ(9px)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{width:62,height:6,borderRadius:3,background:"rgba(125,57,235,.4)",margin:"10px auto 0",flexShrink:0}}/>
          <div style={{flex:1,margin:"7px 6px 0",borderRadius:"16px 16px 0 0",overflow:"hidden",background:"#090019",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px 6px",background:"rgba(125,57,235,.09)",borderBottom:"1px solid rgba(125,57,235,.14)",flexShrink:0}}>
              <span style={{fontFamily:"'Geist Mono',monospace",fontSize:9,color:T.sub}}>09:41</span>
              <span style={{fontSize:10,fontWeight:600,color:T.text}}>Ezrakna</span>
              <span style={{width:5,height:5,borderRadius:"50%",background:"#22C55E",boxShadow:"0 0 5px #22C55E"}}/>
            </div>
            <div style={{flex:1,position:"relative",overflow:"hidden",background:"linear-gradient(180deg,#0c0028,#07001a)"}}>
              <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(125,57,235,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(125,57,235,.07) 1px,transparent 1px)",backgroundSize:"16px 16px",transform:"perspective(180px) rotateX(28deg) scale(1.3) translateY(8%)",transformOrigin:"center top",maskImage:"radial-gradient(ellipse at center,black 35%,transparent 75%)",WebkitMaskImage:"radial-gradient(ellipse at center,black 35%,transparent 75%)"}}/>
              {[{l:"18%",t:"30%",type:"t"},{l:"40%",t:"22%",type:"sel"},{l:"62%",t:"32%",type:"t"},{l:"22%",t:"57%",type:"t"},{l:"64%",t:"60%",type:"a"},{l:"44%",t:"64%",type:"t"}].map((s,i)=>(
                <div key={i} style={{position:"absolute",width:13,height:9,borderRadius:2,transform:"translate(-50%,-50%)",left:s.l,top:s.t,
                  background:s.type==="t"?"rgba(239,68,68,.28)":s.type==="sel"?"rgba(125,57,235,.5)":"rgba(34,197,94,.28)",
                  border:s.type==="t"?"1px solid rgba(239,68,68,.5)":s.type==="sel"?"1.5px solid rgba(125,57,235,.9)":"1px solid rgba(34,197,94,.5)",
                  boxShadow:s.type==="sel"?"0 0 12px rgba(125,57,235,.7)":"none",
                  animation:s.type==="sel"?"psSel 1.4s ease-in-out infinite":"none",
                }}/>
              ))}
              <div style={{position:"absolute",left:"52%",top:"48%",width:9,height:9,borderRadius:"50%",background:T.purple,transform:"translate(-50%,-50%)",boxShadow:"0 0 0 3px rgba(125,57,235,.22),0 0 10px rgba(125,57,235,.6)"}}/>
              {active && (
                <div style={{position:"absolute",left:"38%",top:"8%",background:"rgba(14,0,40,.92)",border:"1px solid rgba(125,57,235,.65)",borderRadius:7,padding:"4px 7px",fontSize:7,color:T.text,lineHeight:1.5,whiteSpace:"nowrap",boxShadow:"0 3px 14px rgba(125,57,235,.3)"}}>
                  <strong>P2 · Available</strong><br/><span style={{color:T.sub}}>3 min away</span>
                </div>
              )}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,margin:5,padding:"6px 8px",background:"rgba(125,57,235,.1)",border:"1px solid rgba(125,57,235,.2)",borderRadius:8,flexShrink:0}}>
              <svg viewBox="0 0 14 14" width={10} height={10} fill="none" stroke={T.sub} strokeWidth="1.6" strokeLinecap="round"><circle cx="5.5" cy="5.5" r="3.5"/><path d="M9 9l2 2"/></svg>
              <span style={{fontSize:7,color:T.sub}}>Find parking…</span>
            </div>
          </div>
          <div style={{height:18,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:42,height:3,borderRadius:2,background:"rgba(125,57,235,.28)"}}/>
          </div>
        </div>
        {/* Back */}
        <div style={{position:"absolute",width:200,height:400,borderRadius:32,background:"linear-gradient(160deg,#120030,#080018)",border:"1px solid rgba(125,57,235,.2)",transform:"translateZ(-9px) rotateY(180deg)"}}/>
        {/* Left */}
        <div style={{position:"absolute",width:18,height:400,background:"linear-gradient(90deg,rgba(74,26,158,.75),rgba(40,10,100,.5))",transform:"rotateY(-90deg) translateZ(0)",left:0,top:0}}/>
        {/* Right */}
        <div style={{position:"absolute",width:18,height:400,background:"linear-gradient(90deg,rgba(40,10,100,.5),rgba(74,26,158,.75))",transform:"rotateY(90deg) translateZ(0)",right:0,top:0}}/>
        {/* Top */}
        <div style={{position:"absolute",width:200,height:18,background:"rgba(74,26,158,.65)",transform:"rotateX(90deg) translateZ(0)",top:0,left:0}}/>
        {/* Bottom */}
        <div style={{position:"absolute",width:200,height:18,background:"rgba(40,10,100,.65)",transform:"rotateX(-90deg) translateZ(0)",bottom:0,left:0}}/>
      </div>
    </div>
  );
}

// ─── HIW 3D: Gate (step 2 — Arrive) ──────────────────────────────────────────

function HiwGate({ active }){
  const [scanning, setScanning] = useState(false);
  const [camGreen, setCamGreen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [armOpen, setArmOpen] = useState(false);
  const [badgeShow, setBadgeShow] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  useEffect(()=>{
    if(!active){
      const reset = setTimeout(()=>{
        setScanning(false); setCamGreen(false); setVerified(false);
        setArmOpen(false); setBadgeShow(false);
      }, 0);
      return ()=>clearTimeout(reset);
    }
    const t0 = setTimeout(()=>setScanKey(k=>k+1), 0);
    const t1 = setTimeout(()=>setScanning(true), 400);
    const t2 = setTimeout(()=>{ setCamGreen(true); setVerified(true); }, 1200);
    const t3 = setTimeout(()=>setArmOpen(true), 1700);
    const t4 = setTimeout(()=>setBadgeShow(true), 2200);
    return ()=>{ clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  },[active]);

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:18,width:"100%",height:"100%"}}>
      <div style={{position:"relative",width:300,height:220,flexShrink:0}}>
        {/* Ground */}
        <div style={{position:"absolute",bottom:22,left:16,right:16,height:2,background:"linear-gradient(90deg,transparent,rgba(125,57,235,.5) 25%,rgba(125,57,235,.5) 75%,transparent)",borderRadius:1}}/>
        {/* Post */}
        <div style={{position:"absolute",left:60,bottom:24,width:22,height:138,background:"linear-gradient(180deg,rgba(108,44,228,.75),rgba(48,10,128,.9))",border:"1px solid rgba(125,57,235,.55)",borderRadius:"4px 4px 2px 2px",boxShadow:"0 0 20px rgba(125,57,235,.28),inset 2px 0 0 rgba(255,255,255,.07)"}}/>
        {/* Camera box */}
        <div style={{position:"absolute",left:51,top:32,width:40,height:26,background:"linear-gradient(160deg,rgba(20,0,55,.92),rgba(8,0,24,.96))",border:"1px solid rgba(125,57,235,.7)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 16px rgba(125,57,235,.35)"}}>
          <div style={{width:10,height:10,borderRadius:"50%",transition:"background .35s,box-shadow .35s",
            background:camGreen?"#22C55E":"rgba(125,57,235,.6)",
            boxShadow:camGreen?"0 0 14px #22C55E,0 0 28px rgba(34,197,94,.55)":"0 0 8px rgba(125,57,235,.5)",
          }}/>
        </div>
        {/* Gate arm */}
        <div style={{position:"absolute",left:71,top:65,transformOrigin:"0% 50%",transition:"transform .65s cubic-bezier(.22,1,.36,1)",transform:armOpen?"rotateZ(-74deg)":"rotateZ(0deg)"}}>
          <div style={{width:190,height:14,background:"linear-gradient(90deg,rgba(130,60,240,.95),rgba(178,168,210,.85) 60%,rgba(100,40,200,.75))",border:"1px solid rgba(178,168,210,.5)",borderRadius:"0 5px 5px 0",boxShadow:"0 0 22px rgba(125,57,235,.55),0 2px 8px rgba(0,0,0,.45)",overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(-52deg,transparent 0,transparent 11px,rgba(255,255,255,.1) 11px,rgba(255,255,255,.1) 15px)"}}/>
          </div>
        </div>
        {/* Plate */}
        <div style={{
          position:"absolute",left:178,top:90,width:112,height:44,
          background:"linear-gradient(160deg,rgba(18,0,48,.94),rgba(10,0,28,.96))",
          border:`1.5px solid ${verified?"rgba(34,197,94,.7)":"rgba(125,57,235,.5)"}`,
          borderRadius:9,overflow:"hidden",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:`0 4px 20px rgba(0,0,0,.55),0 0 24px ${verified?"rgba(34,197,94,.35)":"rgba(125,57,235,.2)"}`,
          opacity:active?1:0,transform:active?"translateX(0)":"translateX(22px)",
          transition:"opacity .4s ease .1s,transform .4s ease .1s,border-color .3s ease,box-shadow .3s ease",
        }}>
          <div style={{fontFamily:"'Geist Mono',monospace",fontSize:13,fontWeight:700,color:T.text,letterSpacing:".08em",display:"flex",alignItems:"center",gap:5}}>
            <span>أ ب ج</span>
            <span style={{color:T.sub,opacity:.55,fontSize:11}}>·</span>
            <span>١٢٣٤</span>
          </div>
          {scanning && (
            <div key={scanKey} className="gate-scan-anim" style={{position:"absolute",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,rgba(125,57,235,.95),rgba(210,190,255,.9),rgba(125,57,235,.95),transparent)",filter:"drop-shadow(0 0 4px rgba(125,57,235,.9))",top:1}}/>
          )}
        </div>
      </div>
      {/* Badge */}
      <div style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'Geist Mono',monospace",fontSize:11,letterSpacing:".16em",textTransform:"uppercase",color:"#22C55E",opacity:badgeShow?1:0,transform:badgeShow?"translateY(0)":"translateY(6px)",transition:"opacity .4s ease,transform .4s ease"}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"#22C55E",boxShadow:"0 0 10px #22C55E,0 0 20px rgba(34,197,94,.5)"}}/>
        Access Granted
      </div>
    </div>
  );
}

// ─── HIW 3D: Pay card (step 3 — Pay) ─────────────────────────────────────────

function HiwPay({ active }){
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>
      <div style={{transformStyle:"preserve-3d",filter:"drop-shadow(0 40px 30px rgba(0,0,0,.7))"}}>
        <div style={{width:360,height:216,transformStyle:"preserve-3d",transform:"rotateX(-18deg) rotateY(-26deg) rotateZ(-8deg)",animation:"pay3dFloat 7s ease-in-out infinite",position:"relative"}}>
          {/* Front */}
          <div style={{position:"absolute",width:360,height:216,borderRadius:22,background:"linear-gradient(135deg,#220052 0%,#0e0028 60%,#160040 100%)",border:"1.5px solid rgba(125,57,235,.65)",boxShadow:"0 0 0 1px rgba(255,255,255,.08) inset,0 0 60px -8px rgba(125,57,235,.55)",transform:"translateZ(9px)",overflow:"hidden",padding:"22px 24px",display:"flex",flexDirection:"column"}}>
            <div style={{position:"absolute",inset:0,borderRadius:22,background:"linear-gradient(135deg,rgba(255,255,255,.08) 0%,transparent 55%)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",top:22,left:24,width:42,height:32,borderRadius:6,background:"linear-gradient(135deg,rgba(245,158,11,.85),rgba(180,110,0,.65))",border:"1px solid rgba(245,158,11,.45)",boxShadow:"0 0 14px rgba(245,158,11,.35)"}}/>
            <div style={{position:"absolute",top:22,right:24,fontSize:16,fontWeight:700,letterSpacing:"-.02em",color:T.purple,textShadow:"0 0 20px rgba(125,57,235,.9)"}}>EZK</div>
            <div style={{position:"absolute",top:72,left:24,fontSize:34,fontWeight:600,letterSpacing:"-.04em",color:T.text,fontVariantNumeric:"tabular-nums",lineHeight:1,opacity:active?1:0,transform:active?"translateY(0)":"translateY(10px)",transition:"opacity .5s ease .4s,transform .5s ease .4s"}}>EGP 24.50</div>
            <div style={{position:"absolute",top:78,right:24,display:"flex",alignItems:"center",gap:6,fontFamily:"'Geist Mono',monospace",fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",color:"#22C55E"}}>
              <svg viewBox="0 0 30 30" width={30} height={30}>
                <circle cx="15" cy="15" r="13" fill="rgba(34,197,94,.18)" stroke="#22C55E" strokeWidth="1.5"/>
                <path d="M8 15 L13 20 L22 10" stroke="#22C55E" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"
                  style={{strokeDasharray:40,strokeDashoffset:active?0:40,transition:"stroke-dashoffset .5s ease .5s"}}/>
              </svg>
              <span>Paid</span>
            </div>
            <div style={{position:"absolute",left:24,right:24,height:1,background:"rgba(125,57,235,.28)",top:122}}/>
            <div style={{position:"absolute",left:24,right:24,bottom:18,display:"flex",flexDirection:"column",gap:7,opacity:active?1:0,transform:active?"translateY(0)":"translateY(12px)",transition:"opacity .5s ease .75s,transform .5s ease .75s"}}>
              {[["Duration","1h 24m"],["Lot","Al-Qahira P2"],["Method","Wallet"]].map(([k,v],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,fontFamily:"'Geist Mono',monospace"}}>
                  <span style={{color:T.sub}}>{k}</span>
                  <span style={{color:T.text,fontWeight:500}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Back */}
          <div style={{position:"absolute",width:360,height:216,borderRadius:22,background:"linear-gradient(135deg,#140030,#080018)",border:"1px solid rgba(125,57,235,.25)",transform:"translateZ(-9px) rotateY(180deg)"}}/>
          {/* Left */}
          <div style={{position:"absolute",width:18,height:216,background:"linear-gradient(90deg,rgba(180,100,255,.9),rgba(90,30,200,.7))",boxShadow:"inset -2px 0 0 rgba(255,255,255,.12),0 0 16px rgba(125,57,235,.35)",transformOrigin:"0% 50%",transform:"rotateY(-90deg)",left:0,top:0}}/>
          {/* Right */}
          <div style={{position:"absolute",width:18,height:216,background:"linear-gradient(90deg,rgba(18,3,50,.6),rgba(45,10,115,.8))",transformOrigin:"100% 50%",transform:"rotateY(90deg)",right:0,top:0}}/>
          {/* Top */}
          <div style={{position:"absolute",width:360,height:18,background:"linear-gradient(180deg,rgba(155,75,255,.75),rgba(80,22,180,.55))",boxShadow:"inset 0 -2px 0 rgba(255,255,255,.09)",transformOrigin:"50% 0%",transform:"rotateX(90deg)",top:0,left:0}}/>
          {/* Bottom */}
          <div style={{position:"absolute",width:360,height:18,background:"linear-gradient(180deg,rgba(16,2,50,.7),rgba(35,7,88,.5))",transformOrigin:"50% 100%",transform:"rotateX(-90deg)",bottom:0,left:0}}/>
        </div>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Landing({ onEnter, onViewDetails, onAuthOpen, onBusiness, user }){
  const [featuredLots, setFeaturedLots] = useState([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [wordAnim, setWordAnim] = useState("in");
  const [liveCount, setLiveCount] = useState(2847);
  const [hiwStep, setHiwStep] = useState(0);
  const { isMobile } = useBreakpoint();
  const isTablet = !isMobile && typeof window !== "undefined" && window.innerWidth < 1024;
  const hiwRef = useRef(null);
  const cursorGlowRef = useRef(null);

  // fetch lots
  useEffect(()=>{
    apiFetch("/api/parking-lots")
      .then(data=>{
        setFeaturedLots((data||[]).map(lot=>({
          id:lot.id, name:lot.name, address:lot.address,
          total:lot.totalSlots, available:lot.availableSlots,
          rate:lot.hourlyRate!=null?Number(lot.hourlyRate):0,
          imageUrl:lot.imageUrl||null,
        })));
      })
      .catch(()=>{});
  },[]);

  // cycling words
  useEffect(()=>{
    const id = setInterval(()=>{
      setWordAnim("out");
      setTimeout(()=>{ setWordIdx(i=>(i+1)%CYCLE_WORDS.length); setWordAnim("in"); }, 400);
    }, 3000);
    return ()=>clearInterval(id);
  },[]);

  // live count flicker
  useEffect(()=>{
    const id = setInterval(()=>{
      setLiveCount(n => Math.max(2800, n + Math.floor(Math.random()*7)-3));
    }, 2500);
    return ()=>clearInterval(id);
  },[]);

  // hiw step auto-cycle
  useEffect(()=>{
    const id = setInterval(()=>{ setHiwStep(s=>(s+1)%4); }, 3000);
    return ()=>clearInterval(id);
  },[]);

  // cursor glow — direct DOM, no React re-render lag
  useEffect(()=>{
    const el = cursorGlowRef.current;
    if(!el) return;
    let visible = false;
    const onMove = e=>{
      el.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
      if(!visible){ el.style.opacity="1"; visible=true; }
    };
    const onLeave = ()=>{ el.style.opacity="0"; visible=false; };
    const onEnter = ()=>{ el.style.opacity="1"; visible=true; };
    window.addEventListener("mousemove", onMove, {passive:true});
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return ()=>{
      window.removeEventListener("mousemove",onMove);
      document.removeEventListener("mouseleave",onLeave);
      document.removeEventListener("mouseenter",onEnter);
    };
  },[]);

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({behavior:"smooth"});

  const cols = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <div style={{color:T.text,width:"100%",overflowX:"clip",background:T.dark,fontFamily:"'Geist',-apple-system,system-ui,sans-serif"}}>
      <style>{`
        *{box-sizing:border-box}
        ::selection{background:${T.purple};color:${T.text}}
        body{background:${T.dark}}

        /* Cursor glow */
        .cg{position:fixed;top:0;left:0;width:720px;height:720px;border-radius:50%;background:radial-gradient(circle at center,rgba(125,57,235,.65) 0%,rgba(125,57,235,.35) 22%,rgba(125,57,235,.12) 45%,transparent 70%);filter:blur(30px);pointer-events:none;transform:translate(-50%,-50%);z-index:45;mix-blend-mode:screen;transition:opacity .6s ease;will-change:transform}

        /* Hero breathing mesh */
        @keyframes breathe{0%,100%{transform:scale(1) rotate(0deg);opacity:.85}50%{transform:scale(1.08) rotate(2deg);opacity:1}}
        /* Floating chip animations */
        @keyframes floaty{0%,100%{transform:translateY(0) rotate(-.3deg)}50%{transform:translateY(-14px) rotate(.4deg)}}
        /* Spin halo */
        @keyframes haloSpin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
        /* Live dot pulse */
        @keyframes liveDot{0%{box-shadow:0 0 0 0 rgba(198,255,51,.7)}70%{box-shadow:0 0 0 10px rgba(198,255,51,0)}100%{box-shadow:0 0 0 0 rgba(198,255,51,0)}}
        /* Ping user dot */
        @keyframes ping{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.4);opacity:0}}
        /* Scroll cue */
        @keyframes scrollDown{0%{transform:translateY(-12px);opacity:1}80%{transform:translateY(40px);opacity:0}100%{transform:translateY(40px);opacity:0}}
        /* Shimmer gradient */
        @keyframes shimmer{0%{background-position:0% 0}100%{background-position:300% 0}}
        /* Number shimmer */
        @keyframes numShimmer{0%{background-position:0% 0}100%{background-position:300% 0}}

        /* Eyebrow dot */
        .eyebrow-dot{width:5px;height:5px;border-radius:50%;background:#C6FF33;box-shadow:0 0 10px rgba(198,255,51,.7)}

        /* Nav link underline */
        .nav-link-ul{position:relative;padding:4px 0;outline:none}
        .nav-link-ul:focus-visible{color:#C6FF33}
        .nav-link-ul::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:1px;background:#C6FF33;transform:scaleX(0);transform-origin:left;transition:transform .35s cubic-bezier(.65,0,.35,1)}
        .nav-link-ul:hover::after,.nav-link-ul:focus-visible::after{transform:scaleX(1)}

        /* HIW cycling */
        @keyframes hiwIsoFloat{0%{transform:rotateX(52deg) rotateZ(-42deg) translateY(0) scale(1)}33%{transform:rotateX(54deg) rotateZ(-40deg) translateY(-8px) scale(1.02)}66%{transform:rotateX(50deg) rotateZ(-44deg) translateY(-14px) scale(1.01)}100%{transform:rotateX(52deg) rotateZ(-42deg) translateY(0) scale(1)}}
        /* HIW Phone */
        @keyframes phone3dFloat{0%,100%{transform:rotateZ(14deg) translateY(0)}50%{transform:rotateZ(14deg) translateY(-14px)}}
        @keyframes psSel{0%,100%{box-shadow:0 0 12px rgba(125,57,235,.7)}50%{box-shadow:0 0 22px rgba(125,57,235,1)}}
        .ps-sel-anim{animation:psSel 1.4s ease-in-out infinite}
        /* HIW Gate */
        @keyframes gateScanMove{0%{top:1px;opacity:1}100%{top:40px;opacity:.5}}
        .gate-scan-anim{animation:gateScanMove .65s ease-in-out forwards}
        /* HIW Pay */
        @keyframes pay3dFloat{0%{transform:rotateX(-18deg) rotateY(-26deg) rotateZ(-8deg) translateY(0)}33%{transform:rotateX(-15deg) rotateY(-24deg) rotateZ(-7deg) translateY(-12px)}66%{transform:rotateX(-20deg) rotateY(-28deg) rotateZ(-9deg) translateY(-20px)}100%{transform:rotateX(-18deg) rotateY(-26deg) rotateZ(-8deg) translateY(0)}}

        /* Pulsing hero entrance */
        .hero-in{animation:heroFadeUp .7s both cubic-bezier(.22,1,.36,1)}
        .hero-in-1{animation-delay:.1s}
        .hero-in-2{animation-delay:.28s}
        .hero-in-3{animation-delay:.44s}
        .hero-in-4{animation-delay:.60s}
        @keyframes heroFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}

        /* Float card hover — wobble + 3D depth */
        @keyframes fcWobble{
          0%  {transform:translateY(-14px) rotateZ(-1.6deg) rotateX(4deg) rotateY(-4deg) scale(1.05)}
          50% {transform:translateY(-22px) rotateZ(1.4deg)  rotateX(2deg) rotateY(4deg)  scale(1.07)}
          100%{transform:translateY(-14px) rotateZ(-1.6deg) rotateX(4deg) rotateY(-4deg) scale(1.05)}
        }
        @keyframes fcBarShimmer{0%,100%{filter:brightness(1.3) saturate(1.3)}50%{filter:brightness(1.7) saturate(1.6)}}
        .fc-hover{
          transition:border-color .4s ease,box-shadow .4s ease,background .4s ease;
          cursor:pointer;transform-style:preserve-3d;
        }
        .fc-hover:hover{
          animation:fcWobble 1.6s ease-in-out infinite!important;
          border-color:rgba(125,57,235,.7)!important;
          background:linear-gradient(180deg,rgba(36,8,80,.85),rgba(14,0,40,.85))!important;
          box-shadow:0 40px 90px -20px rgba(0,0,0,.85),0 0 80px -6px rgba(125,57,235,.75),inset 0 0 0 1px rgba(125,57,235,.25)!important;
        }
        .fc-hover .fc-inner-head,.fc-hover .fc-inner-bar,.fc-hover .fc-inner-foot,.fc-hover .fc-status-badge{pointer-events:none}
        .fc-hover .fc-inner-head,.fc-hover .fc-inner-bar,.fc-hover .fc-inner-foot{transition:transform .5s cubic-bezier(.34,1.4,.64,1)}
        .fc-hover:hover .fc-inner-head{transform:translateZ(28px)}
        .fc-hover:hover .fc-inner-bar{transform:translateZ(16px)}
        .fc-hover:hover .fc-inner-foot{transform:translateZ(8px)}
        .fc-hover .fc-status-badge{transition:transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .3s}
        .fc-hover:hover .fc-status-badge{transform:translateZ(32px) scale(1.18) rotate(-3deg)}

        /* BN line shimmer */
        .bn-stat{background:linear-gradient(100deg,#7D39EB 0%,#B2A8D2 22%,#F0EAFA 38%,#fff 45%,#F0EAFA 52%,#B2A8D2 68%,#7D39EB 88%,#7D39EB 100%);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shimmer 7s linear infinite}

        /* CTA mark pulse */
        @keyframes markPulse{0%,100%{box-shadow:0 0 60px rgba(125,57,235,.6),0 0 120px rgba(125,57,235,.3),inset 0 0 0 1px rgba(255,255,255,.1);transform:scale(1)}50%{box-shadow:0 0 80px rgba(125,57,235,.9),0 0 180px rgba(125,57,235,.45),inset 0 0 0 1px rgba(255,255,255,.2);transform:scale(1.04)}}
        @keyframes ringExpand{0%{transform:scale(.9);opacity:.8}100%{transform:scale(1.4);opacity:0}}

        /* Footer link hover */
        .fl{transition:color .2s,transform .2s;display:block}
        .fl:hover{color:${T.text}!important;transform:translateX(2px)}

        /* Biz card hover */
        .bizcard{transition:border-color .35s,transform .35s,box-shadow .35s}
        .bizcard:hover{border-color:rgba(125,57,235,.55)!important;transform:translateY(-4px)!important;box-shadow:0 24px 60px -16px rgba(0,0,0,.5)!important}

        /* Location card hover drive via state */
        .loc-cta-arrow{transition:transform .25s}
      `}</style>

      {/* Cursor glow — position driven by direct DOM ref, no re-render */}
      <div className="cg" ref={cursorGlowRef} style={{opacity:0}}/>

      {/* ═══════════════════════════ NAV ════════════════════════════ */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:isMobile?"18px 20px":"22px 56px",
        backdropFilter:"blur(12px)",
        WebkitBackdropFilter:"blur(12px)",
        background:"linear-gradient(180deg,rgba(7,0,26,0.6),rgba(7,0,26,0))",
      }}>
        {/* Logo */}
        <div
          onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
          style={{display:"flex",alignItems:"center",fontWeight:700,fontSize:20,letterSpacing:"-.03em",cursor:"pointer",transition:"transform .3s ease"}}
          onMouseEnter={e=>e.currentTarget.style.transform="translateX(1px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="translateX(0)"}
        >
          <span style={{color:T.purple,textShadow:"0 0 22px rgba(125,57,235,0.55)",transition:"text-shadow .35s,letter-spacing .35s",display:"inline-block"}}
            onMouseEnter={e=>{e.currentTarget.style.textShadow="0 0 36px rgba(125,57,235,0.95)";e.currentTarget.style.letterSpacing="-0.01em"}}
            onMouseLeave={e=>{e.currentTarget.style.textShadow="0 0 22px rgba(125,57,235,0.55)";e.currentTarget.style.letterSpacing="initial"}}
          >ez</span>
          <span style={{color:T.text,transition:"color .3s"}}>rakna</span>
        </div>

        {/* Center links — desktop only */}
        {!isMobile && (
          <div style={{display:"flex",gap:36,fontSize:14,color:T.sub}}>
            {[
              {label:"Features",    action:()=>scrollTo("featuresZone")},
              {label:"How it works",action:()=>scrollTo("hiwZone")},
              {label:"Locations",   action:()=>scrollTo("locsZone")},
              {label:"For Business",action:()=>scrollTo("bizZone")},
              {label:"Pricing",     action:()=>scrollTo("ctaZone")},
            ].map(({label,action})=>(
              <button key={label} onClick={action} className="nav-link-ul" style={{
                background:"none",border:"none",cursor:"pointer",
                color:T.sub,fontSize:14,fontFamily:"inherit",
                padding:"4px 0",transition:"color .2s",
              }}
              onMouseEnter={e=>e.currentTarget.style.color=T.text}
              onMouseLeave={e=>e.currentTarget.style.color=T.sub}
              >{label}</button>
            ))}
          </div>
        )}

        {/* Right CTA */}
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          {user ? (
            <button onClick={onEnter} style={{
              padding:"10px 18px",fontSize:14,color:"#07001A",fontWeight:600,
              background:"#C6FF33",border:"none",borderRadius:999,cursor:"pointer",
              fontFamily:"inherit",transition:"all .2s",
              boxShadow:"0 0 0 1px rgba(255,255,255,0.12) inset,0 8px 24px -8px rgba(198,255,51,0.55)",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="#d4ff5c";e.currentTarget.style.transform="translateY(-1px)"}}
            onMouseLeave={e=>{e.currentTarget.style.background="#C6FF33";e.currentTarget.style.transform="translateY(0)"}}>
              Dashboard
            </button>
          ) : (
            <>
              {!isMobile && (
                <button onClick={()=>onAuthOpen?.("login")} style={{
                  padding:"10px 18px",fontSize:14,color:T.text,
                  background:"transparent",border:`1px solid ${T.border}`,borderRadius:999,
                  cursor:"pointer",fontFamily:"inherit",transition:"all .2s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.purple;e.currentTarget.style.background="rgba(125,57,235,0.08)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="transparent"}}>
                  Sign in
                </button>
              )}
              <button onClick={()=>onAuthOpen?.("signup")} style={{
                padding:"10px 18px",fontSize:14,color:"#07001A",fontWeight:600,
                background:"#C6FF33",border:"none",borderRadius:999,cursor:"pointer",
                fontFamily:"inherit",transition:"all .2s",
                boxShadow:"0 0 0 1px rgba(255,255,255,0.12) inset,0 8px 24px -8px rgba(198,255,51,0.55)",
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="#d4ff5c";e.currentTarget.style.transform="translateY(-1px)"}}
              onMouseLeave={e=>{e.currentTarget.style.background="#C6FF33";e.currentTarget.style.transform="translateY(0)"}}>
                Get the app
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════ HERO ═══════════════════════════════ */}
      <section style={{position:"relative",minHeight:"100vh",padding:isMobile?"140px 20px 120px":"140px 56px 120px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",overflow:"hidden"}}>

        {/* Mesh */}
        <div style={{position:"absolute",inset:"-20%",background:"radial-gradient(60% 50% at 12% 30%,rgba(125,57,235,.55),transparent 60%),radial-gradient(45% 45% at 85% 20%,rgba(74,26,158,.7),transparent 60%),radial-gradient(55% 55% at 70% 90%,rgba(125,57,235,.35),transparent 60%),radial-gradient(40% 40% at 30% 85%,rgba(74,26,158,.45),transparent 60%)",filter:"blur(40px)",animation:"breathe 12s ease-in-out infinite"}}/>
        {/* Grain */}
        <div style={{position:"absolute",inset:0,opacity:.06,mixBlendMode:"overlay",backgroundImage:"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>\")",pointerEvents:"none"}}/>
        {/* Vignette */}
        <div style={{position:"absolute",inset:0,background:"radial-gradient(100% 70% at 50% 50%,transparent 40%,#07001A 100%)",pointerEvents:"none"}}/>

        {/* Rings */}
        <div style={{position:"absolute",inset:0,display:"grid",placeItems:"center",pointerEvents:"none"}}>
          {[["min(1100px,90vw)","rgba(125,57,235,.22)",.55],["min(820px,72vw)","rgba(125,57,235,.30)",.55],["min(580px,56vw)","rgba(125,57,235,.42)",.55]].map(([sz,bc,op],i)=>(
            <div key={i} style={{position:"absolute",width:sz,height:sz,top:"50%",left:"50%",transform:"translate(-50%,-50%)",borderRadius:"50%",border:`1px solid ${bc}`,opacity:op}}/>
          ))}
          {/* Halo */}
          <div style={{position:"absolute",top:"50%",left:"50%",width:"min(700px,60vw)",height:"min(700px,60vw)",borderRadius:"50%",background:"conic-gradient(from 0deg,transparent 70%,#7D39EB 90%,transparent 100%)",filter:"blur(14px)",opacity:.42,transform:"translate(-50%,-50%)",animation:"haloSpin 18s linear infinite"}}/>
        </div>

        {/* Floating chip 1 — top-left */}
        {!isMobile && (
          <div style={{position:"absolute",top:"18%",left:"7%",zIndex:6,display:"inline-flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:999,background:"rgba(22,0,55,.55)",border:`1px solid ${T.border}`,backdropFilter:"blur(12px)",color:T.text,fontSize:12,fontWeight:500,animation:"floaty 9s ease-in-out -1.5s infinite",boxShadow:"0 14px 40px -16px rgba(0,0,0,.6)"}}>
            <span style={{color:T.sub,fontSize:11,letterSpacing:".06em",textTransform:"uppercase"}}>Avg. find time</span>
            <span style={{fontFamily:"'Geist Mono',monospace",fontWeight:500}}>38<span style={{color:T.sub,fontSize:10,marginLeft:2}}>s</span></span>
          </div>
        )}
        {/* Floating chip 2 — bottom-right */}
        {!isMobile && (
          <div style={{position:"absolute",bottom:"22%",right:"8%",zIndex:6,display:"inline-flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:999,background:"rgba(22,0,55,.55)",border:`1px solid ${T.border}`,backdropFilter:"blur(12px)",color:T.text,fontSize:12,fontWeight:500,animation:"floaty 7.5s ease-in-out -4.5s infinite",boxShadow:"0 14px 40px -16px rgba(0,0,0,.6)"}}>
            <span style={{color:T.sub,fontSize:11,letterSpacing:".06em",textTransform:"uppercase"}}>Active routes</span>
            <span style={{fontFamily:"'Geist Mono',monospace",fontWeight:500}}>1,204</span>
          </div>
        )}

        {/* Floating card 1 — top-right */}
        {!isMobile && (
          <div className="fc-hover" style={{position:"absolute",top:"14%",right:"6%",padding:"14px 16px",borderRadius:16,background:"linear-gradient(180deg,rgba(22,0,55,.7),rgba(10,0,32,.7))",border:`1px solid ${T.border}`,backdropFilter:"blur(14px)",boxShadow:"0 24px 60px -20px rgba(0,0,0,.7),0 0 40px -10px rgba(125,57,235,.25)",minWidth:220,zIndex:6,animation:"floaty 7s ease-in-out infinite",perspective:1400}}>
            <div className="fc-inner-head" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.text,letterSpacing:"-.01em"}}>NGU Parking</div>
                <div style={{fontSize:11,color:T.sub,marginTop:2,fontFamily:"'Geist Mono',monospace",letterSpacing:".02em"}}>New Giza · 4 min away</div>
              </div>
              <span className="fc-status-badge" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 9px",borderRadius:999,fontSize:10,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",background:"rgba(34,197,94,.12)",color:"#22C55E"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"currentColor",boxShadow:"0 0 8px currentColor"}}/>Available
              </span>
            </div>
            <div className="fc-inner-bar" style={{marginTop:12,height:4,borderRadius:999,background:"rgba(125,57,235,.15)"}}>
              <div style={{height:"100%",width:"32%",borderRadius:999,background:`linear-gradient(90deg,${T.purple},#B2A8D2)`}}/>
            </div>
            <div className="fc-inner-foot" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,fontSize:11,color:T.sub}}>
              <span>Occupancy</span>
              <span><span style={{color:T.text,fontFamily:"'Geist Mono',monospace",fontWeight:500}}>82</span> / 256 spots</span>
            </div>
          </div>
        )}
        {/* Floating card 2 — bottom-left */}
        {!isMobile && (
          <div className="fc-hover" style={{position:"absolute",bottom:"16%",left:"6%",padding:"14px 16px",borderRadius:16,background:"linear-gradient(180deg,rgba(22,0,55,.7),rgba(10,0,32,.7))",border:`1px solid ${T.border}`,backdropFilter:"blur(14px)",boxShadow:"0 24px 60px -20px rgba(0,0,0,.7),0 0 40px -10px rgba(125,57,235,.25)",minWidth:220,zIndex:6,animation:"floaty 8s ease-in-out -3s infinite",perspective:1400}}>
            <div className="fc-inner-head" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.text,letterSpacing:"-.01em"}}>City Stars Mall</div>
                <div style={{fontSize:11,color:T.sub,marginTop:2,fontFamily:"'Geist Mono',monospace",letterSpacing:".02em"}}>Nasr City · 11 min away</div>
              </div>
              <span className="fc-status-badge" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 9px",borderRadius:999,fontSize:10,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",background:"rgba(245,158,11,.12)",color:"#F59E0B"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"currentColor",boxShadow:"0 0 8px currentColor"}}/>Limited
              </span>
            </div>
            <div className="fc-inner-bar" style={{marginTop:12,height:4,borderRadius:999,background:"rgba(125,57,235,.15)"}}>
              <div style={{height:"100%",width:"84%",borderRadius:999,background:"linear-gradient(90deg,#F59E0B,#fbbf24)"}}/>
            </div>
            <div className="fc-inner-foot" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,fontSize:11,color:T.sub}}>
              <span>Occupancy</span>
              <span><span style={{color:T.text,fontFamily:"'Geist Mono',monospace",fontWeight:500}}>1,608</span> / 1,920 spots</span>
            </div>
          </div>
        )}

        {/* Center content */}
        <div style={{position:"relative",zIndex:6,display:"flex",flexDirection:"column",alignItems:"center",maxWidth:1180,width:"100%"}}>

          {/* Live pill */}
          <div className="hero-in hero-in-1" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"7px 14px 7px 12px",borderRadius:999,background:"rgba(125,57,235,.10)",border:`1px solid ${T.border}`,fontSize:12,letterSpacing:".14em",textTransform:"uppercase",color:T.text,fontWeight:500,backdropFilter:"blur(8px)"}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#C6FF33",boxShadow:"0 0 0 0 rgba(198,255,51,.6)",animation:"liveDot 1.6s ease-out infinite"}}/>
            Live across Cairo
            <span style={{width:1,height:10,background:T.border,margin:"0 2px"}}/>
            <span style={{color:T.sub,fontVariantNumeric:"tabular-nums"}}>{liveCount.toLocaleString()} spots online</span>
          </div>

          {/* Headline */}
          <h1 className="hero-in hero-in-2" style={{fontSize:"clamp(62px,9.2vw,156px)",lineHeight:.92,letterSpacing:"-.045em",fontWeight:600,marginTop:32,color:T.text,cursor:"default",textAlign:"center"}}>
            <span style={{display:"block"}}>
              {["Park","smarter"].map((w,i)=>(
                <span key={i} style={{display:"inline-block",marginRight:i===0?"0.25em":0,background:"linear-gradient(100deg,#7D39EB 0%,#B2A8D2 20%,#F0EAFA 35%,#fff 42%,#F0EAFA 50%,#B2A8D2 65%,#7D39EB 85%,#7D39EB 100%)",backgroundSize:"300% 100%",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",color:"transparent",animation:`shimmer 7s linear ${i*-.9}s infinite`}}>
                  {w}
                </span>
              ))}
            </span>
            <span style={{display:"block"}}>
              <span style={{background:"linear-gradient(100deg,#7D39EB 0%,#B2A8D2 20%,#F0EAFA 35%,#fff 42%,#F0EAFA 50%,#B2A8D2 65%,#7D39EB 85%,#7D39EB 100%)",backgroundSize:"300% 100%",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",color:"transparent",animation:"shimmer 7s linear -1.8s infinite"}}>in </span>
              {/* Cycling word — absolutely stacked so they overlap and fade/slide over each other */}
              <span style={{display:"inline-block",position:"relative",verticalAlign:"baseline",height:"1em",overflow:"hidden"}}>
                {/* Invisible spacer using the longest word — sets the container width */}
                <span aria-hidden="true" style={{
                  display:"inline-block",whiteSpace:"nowrap",visibility:"hidden",pointerEvents:"none",
                  fontFamily:"'Instrument Serif',serif",fontStyle:"italic",fontWeight:400,fontSize:"1.05em",lineHeight:1,
                }}>
                  {CYCLE_WORDS.reduce((a,b)=>a.length>=b.length?a:b)}
                </span>
                {CYCLE_WORDS.map((w,i)=>(
                  <span key={w} style={{
                    display:"inline-block",whiteSpace:"nowrap",
                    color:T.purple,fontFamily:"'Instrument Serif',serif",fontStyle:"italic",fontWeight:400,fontSize:"1.05em",lineHeight:1,
                    textShadow:"0 0 40px rgba(125,57,235,.4)",
                    position:"absolute",
                    top:0, left:0,
                    opacity: i===wordIdx ? (wordAnim==="in"?1:0) : 0,
                    transform: i===wordIdx
                      ? (wordAnim==="in"?"translateY(0)":"translateY(-110%)")
                      : "translateY(110%)",
                    transition:"opacity .4s ease,transform .4s ease",
                    pointerEvents:"none",
                  }}>{w}</span>
                ))}
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-in hero-in-3" style={{marginTop:34,fontSize:"clamp(16px,1.15vw,19px)",lineHeight:1.55,color:T.sub,maxWidth:560,fontWeight:400,textAlign:"center"}}>
            Ezrakna's <span style={{color:T.text,fontWeight:500}}>AI parking network</span> finds open spots, reserves them, and routes you in — across 240+ locations in greater Cairo, updated every second.
          </p>

          {/* CTA row */}
          <div className="hero-in hero-in-4" style={{marginTop:36,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
            <button onClick={onEnter} style={{display:"inline-flex",alignItems:"center",gap:10,padding:"14px 22px",borderRadius:999,fontSize:15,fontWeight:500,cursor:"pointer",border:"none",fontFamily:"inherit",background:"#C6FF33",color:"#07001A",boxShadow:"0 0 0 1px rgba(255,255,255,.12) inset,0 16px 40px -10px rgba(198,255,51,.55)",transition:"transform .2s,background .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#d4ff5c";e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.background="#C6FF33";e.currentTarget.style.transform="translateY(0)"}}>
              {user ? "Go to Dashboard" : "Find a spot"}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
            </button>
            <button onClick={()=>scrollTo("featuresZone")} style={{display:"inline-flex",alignItems:"center",gap:10,padding:"14px 22px",borderRadius:999,fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:"transparent",color:T.text,border:`1px solid ${T.border}`,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.purple;e.currentTarget.style.background="rgba(125,57,235,.08)";e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="transparent";e.currentTarget.style.transform="translateY(0)"}}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,2 13,8 3,14"/></svg>
              Watch demo
            </button>
          </div>

        </div>

        {/* Scroll cue */}
        <div style={{position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:10,color:T.sub,fontSize:11,letterSpacing:".2em",textTransform:"uppercase",zIndex:5,fontFamily:"'Geist Mono',monospace"}}>
          <span>Scroll</span>
          <div style={{width:1,height:40,background:`linear-gradient(180deg,${T.sub},transparent)`,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:12,background:T.purple,animation:"scrollDown 2.2s ease-in-out infinite"}}/>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ BY THE NUMBERS ═══════════════════════ */}
      <section style={{padding:isMobile?"120px 20px 80px":"180px 56px 120px"}}>
        <div style={{maxWidth:1280,margin:"0 auto",textAlign:"center"}}>
          {[
            { count:1247, label:"spots.", delay:0 },
            { count:50,   label:"locations.", delay:100 },
            { text:"One", label:"tap.", delay:200 },
          ].map((r,i)=>(
            <Reveal key={i} delay={r.delay}>
              <span style={{display:"block",fontSize:"clamp(64px,11vw,180px)",lineHeight:1,letterSpacing:"-.05em",fontWeight:500,color:T.text,marginTop:i>0?8:0}}>
                {r.text
                  ? <><span className="bn-stat">{r.text}</span> <span style={{color:T.sub,fontFamily:"'Instrument Serif',serif",fontStyle:"italic",fontWeight:400}}>{r.label}</span></>
                  : <><span className="bn-stat"><Counter target={r.count} suffix=""/></span> <span style={{color:T.sub,fontFamily:"'Instrument Serif',serif",fontStyle:"italic",fontWeight:400}}>{r.label}</span></>
                }
              </span>
            </Reveal>
          ))}
          <Reveal delay={300}>
            <div style={{marginTop:120,display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",borderTop:`1px solid ${T.border}`}}>
              {[["< 3","min","Avg reserve time"],["98","%","Driver satisfaction"],["24","/7","Live support"]].map(([v,u,lbl],i)=>(
                <div key={i} style={{padding:"48px 32px 8px",display:"flex",flexDirection:"column",gap:10,textAlign:"left",position:"relative",borderLeft:i>0?`1px solid ${T.border}`:"none"}}>
                  <span style={{fontFamily:"'Geist Mono',monospace",fontSize:"clamp(28px,3vw,40px)",color:T.text,fontWeight:500,letterSpacing:"-.02em",lineHeight:1}}>
                    {v}<span style={{color:u==="/"?T.sub:T.purple,fontSize:"0.7em"}}>{u}</span>
                  </span>
                  <span style={{fontSize:12,color:T.sub,textTransform:"uppercase",letterSpacing:".16em"}}>{lbl}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════ STATS BAR ═══════════════════════════ */}
      <div style={{padding:isMobile?"48px 20px":"56px 56px",borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,background:"linear-gradient(180deg,rgba(125,57,235,.04),rgba(125,57,235,0))"}}>
        <div style={{maxWidth:1480,margin:"0 auto",display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`}}>
          {[
            { count:50, suffix:"+", unit:"", label:"Locations" },
            { count:12, suffix:"k+", unit:"", label:"Active drivers" },
            { count:98, suffix:"%", unit:"", label:"Satisfaction" },
            { count:3, suffix:"", unit:"min avg reserve", label:"Lightning fast" },
          ].map((s,i)=>(
            <Reveal key={i} delay={i*80}>
              <div style={{padding:"24px 36px",position:"relative"}}>
                {i>0 && !isMobile && <div style={{position:"absolute",left:0,top:"18%",bottom:"18%",width:1,background:T.border}}/>}
                <div style={{fontSize:"clamp(40px,4.5vw,68px)",fontWeight:500,letterSpacing:"-.035em",color:T.text,fontVariantNumeric:"tabular-nums",lineHeight:1,display:"flex",alignItems:"baseline",gap:2}}>
                  <Counter target={s.count} suffix={s.suffix}/>
                  {s.unit && <span style={{color:T.sub,fontSize:"0.4em",marginLeft:6,fontWeight:400,textTransform:"uppercase",letterSpacing:".1em"}}>{s.unit}</span>}
                </div>
                <div style={{fontSize:13,color:T.sub,textTransform:"uppercase",letterSpacing:".14em",fontWeight:500,marginTop:10}}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ═══════════════════════ FEATURES CAROUSEL ═══════════════════ */}
      <section id="featuresZone" style={{padding:isMobile?"64px 20px 100px":"160px 56px"}}>
        <div style={{maxWidth:1480,margin:"0 auto"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",marginBottom:80}}>
            <Reveal>
              <span style={{display:"inline-flex",alignItems:"center",gap:10,fontFamily:"'Geist Mono',monospace",fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:T.sub,padding:"7px 14px",border:`1px solid ${T.border}`,borderRadius:999,background:"rgba(125,57,235,.05)"}}>
                <span className="eyebrow-dot"/>Features
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h2 style={{fontSize:"clamp(40px,5.8vw,84px)",lineHeight:1,letterSpacing:"-.04em",fontWeight:600,marginTop:28,maxWidth:"18ch",color:T.text}}>
                One app, every <span style={{fontFamily:"'Instrument Serif',serif",fontStyle:"italic",fontWeight:400,background:"linear-gradient(100deg,#7D39EB,#B2A8D2,#F0EAFA,#B2A8D2,#7D39EB)",backgroundSize:"300% 100%",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",animation:"shimmer 7s linear infinite"}}>parking moment</span>.
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p style={{marginTop:20,color:T.sub,fontSize:"clamp(15px,1.1vw,18px)",maxWidth:560,lineHeight:1.6,textAlign:"center"}}>
                A live map, predictive availability, turn-by-turn routing, and a session that ends itself.
              </p>
            </Reveal>
          </div>
          <FeaturesCarousel isMobile={isMobile}/>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <div id="hiwZone" ref={hiwRef} style={{background:T.dark,borderTop:`1px solid ${T.border}`}}>
        <div style={{
          display:"flex",
          flexDirection:"column",
          alignItems:"center",
          justifyContent:"center",
          padding:isMobile?"80px 20px 60px":"80px 56px",
          minHeight:"100vh",
        }}>
          {/* Eyebrow */}
          <div style={{marginBottom:32}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:10,fontFamily:"'Geist Mono',monospace",fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:T.sub,padding:"7px 14px",border:`1px solid ${T.border}`,borderRadius:999,background:"rgba(125,57,235,.05)"}}>
              <span className="eyebrow-dot"/>How it works
            </span>
          </div>

          {/* Main grid */}
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1.4fr 1fr",alignItems:"center",gap:48,width:"100%",maxWidth:1480}}>

            {/* Step titles */}
            <div>
              {HIW_STEPS.map((s,i)=>(
                <div key={i} onClick={()=>setHiwStep(i)} style={{cursor:"pointer",marginBottom:8}}>
                  <h2 style={{
                    fontSize:"clamp(56px,7vw,120px)",lineHeight:.95,letterSpacing:"-.045em",fontWeight:600,
                    color:hiwStep===i?T.text:"rgba(240,234,250,.18)",
                    transition:"color .4s ease",
                  }}>{s.title}</h2>
                </div>
              ))}
            </div>

            {/* 3D visualization center — changes per step */}
            <div style={{position:"relative",width:"100%",aspectRatio:"1/1",maxWidth:580,margin:"0 auto",minHeight:isMobile?260:400}}>
              <div style={{position:"absolute",inset:0,opacity:hiwStep===0?1:0,transition:"opacity .5s ease",pointerEvents:hiwStep===0?"auto":"none"}}>
                <HiwPhone active={hiwStep===0}/>
              </div>
              <div style={{position:"absolute",inset:0,opacity:hiwStep===1?1:0,transition:"opacity .5s ease",pointerEvents:hiwStep===1?"auto":"none"}}>
                <IsoGrid step={hiwStep}/>
              </div>
              <div style={{position:"absolute",inset:0,opacity:hiwStep===2?1:0,transition:"opacity .5s ease",pointerEvents:hiwStep===2?"auto":"none"}}>
                <HiwGate active={hiwStep===2}/>
              </div>
              <div style={{position:"absolute",inset:0,opacity:hiwStep===3?1:0,transition:"opacity .5s ease",pointerEvents:hiwStep===3?"auto":"none"}}>
                <HiwPay active={hiwStep===3}/>
              </div>
            </div>

            {/* Descriptions */}
            <div style={{position:"relative",minHeight:isMobile?80:160}}>
              {HIW_STEPS.map((s,i)=>(
                <div key={i} style={{
                  position: i===0?"relative":"absolute",
                  top:0,left:0,right:0,
                  opacity:hiwStep===i?1:0,
                  transform:hiwStep===i?"translateY(0)":"translateY(30px)",
                  transition:"opacity .5s ease,transform .5s ease",
                  pointerEvents:hiwStep===i?"auto":"none",
                }}>
                  <p style={{fontFamily:"'Geist Mono',monospace",fontSize:13,lineHeight:1.6,color:T.sub,textAlign:isMobile?"center":"right",letterSpacing:".02em"}}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step counter */}
          <div style={{
            marginTop:32,
            display:"flex",fontFamily:"'Geist Mono',monospace",fontSize:13,letterSpacing:".16em",color:T.sub,gap:10,alignItems:"center",
          }}>
            <span style={{color:T.text,fontWeight:500,minWidth:"1.5ch",textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{String(hiwStep+1).padStart(2,"0")}</span>
            <span style={{opacity:.4}}>—</span>
            <span style={{opacity:.55}}>04</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ LOCATIONS ═══════════════════════════ */}
      <section id="locsZone" style={{padding:isMobile?"64px 20px":"160px 56px"}}>
        <div style={{maxWidth:1480,margin:"0 auto"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",marginBottom:80}}>
            <Reveal>
              <span style={{display:"inline-flex",alignItems:"center",gap:10,fontFamily:"'Geist Mono',monospace",fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:T.sub,padding:"7px 14px",border:`1px solid ${T.border}`,borderRadius:999,background:"rgba(125,57,235,.05)"}}>
                <span className="eyebrow-dot"/>Live locations
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h2 style={{fontSize:"clamp(40px,5.8vw,84px)",lineHeight:1,letterSpacing:"-.04em",fontWeight:600,marginTop:28,maxWidth:"18ch",color:T.text}}>
                Real-time, <span style={{fontFamily:"'Instrument Serif',serif",fontStyle:"italic",fontWeight:400,background:"linear-gradient(100deg,#7D39EB,#B2A8D2,#F0EAFA,#B2A8D2,#7D39EB)",backgroundSize:"300% 100%",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",animation:"shimmer 7s linear infinite"}}>right now</span>.
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p style={{marginTop:20,color:T.sub,fontSize:"clamp(15px,1.1vw,18px)",maxWidth:560,lineHeight:1.6,textAlign:"center"}}>
                A live look at Ezrakna's busiest lots, updated every second.
              </p>
            </Reveal>
          </div>

          <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:20}}>
            {featuredLots.length===0
              ? [0,1,2].map(i=>(
                <div key={i} style={{borderRadius:22,overflow:"hidden",background:"rgba(17,0,48,.4)",border:`1.5px solid rgba(125,57,235,.1)`,height:320,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(125,57,235,.3)",fontSize:32}}>🅿</div>
              ))
              : featuredLots.slice(0,3).map((s,i)=>(
                <LocationCard key={s.id} s={s} onViewDetails={onViewDetails} index={i}/>
              ))
            }
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOR BUSINESS ═══════════════════════ */}
      <section id="bizZone" style={{padding:isMobile?"64px 20px":"160px 56px",background:"linear-gradient(180deg,#040010,#0a0026 50%,#040010)",borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(125,57,235,.25),transparent 60%)",top:-200,right:-100,filter:"blur(40px)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(198,255,51,.12),transparent 60%)",bottom:-150,left:-80,filter:"blur(50px)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1480,margin:"0 auto",position:"relative"}}>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1.15fr",gap:96,alignItems:"flex-start"}}>

            {/* Left */}
            <div>
              <Reveal direction="left">
                <span style={{display:"inline-flex",alignItems:"center",gap:10,fontFamily:"'Geist Mono',monospace",fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:T.sub,padding:"7px 14px",border:`1px solid ${T.border}`,borderRadius:999,background:"rgba(125,57,235,.05)"}}>
                  <span className="eyebrow-dot" style={{background:"#C6FF33",boxShadow:"0 0 8px rgba(198,255,51,.6)"}}/>For operators
                </span>
              </Reveal>
              <Reveal direction="left" delay={100}>
                <h2 style={{fontSize:"clamp(48px,5.2vw,84px)",lineHeight:.95,letterSpacing:"-.04em",fontWeight:600,marginTop:24,marginBottom:24,maxWidth:"14ch",color:T.text}}>
                  Power your <span style={{fontFamily:"'Instrument Serif',serif",fontStyle:"italic",fontWeight:400,background:"linear-gradient(100deg,#7D39EB,#B2A8D2,#F0EAFA,#B2A8D2,#7D39EB)",backgroundSize:"300% 100%",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",animation:"shimmer 7s linear infinite"}}>parking</span> operation.
                </h2>
              </Reveal>
              <Reveal direction="left" delay={200}>
                <p style={{color:T.sub,fontSize:17,lineHeight:1.6,maxWidth:"42ch",marginBottom:36}}>
                  Lot operators using Ezrakna run leaner. We plug into your existing infrastructure — gates, cameras, billing — and turn it into a live, optimized system.
                </p>
              </Reveal>
              <Reveal direction="left" delay={300}>
                <button onClick={onBusiness} style={{display:"inline-flex",alignItems:"center",gap:10,padding:"14px 22px",borderRadius:999,background:"#C6FF33",color:"#07001A",fontWeight:500,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:15,boxShadow:"0 16px 40px -10px rgba(198,255,51,.5)",transition:"transform .2s,background .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#d4ff5c";e.currentTarget.style.transform="translateY(-2px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#C6FF33";e.currentTarget.style.transform="translateY(0)"}}>
                  Talk to sales
                  <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
                </button>
              </Reveal>
            </div>

            {/* Right: 2×2 grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {BIZ_CARDS.map((c,i)=>(
                <Reveal key={i} delay={i*80}>
                  <div className="bizcard" style={{padding:28,borderRadius:18,background:"rgba(22,0,55,.55)",border:"1px solid rgba(198,255,51,.18)",backdropFilter:"blur(8px)"}}>
                    <div style={{width:44,height:44,borderRadius:12,background:"rgba(198,255,51,.10)",border:"1px solid rgba(198,255,51,.25)",display:"grid",placeItems:"center",color:"#C6FF33"}}>
                      {c.svg}
                    </div>
                    <h3 style={{fontSize:18,fontWeight:600,color:T.text,marginTop:20,letterSpacing:"-.01em"}}>{c.title}</h3>
                    <p style={{marginTop:8,fontSize:14,color:T.sub,lineHeight:1.6}}>{c.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Metrics strip */}
          <Reveal delay={200}>
            <div style={{maxWidth:1480,marginTop:80,paddingTop:40,borderTop:`1px solid ${T.border}`,display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:32}}>
              {[["280+","Operators live",false],["EGP 1.2M","Avg. annual uplift",false],["99.9%","System uptime",true],["< 50ms","Plate scan",true]].map(([v,k,isGreen],i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",gap:8,position:"relative"}}>
                  {i>0 && !isMobile && <div style={{position:"absolute",left:-16,top:"6%",bottom:"6%",width:1,background:T.border}}/>}
                  <span style={{fontFamily:"'Geist Mono',monospace",fontSize:"clamp(28px,2.6vw,36px)",color:isGreen?"#C6FF33":T.text,fontWeight:500,letterSpacing:"-.02em",lineHeight:1,textShadow:isGreen?"0 0 24px rgba(198,255,51,.35)":"none"}}>
                    {v.includes("<") ? <><span style={{color:"#C6FF33"}}>&lt;</span>{v.replace("<","")}</> : v}
                  </span>
                  <span style={{fontSize:12,color:T.sub,textTransform:"uppercase",letterSpacing:".14em"}}>{k}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════════════ */}
      <section id="ctaZone" style={{position:"relative",padding:isMobile?"120px 20px":"180px 56px 160px",overflow:"hidden",textAlign:"center",background:"radial-gradient(ellipse 80% 60% at 50% 100%,rgba(125,57,235,.45),transparent 60%),radial-gradient(ellipse 60% 50% at 50% 0%,rgba(74,26,158,.35),transparent 60%)",zIndex:5}}>
        <div style={{maxWidth:800,margin:"0 auto",position:"relative"}}>
          <Reveal>
            <div style={{width:120,height:120,borderRadius:32,background:`linear-gradient(135deg,${T.purple},${T.purpleDim})`,display:"grid",placeItems:"center",margin:"0 auto 40px",position:"relative",animation:"markPulse 3s ease-in-out infinite",boxShadow:"0 0 60px rgba(125,57,235,.6),0 0 120px rgba(125,57,235,.3),inset 0 0 0 1px rgba(255,255,255,.1)"}}>
              <svg viewBox="0 0 64 64" width={64} height={64} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" style={{color:T.text,position:"relative",zIndex:1}}>
                <path d="M18 52V12h18a12 12 0 010 24H18"/>
              </svg>
              <div style={{position:"absolute",inset:-10,borderRadius:36,border:"1px solid rgba(125,57,235,.4)",animation:"ringExpand 3s ease-out infinite"}}/>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h2 style={{fontSize:"clamp(48px,7vw,112px)",lineHeight:.95,letterSpacing:"-.04em",fontWeight:600,maxWidth:"18ch",margin:"0 auto",color:T.text}}>
              Ready to park <span style={{fontFamily:"'Instrument Serif',serif",fontStyle:"italic",fontWeight:400,background:"linear-gradient(100deg,#7D39EB,#B2A8D2,#F0EAFA,#fff,#F0EAFA,#B2A8D2,#7D39EB)",backgroundSize:"300% 100%",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent",animation:"shimmer 7s linear infinite"}}>without the stress</span>?
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p style={{margin:"24px auto 0",color:T.sub,fontSize:17,maxWidth:520,lineHeight:1.6}}>
              Join 84,000+ drivers across Cairo and Giza. Free to start, no card required.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div style={{marginTop:48,display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={()=>{ user ? onEnter() : onAuthOpen("signup"); }} style={{display:"inline-flex",alignItems:"center",gap:10,padding:"14px 22px",borderRadius:999,fontSize:15,fontWeight:500,cursor:"pointer",border:"none",fontFamily:"inherit",background:"#C6FF33",color:"#07001A",boxShadow:"0 0 0 1px rgba(255,255,255,.12) inset,0 16px 40px -10px rgba(198,255,51,.55)",transition:"transform .2s,background .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#d4ff5c";e.currentTarget.style.transform="translateY(-2px)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="#C6FF33";e.currentTarget.style.transform="translateY(0)"}}>
                {user ? "Open Dashboard" : "Get started"}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
              </button>
              <button onClick={()=>scrollTo("featuresZone")} style={{display:"inline-flex",alignItems:"center",gap:10,padding:"14px 22px",borderRadius:999,fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:"transparent",color:T.text,border:`1px solid ${T.border}`,transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.purple;e.currentTarget.style.background="rgba(125,57,235,.08)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="transparent"}}>
                Learn more
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ══════════════════════════════ */}
      <footer style={{background:"#04000F",borderTop:`1px solid ${T.border}`,position:"relative",zIndex:5}}>
        <div style={{maxWidth:1480,margin:"0 auto",padding:isMobile?"64px 20px 32px":"88px 56px 48px",display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1.6fr 1fr 1fr 1fr",gap:isMobile?48:64}}>

          {/* Brand */}
          <div style={{gridColumn:isMobile?"1 / -1":"auto"}}>
            <div style={{fontWeight:700,fontSize:24,letterSpacing:"-.03em",marginBottom:22,cursor:"pointer"}} onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>
              <span style={{color:T.purple,textShadow:"0 0 22px rgba(125,57,235,.55)"}}>ez</span><span style={{color:T.text}}>rakna</span>
            </div>
            <p style={{color:T.sub,fontSize:14,lineHeight:1.65,maxWidth:"36ch"}}>AI-powered smart parking for Cairo drivers — find, reserve, and track spots in real time.</p>
            <div style={{display:"flex",gap:10,marginTop:24}}>
              {[
                { label:"Twitter", d:"M22 5.8a8.49 8.49 0 01-2.36.64 4.13 4.13 0 001.81-2.27 8.21 8.21 0 01-2.61 1 4.1 4.1 0 00-7 3.74A11.64 11.64 0 013 4.79a4.11 4.11 0 001.27 5.49A4.08 4.08 0 012.4 9.8v.05a4.1 4.1 0 003.3 4 4.07 4.07 0 01-1.86.07 4.11 4.11 0 003.83 2.84A8.22 8.22 0 012 18.34a11.59 11.59 0 006.29 1.85A11.6 11.6 0 0020 8.45v-.53A8.43 8.43 0 0022 5.8z" },
                { label:"Instagram", d:"M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.72 3.72 0 01-.9 1.38c-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zm0-2.16c-3.26 0-3.67.01-4.95.07C5.78.13 4.9.33 4.14.63a5.88 5.88 0 00-2.13 1.38A5.88 5.88 0 00.63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.8.73 1.48 1.38 2.13.65.65 1.33 1.07 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 002.13-1.38c.65-.65 1.07-1.33 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 00-1.38-2.13A5.88 5.88 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 105.84 12 6.16 6.16 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4zm6.41-11.85a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z" },
              ].map(s=>(
                <a key={s.label} href="#" aria-label={s.label} style={{width:36,height:36,borderRadius:"50%",border:`1px solid ${T.border}`,background:"rgba(125,57,235,.05)",display:"grid",placeItems:"center",color:T.sub,transition:"color .25s,border-color .25s,background .25s,transform .25s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color=T.text;e.currentTarget.style.borderColor=T.purple;e.currentTarget.style.background="rgba(125,57,235,.18)";e.currentTarget.style.transform="translateY(-2px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.color=T.sub;e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="rgba(125,57,235,.05)";e.currentTarget.style.transform="translateY(0)"}}>
                  <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor"><path d={s.d}/></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Cols */}
          {[
            { head:"Product", links:["Features","How it works","Locations","Pricing","Download"] },
            { head:"Company", links:["About","Careers","Press","Contact","For Business"] },
            { head:"Legal",   links:["Privacy","Terms of service","Cookies","Security","Status"] },
          ].map(col=>(
            <div key={col.head}>
              <h4 style={{fontSize:11,color:T.accent,textTransform:"uppercase",letterSpacing:".20em",fontWeight:600,marginBottom:22}}>{col.head}</h4>
              {col.links.map(l=>(
                <a key={l} href="#" className="fl" style={{color:T.sub,fontSize:14,padding:"7px 0",textDecoration:"none"}}>{l}</a>
              ))}
            </div>
          ))}
        </div>

        <div style={{borderTop:`1px solid ${T.border}`}}>
          <div style={{maxWidth:1480,margin:"0 auto",padding:isMobile?"20px":"28px 56px",display:"flex",justifyContent:"space-between",alignItems:"center",color:T.sub,fontSize:12,flexWrap:"wrap",gap:16}}>
            <span>© 2026 Ezrakna. All rights reserved.</span>
            <div style={{display:"flex",gap:24,alignItems:"center"}}>
              <span style={{fontFamily:"'Geist Mono',monospace",letterSpacing:".05em"}}>Made in Cairo.</span>
              {["Privacy","Terms"].map(l=>(
                <a key={l} href="#" style={{color:T.sub,textDecoration:"none",transition:"color .2s"}} onMouseEnter={e=>e.currentTarget.style.color=T.text} onMouseLeave={e=>e.currentTarget.style.color=T.sub}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
