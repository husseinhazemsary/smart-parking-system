import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { SPOTS, availColor, availLabel } from "../data/spots";

import Navbar from "../components/layout/Navbar";
import GlowBtn from "../components/ui/GlowBtn";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
const FEATURES = [
  { icon:"📡", title:"Real-Time Availability",  body:"See every spot update live — occupancy changes the moment a car enters or exits. No refresh needed." },
  { icon:"🧭", title:"Navigate to Your Spot",   body:"Get turn-by-turn directions straight to your reserved bay. No wandering, no guessing which level." },
  { icon:"⏱",  title:"Track Live Sessions",     body:"Watch your time and cost tick live. End your session remotely from the dashboard whenever you're done." },
  { icon:"💡", title:"Smart Parking Insights",  body:"See peak hours, cost trends and spot history to always choose the smartest option for your routine." },
  { icon:"💳", title:"Seamless Payments",       body:"Pay per session from your wallet. Full receipt and history always available — zero manual steps." },
];
const STATS = [
  { value:50,  suffix:"+",   label:"Parking Locations" },
  { value:12,  suffix:"k+",  label:"Active Drivers"    },
  { value:98,  suffix:"%",   label:"Satisfaction Rate" },
  { value:3,   suffix:" min",label:"Avg. Reserve Time" },
];
const B2B_FEATURES = [
  { icon:"🎯", title:"License Plate Recognition", body:"AI vision reads plates in <200ms. No specialised hardware — standard IP cameras only." },
  { icon:"📡", title:"Real-Time Occupancy",        body:"Slot-level status updated under 1 second via sensor fusion + overhead cameras." },
  { icon:"⚡", title:"Automated Billing",           body:"Entry-to-exit billing with dynamic pricing, overstay fees and EGP / card / wallet settlement." },
  { icon:"📊", title:"Analytics Dashboard",         body:"Heatmaps, revenue trends, peak prediction and 30+ metrics exportable to your BI stack." },
];

/* Image paths keyed by spot id — place files in src/assets/ */
const SPOT_IMAGES = {
  1: new URL("../assets/arkan-mall.jpg",    import.meta.url).href,
  2: new URL("../assets/ngu-parking.jpg",   import.meta.url).href,
  3: new URL("../assets/cairo-airport.jpg", import.meta.url).href,
  4: new URL("../assets/tahrir-street.jpg", import.meta.url).href,
  5: new URL("../assets/city-stars.jpg",    import.meta.url).href,
  6: new URL("../assets/dandy-mall.jpg",    import.meta.url).href,
};

/* ═══════════════════════════════════════════════════════════════
   SCROLL-REVEAL  (repeating — no disconnect)
═══════════════════════════════════════════════════════════════ */
function Reveal({ children, delay=0, direction="up", style={} }){
  const ref = useRef(null);
  const [vis, setVis] = useState(false);

  useEffect(()=>{
    const el = ref.current; if(!el) return;
    // Keep observing — toggle on every enter/leave so scroll-up → scroll-down re-animates
    const obs = new IntersectionObserver(([e])=>{
      setVis(e.isIntersecting);
    },{ threshold: 0.12 });
    obs.observe(el);
    return ()=> obs.disconnect();
  },[]);

  const from =
    direction==="up"    ? "translateY(44px)" :
    direction==="down"  ? "translateY(-44px)":
    direction==="left"  ? "translateX(-44px)":
                          "translateX(44px)";

  return(
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translate(0,0)" : from,
      transition: `opacity .6s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .6s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      willChange: "opacity, transform",
      ...style,
    }}>{children}</div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATED COUNTER  (repeating too)
═══════════════════════════════════════════════════════════════ */
function Counter({ target, suffix, duration=1600 }){
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const obs = new IntersectionObserver(([e])=>{
      if(e.isIntersecting){
        // restart counter every time it enters view
        clearInterval(timerRef.current);
        let cur = 0;
        const steps = 60, inc = target / steps;
        timerRef.current = setInterval(()=>{
          cur += inc;
          if(cur >= target){ setCount(target); clearInterval(timerRef.current); }
          else setCount(Math.floor(cur));
        }, duration / steps);
      } else {
        // reset when leaving so it replays on re-enter
        clearInterval(timerRef.current);
        setCount(0);
      }
    },{ threshold: 0.4 });
    obs.observe(el);
    return ()=>{ obs.disconnect(); clearInterval(timerRef.current); };
  },[target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════
   BADGE
═══════════════════════════════════════════════════════════════ */
function Badge({ children, color=T.purple }){
  return(
    <span style={{
      display:"inline-block", padding:"4px 14px", borderRadius:999,
      fontSize:12, fontWeight:700, background:`${color}22`, color, letterSpacing:.3,
    }}>{children}</span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO BACKGROUND — clean drifting geometry (no canvas)
═══════════════════════════════════════════════════════════════ */
function HeroBg(){
  return(
    <>
      {/* Grid */}
      <div style={{
        position:"absolute",inset:0,
        backgroundImage:`linear-gradient(rgba(125,57,235,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(125,57,235,.05) 1px,transparent 1px)`,
        backgroundSize:"60px 60px",pointerEvents:"none",
      }}/>
      {/* Large soft orb left */}
      <div style={{
        position:"absolute",top:"10%",left:"-5%",
        width:640,height:640,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(125,57,235,.13),transparent 68%)",
        pointerEvents:"none",animation:"heroDrift1 12s ease-in-out infinite",
      }}/>
      {/* Large soft orb right */}
      <div style={{
        position:"absolute",bottom:"5%",right:"-5%",
        width:480,height:480,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(125,57,235,.08),transparent 68%)",
        pointerEvents:"none",animation:"heroDrift2 15s ease-in-out infinite",
      }}/>
      {/* Small accent dot cluster */}
      {[[22,34],[78,18],[14,70],[88,58],[52,82]].map(([x,y],i)=>(
        <div key={i} style={{
          position:"absolute",left:`${x}%`,top:`${y}%`,
          width:3,height:3,borderRadius:"50%",
          background:"rgba(125,57,235,.35)",
          animation:`heroDrift${(i%3)+1} ${14+i*3}s ease-in-out infinite ${i*-2}s`,
          pointerEvents:"none",
        }}/>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO AVAILABILITY CARD
═══════════════════════════════════════════════════════════════ */
function HeroAvailabilityCard(){
  const [tick,setTick] = useState(0);
  useEffect(()=>{ const id=setInterval(()=>setTick(v=>v+1),2800); return()=>clearInterval(id); },[]);
  const rows=[
    {name:"Arkan Mall",      base:28,total:80, rate:15},
    {name:"NGU Parking Lot", base:12,total:60, rate:0 },
    {name:"Cairo Airport T2",base:3, total:200,rate:25},
    {name:"Tahrir St.",      base:45,total:100,rate:10},
  ].map((r,i)=>({...r, available:Math.max(r.base===0?0:1, r.base+Math.round(Math.sin(tick*(0.8+i*0.15))*Math.min(r.base,5)))}));

  return(
    <Card glow style={{padding:22,textAlign:"left",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(125,57,235,.2),transparent 70%)",pointerEvents:"none"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:11,color:T.sub,letterSpacing:1}}>LIVE AVAILABILITY</div>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:T.green,animation:"pls 1.5s infinite"}}/>
          <span style={{fontSize:11,color:T.green,fontWeight:600}}>Updating</span>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
        {rows.map(s=>{
          const ac=availColor(s.available,s.total);
          const pct=Math.round((1-s.available/s.total)*100);
          return(
            <div key={s.name} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",borderRadius:10,background:"rgba(255,255,255,.03)",border:"1px solid rgba(125,57,235,.12)"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:ac,flexShrink:0,boxShadow:`0 0 6px ${ac}66`,transition:"background .5s"}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,.06)",marginTop:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:ac,borderRadius:2,transition:"width 1s ease"}}/>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:700,color:ac,transition:"color .5s"}}>{s.available} free</div>
                <div style={{fontSize:10,color:T.sub}}>{s.rate===0?"Free":`EGP ${s.rate}/hr`}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,borderTop:"1px solid rgba(125,57,235,.1)",paddingTop:10}}>
        <span>Cairo & Giza · 6 zones</span>
        <span style={{color:T.purple,fontWeight:600}}>50+ locations →</span>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FEATURE CARD — auto-playing animations (float + icon pulse)
   + extra shimmer/lift on hover
═══════════════════════════════════════════════════════════════ */
function FeatureCard({icon,title,body,delay,index}){
  const [hov,setHov]=useState(false);
  // Stagger each card's float cycle so they don't all move in sync
  const floatDelay = index * 0.6;
  const floatDur   = 3.2 + index * 0.3;
  const iconDur    = 2.4 + index * 0.25;
  return(
    <Reveal delay={delay}>
      <div
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}
        style={{
          position:"relative", overflow:"hidden",
          borderRadius:18,
          border:`1.5px solid ${hov ? T.purple : "rgba(125,57,235,.22)"}`,
          background: hov ? "rgba(125,57,235,.1)" : "rgba(17,0,48,.6)",
          padding:26,
          /* Continuous gentle float — lifted extra on hover */
          animation:`featureFloat ${floatDur}s ease-in-out ${floatDelay}s infinite`,
          transform: hov ? "translateY(-8px) scale(1.02)" : undefined,
          boxShadow: hov
            ? `0 22px 52px rgba(125,57,235,.3), 0 0 0 1px rgba(125,57,235,.25), inset 0 1px 0 rgba(255,255,255,.07)`
            : `0 4px 24px rgba(125,57,235,.08)`,
          transition:"border-color .25s, background .25s, box-shadow .35s",
          cursor:"default",
        }}>

        {/* Shimmer sweep on hover */}
        <div style={{
          position:"absolute",inset:0,
          background:`linear-gradient(115deg, transparent 30%, rgba(255,255,255,.055) 50%, transparent 70%)`,
          transform: hov ? "translateX(110%)" : "translateX(-110%)",
          transition: hov ? "transform .5s ease" : "transform 0s",
          pointerEvents:"none", zIndex:1,
        }}/>

        {/* Top glow line — always subtly visible, bright on hover */}
        <div style={{
          position:"absolute",top:0,left:"15%",right:"15%",height:1,
          background:`linear-gradient(90deg,transparent,${T.purple},transparent)`,
          opacity: hov ? 0.9 : 0.25,
          transition:"opacity .3s",
          pointerEvents:"none", zIndex:2,
        }}/>

        <div style={{position:"relative",zIndex:3}}>
          {/* Icon — continuous pulse glow + bounce on hover */}
          <div style={{
            width:52,height:52,borderRadius:14,
            background:"rgba(125,57,235,.13)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:24, marginBottom:18,
            animation:`iconPulse ${iconDur}s ease-in-out ${floatDelay}s infinite`,
            transform: hov ? "translateY(-5px) rotate(-8deg) scale(1.15)" : undefined,
            boxShadow: hov ? `0 10px 24px rgba(125,57,235,.4)` : undefined,
            transition:"transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .3s",
          }}>{icon}</div>

          <div style={{
            fontSize:15,fontWeight:700,marginBottom:8,lineHeight:1.3,
            color: hov ? "#fff" : T.text,
            transition:"color .2s",
          }}>{title}</div>

          <div style={{
            color: hov ? "rgba(240,234,250,.72)" : T.sub,
            fontSize:13,lineHeight:1.75,
            transition:"color .2s",
          }}>{body}</div>
        </div>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOW-IT-WORKS STEP  (repeating scroll reveal)
═══════════════════════════════════════════════════════════════ */
function AnimatedStep({n,title,body,delay}){
  const ref=useRef(null);
  const [vis,setVis]=useState(false);
  const [hov,setHov]=useState(false);

  useEffect(()=>{
    const el=ref.current; if(!el) return;
    const obs=new IntersectionObserver(([e])=>{ setVis(e.isIntersecting); },{ threshold:0.25 });
    obs.observe(el); return()=>obs.disconnect();
  },[]);

  return(
    <div ref={ref}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        opacity:vis?1:0,
        transform:vis?"translateY(0)":"translateY(36px)",
        transition:`opacity .55s ease ${delay}ms, transform .55s ease ${delay}ms`,
        cursor:"default",
      }}>
      <div style={{position:"relative",width:72,height:72,margin:"0 auto 24px"}}>
        {/* Hover burst ring */}
        <div style={{
          position:"absolute",inset:-10,borderRadius:"50%",
          border:`1px solid ${T.purple}`,
          opacity:hov?.55:0,
          transform:hov?"scale(1)":"scale(1.5)",
          transition:"opacity .3s, transform .3s",
          pointerEvents:"none",
        }}/>
        {/* Scroll-enter burst ring */}
        <div style={{
          position:"absolute",inset:-8,borderRadius:"50%",
          border:`1px solid ${T.purple}`,
          opacity:vis?0:.6,
          transform:vis?"scale(1.6)":"scale(1)",
          transition:`opacity 1.1s ease ${delay+300}ms, transform 1.1s ease ${delay+300}ms`,
          pointerEvents:"none",
        }}/>
        {/* Spinning dashed ring */}
        <div style={{
          position:"absolute",inset:2,borderRadius:"50%",
          border:"2px dashed rgba(125,57,235,.28)",
          animation:vis?"spin 10s linear infinite":"none",
          pointerEvents:"none",
        }}/>
        {/* Core circle */}
        <div style={{
          position:"relative",zIndex:1,
          width:"100%",height:"100%",borderRadius:"50%",
          border:`2px solid ${T.purple}`,
          background:hov?"rgba(125,57,235,.2)":"rgba(125,57,235,.09)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:24,fontWeight:800,color:T.purple,
          boxShadow:hov?`0 0 32px rgba(125,57,235,.5)`:vis?`0 0 20px rgba(125,57,235,.2)`:"none",
          transition:"background .25s, box-shadow .25s",
        }}>{n}</div>
      </div>
      <div style={{
        fontSize:20,fontWeight:700,marginBottom:10,
        color:hov?T.purple:T.text,transition:"color .25s",
      }}>{title}</div>
      <div style={{color:T.sub,fontSize:14,lineHeight:1.75}}>{body}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOCATION CARD — simple 3-col grid
═══════════════════════════════════════════════════════════════ */

function LandingCard({s, onReserve, delay, index=0}){
  const ac = availColor(s.available, s.total);
  const al = availLabel(s.available, s.total);
  const [hov, setHov] = useState(false);

  // Stagger timings per card so they're never in sync
  const borderDur  = 3.8 + index * 0.55;
  const borderDel  = index * 1.1;
  const imgDur     = 9 + index * 1.5;
  const shimmerDel = index * 2.4;

  return(
    <Reveal delay={delay}>
      <div
        onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{
          borderRadius:18, overflow:"hidden",
          /* Border breathes between dim and purple */
          animation:`cardBorderBreathe ${borderDur}s ease-in-out ${borderDel}s infinite`,
          background:"rgba(17,0,48,.6)",
          transform: hov?"translateY(-6px)":"translateY(0)",
          boxShadow: hov?"0 20px 50px rgba(125,57,235,.22)":"none",
          transition:"transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s",
        }}>

        {/* Photo / fallback */}
        <div style={{height:140, position:"relative", overflow:"hidden"}}>
          <img
            src={SPOT_IMAGES[s.id]}
            alt={s.name}
            onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
            style={{
              width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", display:"block",
              /* Slow parallax drift on image */
              animation:`imgDrift ${imgDur}s ease-in-out ${index * -3}s infinite`,
              transform: hov?"scale(1.08)":"scale(1.04)",
              transition:"transform .5s cubic-bezier(.22,1,.36,1)",
            }}
          />
          <div style={{
            position:"absolute",inset:0, display:"none", alignItems:"center", justifyContent:"center",
            background:"linear-gradient(135deg,rgba(125,57,235,.4),rgba(10,3,32,.9))", fontSize:40,
          }}>🅿️</div>

          {/* Shimmer scan — sweeps across photo periodically */}
          <div style={{
            position:"absolute",inset:0,
            background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,.07) 50%,transparent 70%)",
            animation:`spotShimmer 4s ease-in-out ${shimmerDel}s infinite`,
            pointerEvents:"none",
          }}/>

          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(7,0,26,.55) 0%,transparent 60%)",pointerEvents:"none"}}/>
        </div>

        <div style={{padding:"16px 18px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{s.name}</div>
              <div style={{fontSize:12,color:T.sub}}>{s.address}</div>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:T.green,whiteSpace:"nowrap",marginLeft:8}}>{s.rate===0?"Free":`EGP ${s.rate}/hr`}</span>
          </div>

          <div style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                {/* Pulsing availability dot */}
                <div style={{
                  width:6,height:6,borderRadius:"50%",background:ac,flexShrink:0,
                  animation:"pls 1.8s ease-in-out infinite",
                }}/>
                <span style={{fontSize:12,color:ac,fontWeight:600}}>{al}</span>
              </div>
              <span style={{fontSize:12,color:T.sub}}>{s.available}/{s.total} spots</span>
            </div>
            <ProgressBar value={1-(s.available/s.total)} color={ac}/>
          </div>

          <div
            onClick={onReserve}
            style={{
              display:"inline-flex", alignItems:"center", gap:5,
              fontSize:13, fontWeight:700, color: hov ? "#fff" : T.purple,
              cursor:"pointer", transition:"color .2s",
            }}
            onMouseEnter={e=>{ e.currentTarget.style.gap="9px"; }}
            onMouseLeave={e=>{ e.currentTarget.style.gap="5px"; }}
          >
            View details
            <span style={{fontSize:15}}>→</span>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════════════════════════
   B2B FEATURE CARD
═══════════════════════════════════════════════════════════════ */
function B2BCard({icon,title,body,delay}){
  const [hov,setHov]=useState(false);
  return(
    <Reveal delay={delay}>
      <div
        onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{
          padding:22,borderRadius:18,
          border:hov?"1px solid rgba(240,180,41,.45)":"1px solid rgba(240,180,41,.15)",
          background:hov?"rgba(240,180,41,.08)":"rgba(240,180,41,.03)",
          position:"relative",overflow:"hidden",
          transform:hov?"translateY(-5px)":"translateY(0)",
          boxShadow:hov?"0 16px 44px rgba(240,180,41,.18)":"none",
          transition:"all .3s cubic-bezier(.22,1,.36,1)",
          cursor:"default",
        }}>
        <div style={{position:"absolute",top:-24,right:-24,width:80,height:80,borderRadius:"50%",background:"radial-gradient(circle,rgba(240,180,41,.12),transparent 70%)"}}/>
        <div style={{
          width:46,height:46,borderRadius:12,
          background:hov?"rgba(240,180,41,.2)":"rgba(240,180,41,.12)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:20,marginBottom:14,
          transform:hov?"scale(1.14) rotate(-6deg)":"scale(1) rotate(0)",
          boxShadow:hov?"0 6px 18px rgba(240,180,41,.3)":"none",
          transition:"transform .35s cubic-bezier(.34,1.56,.64,1), background .25s, box-shadow .3s",
        }}>{icon}</div>
        <div style={{fontSize:15,fontWeight:700,marginBottom:8,color:hov?"#F0B429":T.text,transition:"color .25s"}}>{title}</div>
        <div style={{color:T.sub,fontSize:13,lineHeight:1.7}}>{body}</div>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CTA EMOJI
═══════════════════════════════════════════════════════════════ */
function CTAEmoji(){
  const [hov,setHov]=useState(false);
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      display:"inline-block",fontSize:56,marginBottom:24,
      transform:hov?"scale(1.25) rotate(10deg)":"scale(1) rotate(0)",
      transition:"transform .4s cubic-bezier(.34,1.56,.64,1)",cursor:"default",
    }}>🅿️</div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
export default function Landing({onEnter,onAuthOpen,onBusiness,user}){
  const [scrolled,setScrolled]=useState(false);
  const {isMobile}=useBreakpoint();
  useEffect(()=>{ const h=()=>setScrolled(window.scrollY>40); window.addEventListener("scroll",h); return()=>window.removeEventListener("scroll",h); },[]);
  const scrollTo=id=>document.getElementById(id)?.scrollIntoView({behavior:"smooth"});

  return(
    <div style={{color:T.text,width:"100%",overflowX:"hidden"}}>
      <style>{`
        @keyframes cardBorderBreathe{0%,100%{border:1.5px solid rgba(125,57,235,.18);box-shadow:none}50%{border:1.5px solid rgba(125,57,235,.55);box-shadow:0 0 18px rgba(125,57,235,.12)}}
        @keyframes imgDrift{0%,100%{transform:scale(1.04) translateY(0)}50%{transform:scale(1.07) translateY(-6px)}}
        @keyframes spotShimmer{0%,100%{transform:translateX(-100%);opacity:0}40%{opacity:1}60%{opacity:1}80%,100%{transform:translateX(200%);opacity:0}}
        @keyframes featureFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes iconPulse{0%,100%{box-shadow:0 0 0 0 rgba(125,57,235,0);background:rgba(125,57,235,.13)}50%{box-shadow:0 0 16px 4px rgba(125,57,235,.22);background:rgba(125,57,235,.2)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes heroFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes heroBadge{from{opacity:0;transform:translateY(-12px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

        /* Clean drifting geometry for hero bg */
        @keyframes heroDrift1{0%,100%{transform:translate(0,0)}33%{transform:translate(18px,-22px)}66%{transform:translate(-12px,14px)}}
        @keyframes heroDrift2{0%,100%{transform:translate(0,0)}40%{transform:translate(-20px,16px)}70%{transform:translate(14px,-10px)}}
        @keyframes heroDrift3{0%{transform:translate(0,0) rotate(0deg)}100%{transform:translate(10px,-15px) rotate(180deg)}}

        .hero-badge{animation:heroBadge .6s .1s both cubic-bezier(.22,1,.36,1);}
        .hero-h1{animation:heroFadeUp .7s .25s both cubic-bezier(.22,1,.36,1);}
        .hero-p{animation:heroFadeUp .7s .4s both cubic-bezier(.22,1,.36,1);}
        .hero-btns{animation:heroFadeUp .7s .55s both cubic-bezier(.22,1,.36,1);}
        .hero-card{animation:heroFadeUp .8s .7s both cubic-bezier(.22,1,.36,1);}

        .stat-item{transition:transform .25s cubic-bezier(.22,1,.36,1);}
        .stat-item:hover{transform:translateY(-5px);}

        .footer-link{transition:color .2s,transform .2s;display:inline-block;}
        .footer-link:hover{color:${T.purple}!important;transform:translateX(3px);}

        .b2b-cta-btn{transition:transform .25s cubic-bezier(.22,1,.36,1),box-shadow .25s!important;}
        .b2b-cta-btn:hover{transform:translateY(-3px) scale(1.03)!important;box-shadow:0 10px 40px rgba(240,180,41,.5)!important;}

        .glow-btn-wrap{transition:transform .2s cubic-bezier(.22,1,.36,1),filter .2s;}
        .glow-btn-wrap:hover{transform:translateY(-2px);filter:brightness(1.1);}
      `}</style>

      <Navbar
        scrolled={scrolled} isMobile={isMobile} user={user}
        onEnter={onEnter} onAuthOpen={onAuthOpen} onBusiness={onBusiness}
        onLocations={()=>scrollTo("locations")}
        onPricing={()=>scrollTo("cta")}
        onForBusiness={()=>scrollTo("for-business")}
      />

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:isMobile?"110px 20px 80px":"120px 5% 80px",position:"relative",overflow:"hidden"}}>
        <HeroBg/>
        <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <span className="hero-badge" style={{padding:"4px 14px",borderRadius:999,fontSize:12,fontWeight:700,background:`${T.purple}22`,color:T.purple}}>
            🚀 Live across Cairo & Giza
          </span>
          <h1 className="hero-h1" style={{fontSize:"clamp(38px,7vw,88px)",fontWeight:800,lineHeight:1.05,letterSpacing:-2,margin:"22px 0 18px",maxWidth:820}}>
            Park smarter.<br/>
            <span style={{
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              backgroundImage:`linear-gradient(270deg,${T.purple},#C084FC,#9D50E8,${T.purple})`,
              backgroundSize:"300% 300%",animation:"gradientShift 4s ease infinite",
            }}>Not harder.</span>
          </h1>
          <p className="hero-p" style={{fontSize:"clamp(15px,2vw,19px)",color:T.sub,maxWidth:540,lineHeight:1.75,marginBottom:40}}>
            Find, reserve and track parking across Cairo in seconds. No more circling. No more guessing.
          </p>
          <div className="hero-btns" style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
            <div className="glow-btn-wrap"><GlowBtn onClick={onEnter}>{user?"Go to Dashboard":"Find Parking Now"}</GlowBtn></div>
            <div className="glow-btn-wrap"><GlowBtn outline onClick={()=>scrollTo("features")}>How It Works</GlowBtn></div>
          </div>
          <div className="hero-card" style={{marginTop:72,width:"100%",maxWidth:440,animation:"float 4s ease-in-out infinite"}}>
            <HeroAvailabilityCard/>
          </div>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════ */}
      <div style={{borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,padding:"36px 5%"}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:24}}>
          {STATS.map((s,i)=>(
            <Reveal key={s.label} delay={i*80}>
              <div className="stat-item" style={{textAlign:"center"}}>
                <div style={{fontSize:"clamp(28px,4vw,40px)",fontWeight:800,color:T.purple,letterSpacing:-1}}>
                  <Counter target={s.value} suffix={s.suffix}/>
                </div>
                <div style={{fontSize:13,color:T.sub,marginTop:4}}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ══════════════════════════════════════════════ */}
      <section id="features" style={{padding:isMobile?"64px 20px":"100px 5%"}}>
        <div style={{maxWidth:1240,margin:"0 auto"}}>
          <Reveal>
            <div style={{textAlign:"center",marginBottom:60}}>
              <Badge color={T.green}>✦ Features</Badge>
              <h2 style={{fontSize:"clamp(26px,4vw,52px)",fontWeight:800,letterSpacing:-1,margin:"16px 0 10px"}}>Everything you need to park well</h2>
              <p style={{color:T.sub,fontSize:16,maxWidth:480,margin:"0 auto"}}>Built for drivers who value their time.</p>
            </div>
          </Reveal>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isTabletVal()?"1fr 1fr":"repeat(5,1fr)",gap:18}}>
            {FEATURES.map((f,i)=>(
              <FeatureCard key={f.title} icon={f.icon} title={f.title} body={f.body} delay={i*80} index={i}/>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════ */}
      <section style={{padding:isMobile?"64px 20px":"80px 5%",background:"rgba(125,57,235,.04)",borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`}}>
        <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
          <Reveal>
            <h2 style={{fontSize:"clamp(26px,4vw,48px)",fontWeight:800,letterSpacing:-1,marginBottom:12}}>Three steps to a parked car</h2>
            <p style={{color:T.sub,fontSize:15,marginBottom:56}}>Simple by design. Fast by default.</p>
          </Reveal>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?"1":"3"},1fr)`,gap:48,position:"relative"}}>
            {!isMobile&&(
              <>
                <div style={{position:"absolute",top:35,left:"33.3%",right:"33.3%",height:1,background:`linear-gradient(90deg,${T.purple}44,${T.purple}99,${T.purple}44)`,zIndex:0}}/>
                <div style={{position:"absolute",top:35,left:"66.6%",right:0,height:1,background:`linear-gradient(90deg,${T.purple}44,${T.purple}99,${T.purple}44)`,zIndex:0}}/>
              </>
            )}
            {[
              {n:"1",title:"Search", body:"Browse spots across Cairo. Filter by price, category or distance from your destination."},
              {n:"2",title:"Reserve",body:"Pick your slot, confirm your vehicle, and lock it in — under 30 seconds."},
              {n:"3",title:"Park",   body:"Drive in, track your session live, and end it remotely whenever you're done."},
            ].map((s,i)=>(
              <AnimatedStep key={s.n} n={s.n} title={s.title} body={s.body} delay={i*170}/>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LOCATIONS ═════════════════════════════════════════════ */}
      <section id="locations" style={{padding:isMobile?"64px 20px":"100px 5%"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <Reveal>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:48,flexWrap:"wrap",gap:16}}>
              <div>
                <Badge color="#F59E0B">📍 Popular Spots</Badge>
                <h2 style={{fontSize:"clamp(24px,4vw,44px)",fontWeight:800,letterSpacing:-1,marginTop:12}}>Popular spots across Cairo</h2>
              </div>
              <div className="glow-btn-wrap">
                <GlowBtn small onClick={onEnter}>Browse All Locations</GlowBtn>
              </div>
            </div>
          </Reveal>

          <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?"1":isTabletVal()?"2":"3"},1fr)`,gap:20}}>
            {SPOTS.slice(0,3).map((s,i)=>(
              <LandingCard key={s.id} s={s} onReserve={onEnter} delay={i*100} index={i}/>
            ))}
          </div>
        </div>
      </section>

      {/* ══ B2B TEASER ════════════════════════════════════════════ */}
      <section id="for-business" style={{padding:isMobile?"64px 20px":"100px 5%",background:"linear-gradient(160deg,rgba(17,0,48,.95),rgba(7,0,26,1))",borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,position:"relative",overflow:"hidden"}}>
        {/* Subtle gold orb */}
        <div style={{position:"absolute",top:"15%",right:"5%",width:440,height:440,borderRadius:"50%",background:"radial-gradient(circle,rgba(240,180,41,.06),transparent 70%)",pointerEvents:"none",animation:"heroDrift2 18s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:"-10%",left:0,width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,rgba(125,57,235,.08),transparent 70%)",pointerEvents:"none",animation:"heroDrift1 20s ease-in-out infinite"}}/>
        <div style={{maxWidth:1100,margin:"0 auto"}}>

          <div style={{display:"flex",flexDirection:isMobile?"column":"row",justifyContent:"space-between",alignItems:isMobile?"flex-start":"flex-end",marginBottom:52,gap:24}}>
            <Reveal direction="left">
              <div>
                <Badge color="#F0B429">⚙️ For Parking Operators</Badge>
                <h2 style={{fontSize:"clamp(26px,4vw,52px)",fontWeight:800,letterSpacing:-1.5,margin:"16px 0 10px",maxWidth:600}}>
                  Own a parking facility?<br/>
                  <span style={{WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundImage:"linear-gradient(270deg,#F0B429,#FFD97D,#F0B429)",backgroundSize:"200% auto",animation:"shimmer 3s linear infinite"}}>Make it smart.</span>
                </h2>
                <p style={{color:T.sub,fontSize:15,maxWidth:500,lineHeight:1.8}}>
                  Deploy AI-powered license plate recognition, real-time occupancy and automated billing across your entire lot — in days, not months.
                </p>
              </div>
            </Reveal>
            <Reveal direction="right" style={{flexShrink:0}}>
              <GlowBtn gold onClick={onBusiness}>Explore for Business</GlowBtn>
            </Reveal>
          </div>

          <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?"1":isTabletVal()?"2":"4"},1fr)`,gap:16,marginBottom:48}}>
            {B2B_FEATURES.map((f,i)=>(
              <B2BCard key={f.title} icon={f.icon} title={f.title} body={f.body} delay={i*80}/>
            ))}
          </div>

          <Reveal>
            <div style={{display:"flex",gap:isMobile?20:48,flexWrap:"wrap",padding:"24px",borderRadius:16,background:"rgba(255,255,255,.02)",border:"1px solid rgba(240,180,41,.12)",justifyContent:"center"}}>
              {[["50+","Partner facilities"],["99.4%","LPR accuracy"],["< 3 days","Avg. go-live"],["EGP 0","Setup fee on Starter"]].map(([v,l],i)=>(
                <Reveal key={l} delay={i*70}>
                  <div className="stat-item" style={{textAlign:"center"}}>
                    <div style={{fontSize:"clamp(20px,2.5vw,28px)",fontWeight:800,color:"#F0B429",letterSpacing:-0.5}}>{v}</div>
                    <div style={{fontSize:12,color:T.sub,marginTop:3}}>{l}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section id="cta" style={{padding:isMobile?"64px 20px":"100px 5%",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 60%,rgba(125,57,235,.08),transparent 70%)",pointerEvents:"none"}}/>
        <Reveal>
          <div style={{maxWidth:640,margin:"0 auto",position:"relative"}}>
            <CTAEmoji/>
            <h2 style={{fontSize:"clamp(28px,4vw,56px)",fontWeight:800,letterSpacing:-1.5,marginBottom:16}}>Ready to park without the stress?</h2>
            <p style={{color:T.sub,fontSize:17,marginBottom:40,lineHeight:1.7}}>
              Join thousands of Cairo drivers. No subscription — pay only when you park.
            </p>
            <div className="glow-btn-wrap" style={{display:"inline-block"}}>
              <GlowBtn onClick={()=>{user?onEnter():onAuthOpen();}} style={{fontSize:17,padding:"16px 48px"}}>
                {user?"Open Dashboard":"Get Started"}
              </GlowBtn>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer style={{borderTop:`1px solid ${T.border}`,padding:`20px ${isMobile?"20px":"5%"}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <Reveal direction="left">
          <div style={{fontWeight:800,fontSize:18}}><span style={{color:T.purple}}>ez</span>rakna</div>
        </Reveal>
        <Reveal>
          <div style={{color:T.sub,fontSize:13}}>© 2025 ezrakna. Cairo, Egypt.</div>
        </Reveal>
        <Reveal direction="right">
          <div style={{display:"flex",gap:20}}>
            {["Privacy","Terms","Contact"].map(l=>(
              <a key={l} className="footer-link" href="#" style={{color:T.sub,fontSize:13,textDecoration:"none"}}>{l}</a>
            ))}
          </div>
        </Reveal>
      </footer>
    </div>
  );
}

function isTabletVal(){return typeof window!=="undefined"&&window.innerWidth<1024&&window.innerWidth>=768;}