import React, { useState, useEffect, useRef } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import GlowBtn from "../components/ui/GlowBtn";

const BT = {
  ...T,
  accent: "#C6FF33",
  accentDim: "rgba(198,255,51,.12)",
  teal: "#14B8A6",
  tealDim: "rgba(20,184,166,0.1)",
  surface2: "#130035",
};

const CORE_FEATURES = [
  { icon:"🎯", tag:"AI Vision",   title:"License Plate Recognition",   body:"Computer-vision models read plates in under 200ms — day, night, rain or motion blur. No hardware beyond a standard IP camera.", stat:"99.4%", statLabel:"Recognition accuracy", color:BT.purple },
  { icon:"📡", tag:"Real-Time",   title:"Live Occupancy Monitoring",    body:"Sensor fusion + overhead cameras give you slot-level truth: occupied, free, or reserved. Update frequency under 1 second.",       stat:"<1s",   statLabel:"Update latency",        color:BT.teal   },
  { icon:"⚡", tag:"Billing",     title:"Automated Billing Engine",     body:"Entry-to-exit billing with dynamic pricing rules, overstay penalties, subscription discounts and EGP / card / wallet settlement.", stat:"0",     statLabel:"Manual steps",          color:BT.accent   },
  { icon:"📊", tag:"Analytics",   title:"Operator Dashboard",           body:"Hourly heatmaps, revenue trends, vehicle dwell-times and peak prediction — exportable to CSV or pushed to your BI stack via API.", stat:"30+",   statLabel:"Metrics tracked",        color:"#C084FC" },
  { icon:"🔗", tag:"Integration", title:"API & Webhooks",               body:"REST + WebSocket API with OpenAPI docs. Connect your gate controllers, POS, ERP, or any cloud platform in hours.",              stat:"REST",  statLabel:"+ WebSocket API",        color:BT.teal   },
  { icon:"🛡", tag:"Security",    title:"Incident Alerts",              body:"Real-time alerts for unauthorized vehicles, tailgating, wrong-way entry and capacity breaches — delivered via SMS, email or webhook.", stat:"24/7", statLabel:"Monitoring",            color:BT.accent   },
];

const HOW_IT_WORKS = [
  { n:"01", icon:"📷", title:"Install Cameras",   body:"Mount standard IP cameras at entry/exit and overhead lanes. Our team calibrates remotely — no on-site visits required in most cases." },
  { n:"02", icon:"🧠", title:"Connect the Brain", body:"Our edge device or cloud connector ingests feeds, runs inference and syncs state to your operator dashboard in real-time." },
  { n:"03", icon:"📱", title:"Go Live",            body:"Drivers see live availability in the ezrakna app. Gates open automatically. Billing starts the moment a plate is matched." },
  { n:"04", icon:"📈", title:"Optimise & Scale",  body:"Use the analytics dashboard to tune pricing, spot trends and scale to as many lots as you need — one dashboard, any footprint." },
];

const PLANS = [
  {
    name:"Starter", price:"EGP 2,500", period:"/month",
    desc:"Perfect for a single parking facility.", badge:null,
    features:["Up to 100 parking slots","LPR for 2 entry/exit lanes","Real-time occupancy dashboard","Automated billing & receipts","7-day analytics history","Email support"],
    cta:"Start Free Trial", outline:true,
  },
  {
    name:"Professional", price:"EGP 7,500", period:"/month",
    desc:"For malls, hospitals and multi-floor facilities.", badge:"Most Popular",
    features:["Up to 500 parking slots","LPR for up to 8 lanes","Slot-level occupancy heatmaps","Dynamic & surge pricing rules","90-day analytics + CSV export","Incident alerts (SMS + email)","REST API access","Priority support & SLA"],
    cta:"Request a Demo", outline:false,
  },
  {
    name:"Enterprise", price:"Custom", period:"",
    desc:"Multi-site. Government. Airports. Tailored.", badge:null,
    features:["Unlimited slots & sites","Unlimited LPR lanes","White-label driver app","BI & ERP integration","Dedicated cloud or on-premise","Custom SLA & uptime guarantee","Dedicated success manager"],
    cta:"Contact Sales", outline:true,
  },
];

const INTEGRATIONS = [
  {name:"Hikvision",icon:"📷"},{name:"Dahua",icon:"🎥"},{name:"Stripe",icon:"💳"},
  {name:"Fawry",icon:"🏧"},{name:"Odoo ERP",icon:"🔗"},{name:"Power BI",icon:"📊"},
  {name:"Slack",icon:"💬"},{name:"WhatsApp",icon:"📱"},
];

const formInputStyle = {
  width:"100%", height:48, borderRadius:12,
  border:`1px solid ${BT.border}`, background:"rgba(255,255,255,.04)",
  color:BT.text, fontFamily:"inherit", fontSize:14, padding:"0 16px",
  outline:"none", boxSizing:"border-box",
};
const glowBtnStyle = {
  padding:"14px 28px", borderRadius:12, border:"none",
  background:`linear-gradient(135deg,${BT.purple},#9D50E8)`,
  color:"#fff", fontFamily:"inherit", fontSize:15, fontWeight:700,
  cursor:"pointer", boxShadow:`0 4px 24px rgba(125,57,235,.4)`,
};

function Reveal({ children, delay=0, direction="up", style={} }){
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const obs = new IntersectionObserver(([e])=>setVis(e.isIntersecting),{threshold:0.1});
    obs.observe(el); return()=>obs.disconnect();
  },[]);
  const from = direction==="up"?"translateY(40px)":direction==="left"?"translateX(-40px)":direction==="right"?"translateX(40px)":"translateY(-40px)";
  return(
    <div ref={ref} style={{
      opacity:vis?1:0, transform:vis?"translate(0)":from,
      transition:`opacity .65s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .65s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

function Tag({ children, color }){
  return(
    <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:999,
      fontSize:10, fontWeight:700, letterSpacing:0.8, background:color+"20", color }}>
      {children}
    </span>
  );
}

function Modal({ open, onClose, children, maxWidth=520 }){
  if(!open) return null;
  return(
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(7,0,26,.75)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:BT.surface,borderRadius:20,border:`1px solid ${BT.border}`,width:"100%",maxWidth,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.6)" }}>
        {children}
      </div>
    </div>
  );
}

function DemoForm({ onClose }){
  const [form,setForm] = useState({name:"",email:"",org:"",slots:"",role:""});
  const [sent,setSent] = useState(false);
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const submit = () => { if(form.name&&form.email&&form.org) setSent(true); };
  if(sent) return(
    <div style={{textAlign:"center",padding:"40px 24px"}}>
      <div style={{fontSize:56,marginBottom:16}}>🎉</div>
      <div style={{fontSize:22,fontWeight:800,marginBottom:8}}>Request received!</div>
      <div style={{color:BT.sub,fontSize:14,marginBottom:28,lineHeight:1.7}}>Our solutions team will reach out to {form.email} within one business day.</div>
      <button onClick={onClose} style={glowBtnStyle}>Done</button>
    </div>
  );
  return(
    <div style={{padding:"32px 28px"}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>Request a Live Demo</div>
        <div style={{color:BT.sub,fontSize:13}}>See the full system in action — usually 30 minutes.</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[{k:"name",ph:"Your full name"},{k:"email",ph:"Work email address",type:"email"},{k:"org",ph:"Organisation / company name"}]
          .map(({k,ph,type})=>(
            <input key={k} value={form[k]} onChange={set(k)} placeholder={ph} type={type||"text"} style={formInputStyle}/>
          ))}
        <select value={form.slots} onChange={set("slots")} style={{...formInputStyle,color:form.slots?BT.text:BT.sub}}>
          <option value="" disabled>Number of parking slots</option>
          {["1–50","51–200","201–500","500+"].map(o=><option key={o} value={o}>{o}</option>)}
        </select>
        <select value={form.role} onChange={set("role")} style={{...formInputStyle,color:form.role?BT.text:BT.sub}}>
          <option value="" disabled>Your role</option>
          {["Facility Manager","CTO / IT Director","Operations Manager","Business Owner","Government / Municipality","Other"].map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div style={{display:"flex",gap:10,marginTop:20}}>
        <button onClick={onClose} style={{flex:1,padding:14,borderRadius:12,border:`1px solid ${BT.border}`,background:"transparent",color:BT.sub,fontFamily:"inherit",fontSize:14,cursor:"pointer"}}>Cancel</button>
        <button onClick={submit} style={{...glowBtnStyle,flex:2}}>Book My Demo</button>
      </div>
    </div>
  );
}

function BusinessHero({ onDemo, isMobile }){
  const scrollToPricing = () =>
    document.getElementById("business-pricing")?.scrollIntoView({behavior:"smooth"});

  return(
    <section style={{ minHeight:"90vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:isMobile?"100px 20px 60px":"120px 5% 80px",position:"relative",overflow:"hidden" }}>
      {/* BG orbs — auto-drifting, no rings */}
      <div style={{position:"absolute",top:"10%",left:"8%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(125,57,235,.18),transparent 70%)",pointerEvents:"none",animation:"bDrift1 14s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:"8%",right:"5%",width:380,height:380,borderRadius:"50%",background:"radial-gradient(circle,rgba(20,184,166,.1),transparent 70%)",pointerEvents:"none",animation:"bDrift2 17s ease-in-out infinite"}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(125,57,235,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(125,57,235,.05) 1px,transparent 1px)`,backgroundSize:"60px 60px",pointerEvents:"none"}}/>

      {/* Sequential entry animations */}
      <span style={{padding:"4px 14px",borderRadius:999,fontSize:12,fontWeight:700,background:`${BT.teal}22`,color:BT.teal,marginBottom:20,animation:"bFadeUp .6s .05s both cubic-bezier(.22,1,.36,1)"}}>
        ⚙️ For Parking Operators & Businesses
      </span>

      <h1 style={{fontSize:"clamp(36px,6.5vw,82px)",fontWeight:800,lineHeight:1.05,letterSpacing:-2,margin:"0 0 22px",maxWidth:900,animation:"bFadeUp .7s .2s both cubic-bezier(.22,1,.36,1)"}}>
        Turn your parking lot<br/>into a{" "}
        <span style={{WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundImage:`linear-gradient(270deg,${BT.accent},#D8FF70,${BT.accent})`,backgroundSize:"200% auto",animation:"bGradShift 3s linear infinite"}}>
          smart revenue machine.
        </span>
      </h1>

      <p style={{fontSize:"clamp(15px,1.8vw,19px)",color:BT.sub,maxWidth:560,lineHeight:1.8,marginBottom:44,animation:"bFadeUp .7s .35s both cubic-bezier(.22,1,.36,1)"}}>
        AI-powered license plate recognition, real-time occupancy, automated billing and analytics — deployed in days, not months.
      </p>

      <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginBottom:64,animation:"bFadeUp .7s .5s both cubic-bezier(.22,1,.36,1)"}}>
        <GlowBtn onClick={onDemo}>Book a Free Demo</GlowBtn>
        <GlowBtn outline onClick={scrollToPricing}>View Pricing</GlowBtn>
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:isMobile?24:48,flexWrap:"wrap",justifyContent:"center",borderTop:`1px solid ${BT.border}`,paddingTop:32,animation:"bFadeUp .8s .65s both cubic-bezier(.22,1,.36,1)"}}>
        {[["50+","Locations live"],["1M+","Transactions/yr"],["99.4%","LPR accuracy"],["< 3 days","Avg. go-live"]].map(([v,l])=>(
          <div key={l} style={{textAlign:"center"}}>
            <div style={{fontSize:"clamp(22px,3vw,32px)",fontWeight:800,color:BT.purple,letterSpacing:-1}}>{v}</div>
            <div style={{fontSize:12,color:BT.sub,marginTop:4}}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks({ isMobile }){
  return(
    <section style={{padding:isMobile?"64px 20px":"96px 5%",background:"rgba(125,57,235,.04)",borderTop:`1px solid ${BT.border}`,borderBottom:`1px solid ${BT.border}`}}>
      <div style={{maxWidth:1000,margin:"0 auto",textAlign:"center"}}>
        <Reveal><Tag color={BT.teal}>⚡ Setup</Tag></Reveal>
        <Reveal delay={80}><h2 style={{fontSize:"clamp(26px,4vw,50px)",fontWeight:800,letterSpacing:-1,margin:"16px 0 56px"}}>From cameras to live in days</h2></Reveal>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?1:4},1fr)`,gap:32,textAlign:"left"}}>
          {HOW_IT_WORKS.map((s,i)=>(
            <Reveal key={s.n} delay={i*100}>
              <div style={{
                position:"relative", cursor:"default",
                transition:"transform .3s cubic-bezier(.22,1,.36,1)",
              }}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-6px)"}
                onMouseLeave={e=>e.currentTarget.style.transform=""}>
                {!isMobile && i<HOW_IT_WORKS.length-1 && (
                  <div style={{position:"absolute",top:28,left:"calc(100% - 8px)",width:"calc(100% - 48px)",height:1,background:`linear-gradient(90deg,${BT.purple}44,transparent)`,zIndex:0}}/>
                )}
                {/* Icon — auto glow pulse */}
                <div style={{
                  width:56,height:56,borderRadius:16,
                  background:"rgba(125,57,235,.12)",border:`1.5px solid ${BT.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:24,marginBottom:16,position:"relative",zIndex:1,
                  animation:`bIconGlow ${3+i*.4}s ease-in-out ${i*.65}s infinite`,
                }}>{s.icon}</div>
                <div style={{fontSize:11,color:BT.purple,fontWeight:700,letterSpacing:1,marginBottom:6}}>{s.n}</div>
                <div style={{fontSize:17,fontWeight:700,marginBottom:10}}>{s.title}</div>
                <div style={{color:BT.sub,fontSize:14,lineHeight:1.75}}>{s.body}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoreFeatures({ isMobile }){
  return(
    <section style={{padding:isMobile?"64px 20px":"100px 5%"}}>
      <div style={{maxWidth:1160,margin:"0 auto"}}>
        <Reveal>
          <div style={{textAlign:"center",marginBottom:60}}>
            <Tag color={BT.purple}>✦ Platform</Tag>
            <h2 style={{fontSize:"clamp(26px,4vw,52px)",fontWeight:800,letterSpacing:-1,margin:"16px 0 10px"}}>Every tool you need to run a smart lot</h2>
            <p style={{color:BT.sub,fontSize:16,maxWidth:480,margin:"0 auto"}}>One platform. Hardware-agnostic. Scales from a 30-slot office lot to a 3,000-slot airport terminal.</p>
          </div>
        </Reveal>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?1:3},1fr)`,gap:20}}>
          {CORE_FEATURES.map((f,i)=>(
            <Reveal key={f.title} delay={i*70}>
              <div style={{
                borderRadius:20,border:`1px solid ${BT.border}`,
                background:BT.surface,padding:28,position:"relative",overflow:"hidden",
                /* auto float — staggered */
                animation:`bFloat ${3.5+i*.35}s ease-in-out ${i*.5}s infinite`,
                transition:"transform .3s,box-shadow .3s,border-color .25s",
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px) scale(1.01)";e.currentTarget.style.boxShadow=`0 24px 56px ${f.color}28`;e.currentTarget.style.borderColor=f.color+"55";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor="";}}>
                <div style={{position:"absolute",top:-40,right:-40,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,${f.color}22,transparent 70%)`}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                  <div style={{
                    width:52,height:52,borderRadius:14,background:f.color+"18",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
                    animation:`bIconGlow ${2.8+i*.3}s ease-in-out ${i*.45}s infinite`,
                  }}>{f.icon}</div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:22,fontWeight:800,color:f.color,letterSpacing:-1}}>{f.stat}</div>
                    <div style={{fontSize:10,color:BT.sub}}>{f.statLabel}</div>
                  </div>
                </div>
                <Tag color={f.color}>{f.tag}</Tag>
                <div style={{fontSize:17,fontWeight:700,margin:"10px 0 8px"}}>{f.title}</div>
                <div style={{color:BT.sub,fontSize:13,lineHeight:1.75}}>{f.body}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview({ isMobile }){
  const [tick,setTick]=useState(0);
  useEffect(()=>{ const id=setInterval(()=>setTick(v=>v+1),2600); return()=>clearInterval(id); },[]);
  const nowVal = Math.round(58+Math.sin(tick*.4)*7);
  const bars=[
    {h:"8AM",v:22},{h:"9AM",v:58},{h:"10AM",v:74},{h:"11AM",v:81},
    {h:"12PM",v:93},{h:"1PM",v:88},{h:"2PM",v:76},{h:"3PM",v:69},
    {h:"4PM",v:85},{h:"5PM",v:91},{h:"6PM",v:72},
    {h:"Now",v:nowVal,current:true},
  ];
  return(
    <section style={{padding:isMobile?"64px 20px":"96px 5%",background:"rgba(125,57,235,.04)",borderTop:`1px solid ${BT.border}`,borderBottom:`1px solid ${BT.border}`}}>
      <div style={{maxWidth:1100,margin:"0 auto",display:"flex",gap:56,alignItems:"center",flexDirection:isMobile?"column":"row"}}>
        <Reveal direction="left" style={{flex:1}}>
          <Tag color={BT.accent}>📊 Analytics</Tag>
          <h2 style={{fontSize:"clamp(24px,3.5vw,46px)",fontWeight:800,letterSpacing:-1,margin:"16px 0 16px",lineHeight:1.1}}>Your parking lot,<br/>fully visible.</h2>
          <p style={{color:BT.sub,fontSize:15,lineHeight:1.8,marginBottom:28}}>The operator dashboard surfaces everything from live slot maps to 12-month revenue forecasts. Drill from the big picture down to a single transaction in two clicks.</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[
              {icon:"🗺",label:"Live slot heatmap",sub:"See exactly which bays are free, occupied or reserved — updated every second."},
              {icon:"💰",label:"Revenue analytics",sub:"Daily, weekly and monthly trends. Compare periods. Export to CSV."},
              {icon:"🔮",label:"Peak prediction",sub:"ML model forecasts busy periods so you can enable surge pricing ahead of time."},
            ].map((it,i)=>(
              <div key={it.label} style={{
                display:"flex",gap:12,padding:"14px",borderRadius:14,
                background:"rgba(255,255,255,.03)",border:`1px solid ${BT.border}`,
                animation:`bFloat ${4+i*.5}s ease-in-out ${i*.7}s infinite`,
                transition:"border-color .25s,background .25s",cursor:"default",
              }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=BT.accent+"55";e.currentTarget.style.background="rgba(240,180,41,.05)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=BT.border;e.currentTarget.style.background="rgba(255,255,255,.03)";}}>
                <div style={{width:40,height:40,borderRadius:10,background:BT.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{it.icon}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{it.label}</div>
                  <div style={{fontSize:12,color:BT.sub,lineHeight:1.6}}>{it.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal direction="right" style={{flex:1,maxWidth:480,width:"100%"}}>
          <div style={{borderRadius:20,border:`1px solid ${BT.border}`,background:BT.surface,padding:24,boxShadow:"0 20px 60px rgba(0,0,0,.4)"}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:16,display:"flex",justifyContent:"space-between"}}>
              <span>Live Occupancy — Today</span>
              <span style={{color:BT.teal,fontSize:12,display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:BT.teal,display:"inline-block",animation:"pls 1.5s infinite"}}/>Live
              </span>
            </div>
            {bars.map(b=>(
              <div key={b.h} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{width:36,fontSize:10,color:BT.sub,flexShrink:0,textAlign:"right"}}>{b.h}</div>
                <div style={{flex:1,height:14,borderRadius:4,background:"rgba(255,255,255,.04)",overflow:"hidden"}}>
                  <div style={{
                    height:"100%",width:`${b.v}%`,borderRadius:4,
                    background:b.current?`linear-gradient(90deg,${BT.teal},${BT.purple})`:b.v>80?`linear-gradient(90deg,${BT.red}88,${BT.red})`:`linear-gradient(90deg,${BT.purple}88,${BT.purple})`,
                    transition:"width .8s ease",
                  }}/>
                </div>
                <div style={{width:30,fontSize:10,color:b.v>80?BT.red:BT.sub,fontWeight:b.current?700:400}}>{b.v}%</div>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:16}}>
              {[{l:"Revenue today",v:"EGP 4,280",c:BT.green},{l:"Sessions today",v:"142",c:BT.purple},{l:"Avg. dwell",v:"48 min",c:BT.accent}].map((s,i)=>(
                <div key={s.l} style={{padding:"10px 8px",borderRadius:10,background:"rgba(255,255,255,.03)",border:`1px solid ${BT.border}`,textAlign:"center",animation:`bPulse ${3.2+i*.4}s ease-in-out ${i*.6}s infinite`}}>
                  <div style={{fontSize:14,fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:9,color:BT.sub,marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Integrations({ isMobile }){
  return(
    <section style={{padding:isMobile?"64px 20px":"80px 5%"}}>
      <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
        <Reveal><Tag color={BT.sub}>🔗 Integrations</Tag></Reveal>
        <Reveal delay={80}><h2 style={{fontSize:"clamp(22px,3vw,40px)",fontWeight:800,letterSpacing:-1,margin:"14px 0 10px"}}>Works with the tools you already use</h2></Reveal>
        <Reveal delay={140}><p style={{color:BT.sub,fontSize:14,marginBottom:40}}>Hardware-agnostic, API-first. Plug in existing cameras, payment rails and reporting tools.</p></Reveal>
        <div style={{display:"flex",flexWrap:"wrap",gap:12,justifyContent:"center"}}>
          {INTEGRATIONS.map((it,i)=>(
            <Reveal key={it.name} delay={i*55}>
              <div style={{
                display:"flex",alignItems:"center",gap:8,
                padding:"10px 18px",borderRadius:12,
                border:`1px solid ${BT.border}`,background:BT.surface,
                fontSize:14,fontWeight:600,cursor:"default",
                transition:"transform .25s cubic-bezier(.34,1.56,.64,1),border-color .2s,background .2s",
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px) scale(1.05)";e.currentTarget.style.borderColor="rgba(125,57,235,.5)";e.currentTarget.style.background="rgba(125,57,235,.08)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor=BT.border;e.currentTarget.style.background=BT.surface;}}>
                <span>{it.icon}</span>{it.name}
              </div>
            </Reveal>
          ))}
          <Reveal delay={INTEGRATIONS.length*55}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:12,border:`1px dashed ${BT.border}`,background:"transparent",fontSize:14,color:BT.sub}}>
              + More via API
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Pricing({ onDemo, isMobile }){
  return(
    <section id="business-pricing" style={{padding:isMobile?"64px 20px":"100px 5%",background:"rgba(125,57,235,.04)",borderTop:`1px solid ${BT.border}`,borderBottom:`1px solid ${BT.border}`}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <Reveal>
          <div style={{textAlign:"center",marginBottom:56}}>
            <Tag color={BT.green}>💰 Pricing</Tag>
            <h2 style={{fontSize:"clamp(26px,4vw,52px)",fontWeight:800,letterSpacing:-1,margin:"16px 0 10px"}}>Transparent pricing. No surprises.</h2>
            <p style={{color:BT.sub,fontSize:16,maxWidth:440,margin:"0 auto"}}>All plans include onboarding support and a 14-day free trial.</p>
          </div>
        </Reveal>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?1:3},1fr)`,gap:20,alignItems:"start"}}>
          {PLANS.map((plan,i)=>(
            <Reveal key={plan.name} delay={i*110}>
              <div style={{
                borderRadius:20,
                border:`${plan.badge?"2px":"1px"} solid ${plan.badge?BT.purple:BT.border}`,
                background:plan.badge?`linear-gradient(160deg,rgba(125,57,235,.12),${BT.surface})`:BT.surface,
                padding:"28px 24px",position:"relative",
                boxShadow:plan.badge?`0 8px 40px rgba(125,57,235,.2)`:"none",
                transition:"transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s",cursor:"default",
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px)";e.currentTarget.style.boxShadow="0 28px 64px rgba(125,57,235,.28)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=plan.badge?"0 8px 40px rgba(125,57,235,.2)":"none";}}>
                {plan.badge&&(
                  <div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",padding:"4px 14px",borderRadius:999,background:BT.purple,color:"#fff",fontSize:11,fontWeight:700}}>{plan.badge}</div>
                )}
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>{plan.name}</div>
                  <div style={{fontSize:12,color:BT.sub,marginBottom:16}}>{plan.desc}</div>
                  <div>
                    <span style={{fontSize:36,fontWeight:800,letterSpacing:-1.5}}>{plan.price}</span>
                    <span style={{fontSize:14,color:BT.sub}}>{plan.period}</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
                  {plan.features.map(f=>(
                    <div key={f} style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:13,color:BT.text}}>
                      <span style={{color:BT.green,flexShrink:0}}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <button onClick={onDemo} style={{
                  width:"100%",padding:14,borderRadius:12,fontFamily:"inherit",
                  fontSize:14,fontWeight:700,cursor:"pointer",
                  transition:"transform .2s,box-shadow .2s",
                  ...(plan.outline
                    ?{border:`1.5px solid ${BT.purple}`,background:"transparent",color:BT.purple}
                    :{border:"none",background:`linear-gradient(135deg,${BT.purple},#9D50E8)`,color:"#fff",boxShadow:`0 4px 20px rgba(125,57,235,.35)`}
                  ),
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.boxShadow="0 8px 28px rgba(125,57,235,.45)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
                  {plan.cta}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function BusinessCTA({ onDemo, isMobile }){
  return(
    <section style={{padding:isMobile?"64px 20px":"100px 5%",textAlign:"center"}}>
      <Reveal>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{fontSize:56,marginBottom:24,display:"inline-block",animation:"bPulse 3s ease-in-out infinite"}}>🚀</div>
          <h2 style={{fontSize:"clamp(26px,4vw,54px)",fontWeight:800,letterSpacing:-1.5,marginBottom:16}}>Ready to modernise your lot?</h2>
          <p style={{color:BT.sub,fontSize:16,marginBottom:40,lineHeight:1.8}}>
            Join facilities across Cairo running smarter, leaner operations with ezrakna for Business. Book a 30-minute live demo — free, no commitment.
          </p>
          <GlowBtn onClick={onDemo} style={{fontSize:17,padding:"16px 52px"}}>Book Free Demo</GlowBtn>
          <div style={{marginTop:16,fontSize:13,color:BT.sub}}>
            Or email us at <span style={{color:BT.purple}}>business@ezrakna.io</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function BusinessPage({ onBack }){
  const { isMobile } = useBreakpoint();
  const [demoOpen, setDemoOpen] = useState(false);

  return(
    <div style={{color:BT.text,width:"100%",overflowX:"hidden"}}>
      <style>{`
        @keyframes bFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bGradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes bDrift1{0%,100%{transform:translate(0,0)}40%{transform:translate(18px,-22px)}70%{transform:translate(-10px,12px)}}
        @keyframes bDrift2{0%,100%{transform:translate(0,0)}35%{transform:translate(-16px,14px)}65%{transform:translate(12px,-8px)}}
        @keyframes bFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes bIconGlow{0%,100%{box-shadow:0 0 0 0 rgba(125,57,235,0)}50%{box-shadow:0 0 20px 4px rgba(125,57,235,.22)}}
        @keyframes bPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes pls{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(2.2);opacity:0}}
      `}</style>

      {/* Top bar */}
      <div style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,
        background:"rgba(7,0,26,.85)",backdropFilter:"blur(16px)",
        borderBottom:`1px solid ${BT.border}`,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:isMobile?"14px 20px":"14px 5%",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:BT.sub,cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",alignItems:"center",gap:4,transition:"color .2s"}}
            onMouseEnter={e=>e.currentTarget.style.color=BT.text}
            onMouseLeave={e=>e.currentTarget.style.color=BT.sub}>
            ← Back
          </button>
          <div style={{width:1,height:18,background:BT.border}}/>
          <div style={{fontWeight:800,fontSize:18,letterSpacing:-0.5}}>
            <span style={{color:BT.purple}}>ez</span>rakna{" "}
            <span style={{fontSize:12,fontWeight:600,color:BT.accent,verticalAlign:"middle",padding:"2px 8px",borderRadius:6,background:BT.accentDim}}>for Business</span>
          </div>
        </div>
        <GlowBtn small noArrow onClick={()=>setDemoOpen(true)}>Book Demo</GlowBtn>
      </div>

      <BusinessHero onDemo={()=>setDemoOpen(true)} isMobile={isMobile}/>
      <HowItWorks isMobile={isMobile}/>
      <CoreFeatures isMobile={isMobile}/>
      <DashboardPreview isMobile={isMobile}/>
      <Integrations isMobile={isMobile}/>
      <Pricing onDemo={()=>setDemoOpen(true)} isMobile={isMobile}/>
      <BusinessCTA onDemo={()=>setDemoOpen(true)} isMobile={isMobile}/>

      <footer style={{borderTop:`1px solid ${BT.border}`,padding:`20px ${isMobile?"20px":"5%"}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{fontWeight:800,fontSize:18}}><span style={{color:BT.purple}}>ez</span>rakna</div>
        <div style={{color:BT.sub,fontSize:13}}>© 2025 ezrakna. Cairo, Egypt.</div>
        <div style={{display:"flex",gap:20}}>
          {["Privacy","Terms","Contact"].map(l=>(
            <a key={l} href="#" style={{color:BT.sub,fontSize:13,textDecoration:"none"}}>{l}</a>
          ))}
        </div>
      </footer>

      <Modal open={demoOpen} onClose={()=>setDemoOpen(false)} maxWidth={480}>
        <DemoForm onClose={()=>setDemoOpen(false)}/>
      </Modal>
    </div>
  );
}