import React, { useState } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { TRANSACTIONS } from "../data/transactions";
import GlowBtn from "../components/ui/GlowBtn";
import Modal from "../components/ui/Modal";

/* ─── Mock saved cards ───────────────────────────────────────── */
const INITIAL_CARDS = [
  { id:1, type:"visa",       last4:"4582", holder:"Nour Ahmed", expiry:"09/28", gradient:["#5B21B6","#7C3AED"] },
  { id:2, type:"mastercard", last4:"1197", holder:"Nour Ahmed", expiry:"03/27", gradient:["#1E3A5F","#1D4ED8"] },
];

const CSS = `
  .wlt-wrap { animation: wlt-up .32s cubic-bezier(.22,1,.36,1); }
  @keyframes wlt-up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pls { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(2.4);opacity:0} }

  .wlt-card {
    width:230px; min-width:230px; height:140px; border-radius:20px;
    padding:18px 20px; position:relative; overflow:hidden;
    cursor:pointer; flex-shrink:0;
    transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s;
    box-sizing:border-box;
  }
  .wlt-card:hover { transform:translateY(-4px); box-shadow:0 18px 48px rgba(0,0,0,.45); }
  .wlt-card.active { outline:2.5px solid rgba(255,255,255,.7); outline-offset:2px; }

  .wlt-add {
    width:230px; min-width:230px; height:140px; border-radius:20px;
    border:2px dashed rgba(125,57,235,.35); background:rgba(125,57,235,.04);
    cursor:pointer; flex-shrink:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:8px;
    transition:border-color .2s, background .2s; box-sizing:border-box;
  }
  .wlt-add:hover { border-color:${T.purple}; background:rgba(125,57,235,.1); }

  .wlt-tx {
    display:flex; align-items:center; gap:12px;
    padding:13px 16px; border-radius:14px;
    border:1px solid ${T.border}; background:rgba(17,0,48,.55);
    transition:border-color .2s, background .2s;
  }
  .wlt-tx:hover { border-color:rgba(125,57,235,.35); background:rgba(125,57,235,.05); }

  .wlt-field {
    width:100%; height:46px; border-radius:11px;
    border:1px solid ${T.border}; background:rgba(255,255,255,.04);
    color:${T.text}; font-family:inherit; font-size:14px;
    padding:0 14px; outline:none; box-sizing:border-box;
    transition:border-color .2s;
  }
  .wlt-field:focus { border-color:${T.purple}; }
  .wlt-label { font-size:11px; color:${T.sub}; letter-spacing:.6px; margin-bottom:5px; }
`;

/* ─── Visa / MC logos ────────────────────────────────────────── */
function VisaLogo() {
  return (
    <span style={{fontSize:13,fontWeight:900,fontStyle:"italic",color:"rgba(255,255,255,.9)",letterSpacing:-.5,fontFamily:"serif"}}>
      VISA
    </span>
  );
}
function MCLogo() {
  return (
    <div style={{display:"flex",position:"relative",width:28,height:18}}>
      <div style={{width:18,height:18,borderRadius:"50%",background:"#EB001B",opacity:.85,position:"absolute",left:0}}/>
      <div style={{width:18,height:18,borderRadius:"50%",background:"#F79E1B",opacity:.85,position:"absolute",left:10}}/>
    </div>
  );
}

/* ─── Single payment card visual ────────────────────────────── */
function PayCard({ card, active, onClick }) {
  return (
    <div className={`wlt-card${active?" active":""}`} onClick={onClick}
      style={{background:`linear-gradient(135deg,${card.gradient[0]},${card.gradient[1]})`}}>
      {/* bg circles */}
      <div style={{position:"absolute",width:110,height:110,borderRadius:"50%",
        background:"rgba(255,255,255,.07)",top:-28,right:-28,pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:70,height:70,borderRadius:"50%",
        background:"rgba(255,255,255,.05)",bottom:-18,left:-18,pointerEvents:"none"}}/>

      {/* chip + brand */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{width:28,height:20,borderRadius:4,
          background:"linear-gradient(135deg,rgba(255,220,80,.7),rgba(255,180,30,.5))",
          border:"1px solid rgba(255,255,255,.25)"}}/>
        {card.type==="visa" ? <VisaLogo/> : <MCLogo/>}
      </div>

      {/* number */}
      <div style={{fontSize:13,fontWeight:600,letterSpacing:2,color:"rgba(255,255,255,.88)",
        marginBottom:14,fontFamily:"monospace"}}>
        •••• •••• •••• {card.last4}
      </div>

      {/* holder / expiry */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>
          <div style={{fontSize:8,color:"rgba(255,255,255,.5)",letterSpacing:1,marginBottom:1}}>CARDHOLDER</div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.9)"}}>{card.holder}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:8,color:"rgba(255,255,255,.5)",letterSpacing:1,marginBottom:1}}>EXPIRES</div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.9)"}}>{card.expiry}</div>
        </div>
      </div>

      {/* check mark if selected */}
      {active && (
        <div style={{position:"absolute",top:10,right:10,
          width:20,height:20,borderRadius:"50%",
          background:"rgba(255,255,255,.9)",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:10,fontWeight:900,color:card.gradient[1]}}>✓</span>
        </div>
      )}
    </div>
  );
}

/* ─── Add Card Modal ─────────────────────────────────────────── */
function AddCardModal({ open, onClose, onAdd }) {
  const [num,  setNum]  = useState("");
  const [name, setName] = useState("");
  const [exp,  setExp]  = useState("");
  const [cvv,  setCvv]  = useState("");

  const fmtNum = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp = v => v.replace(/\D/g,"").slice(0,4).replace(/^(\d{2})(\d)/,"$1/$2");

  const handleAdd = () => {
    if (!num || !name || !exp || !cvv) return;
    const type = num.replace(/\s/g,"")[0]==="4" ? "visa" : "mastercard";
    onAdd({ type, last4:num.replace(/\s/g,"").slice(-4), holder:name, expiry:exp,
      gradient:type==="visa"?["#5B21B6","#7C3AED"]:["#1E3A5F","#1D4ED8"] });
    setNum(""); setName(""); setExp(""); setCvv("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <div style={{padding:"26px 22px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}>
          <div style={{width:44,height:44,borderRadius:12,
            background:"rgba(125,57,235,.12)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>💳</div>
          <div>
            <div style={{fontSize:18,fontWeight:800}}>Add New Card</div>
            <div style={{fontSize:12,color:T.sub}}>Your details are encrypted & secure</div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <div className="wlt-label">CARD NUMBER</div>
            <input className="wlt-field" value={num} onChange={e=>setNum(fmtNum(e.target.value))}
              placeholder="1234  5678  9012  3456" maxLength={19}/>
          </div>
          <div>
            <div className="wlt-label">CARDHOLDER NAME</div>
            <input className="wlt-field" value={name} onChange={e=>setName(e.target.value)}
              placeholder="Full name on card"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <div className="wlt-label">EXPIRY DATE</div>
              <input className="wlt-field" value={exp} onChange={e=>setExp(fmtExp(e.target.value))}
                placeholder="MM/YY" maxLength={5}/>
            </div>
            <div>
              <div className="wlt-label">CVV</div>
              <input className="wlt-field" value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,"").slice(0,4))}
                placeholder="•••" maxLength={4} type="password"/>
            </div>
          </div>
        </div>

        <div style={{display:"flex",gap:10,marginTop:22}}>
          <button onClick={onClose} style={{
            flex:1,padding:12,borderRadius:11,border:`1px solid ${T.border}`,
            background:"transparent",color:T.sub,fontFamily:"inherit",fontSize:14,
            fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <div style={{flex:2}}><GlowBtn full noArrow onClick={handleAdd}>Add Card</GlowBtn></div>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Transaction row ────────────────────────────────────────── */
function TxRow({ t }) {
  const ok = !t.failed;
  return (
    <div className="wlt-tx">
      <div style={{width:42,height:42,borderRadius:12,flexShrink:0,
        background:ok?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
        {ok ? "🅿️" : "⚠️"}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {t.name}
        </div>
        <div style={{fontSize:11,color:T.sub,marginTop:2}}>{t.date} · {t.duration}</div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:13,fontWeight:700,color:ok?T.text:T.red}}>{t.cost}</div>
        <div style={{fontSize:11,marginTop:2,fontWeight:600,color:ok?T.green:T.red}}>{t.status}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
export default function WalletTab({ activeSpot, onGoToSession }) {
  const [cards,       setCards]      = useState(INITIAL_CARDS);
  const [activeCard,  setActiveCard] = useState(1);
  const [addOpen,     setAddOpen]    = useState(false);
  const [showAllTx,   setShowAllTx]  = useState(false);
  const { isMobile } = useBreakpoint();

  const pad = isMobile ? "20px 16px" : "32px 28px";

  return (
    <div className="wlt-wrap" style={{maxWidth:780,margin:"0 auto",padding:pad}}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      {/* ══ CARDS SECTION ══ */}
      <div style={{marginBottom:30}}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:16}}>Payment Cards</div>

        {/* Horizontal scroll row */}
        <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:8,
          scrollbarWidth:"none"}} className="hideScroll">
          {cards.map(c=>(
            <PayCard key={c.id} card={c} active={activeCard===c.id} onClick={()=>setActiveCard(c.id)}/>
          ))}
          <div className="wlt-add" onClick={()=>setAddOpen(true)}>
            <div style={{width:40,height:40,borderRadius:"50%",
              border:`2px dashed rgba(125,57,235,.4)`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22,color:T.purple}}>+</div>
            <div style={{fontSize:13,fontWeight:600,color:T.purple}}>Add Card</div>
          </div>
        </div>

        {/* Selected card quick actions */}
        {cards.length>0 && (
          <div style={{marginTop:14,display:"flex",gap:8}}>
            {[
              {icon:"🗑", label:"Remove Card",  color:T.red,    bg:"rgba(239,68,68,.08)",   bd:"rgba(239,68,68,.2)" },
              {icon:"⭐", label:"Set as Default",color:T.purple, bg:"rgba(125,57,235,.08)", bd:"rgba(125,57,235,.25)"},
            ].map(a=>(
              <button key={a.label} style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"7px 14px",borderRadius:9,
                border:`1px solid ${a.bd}`,background:a.bg,
                color:a.color,fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",
                transition:"opacity .15s",
              }}
                onMouseEnter={e=>e.currentTarget.style.opacity=".75"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══ ACTIVE SESSION ══ */}
      <div style={{marginBottom:30}}>
        <div style={{fontSize:16,fontWeight:800,marginBottom:14}}>Active Session</div>

        {activeSpot ? (
          <div style={{borderRadius:16,padding:"16px 18px",
            background:"rgba(34,197,94,.05)",
            border:"1.5px solid rgba(34,197,94,.2)"}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
              <div style={{width:8,height:8,borderRadius:"50%",
                background:T.green,animation:"pls 1.5s infinite"}}/>
              <span style={{fontSize:11,fontWeight:700,color:T.green,letterSpacing:.5}}>LIVE</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>{activeSpot.name}</div>
                <div style={{fontSize:12,color:T.sub,marginBottom:12}}>📍 Level 2 – B4</div>
                <button onClick={onGoToSession} style={{
                  padding:"7px 14px",borderRadius:9,
                  border:"1px solid rgba(34,197,94,.3)",
                  background:"rgba(34,197,94,.08)",
                  color:T.green,fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",
                  transition:"background .2s",
                }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(34,197,94,.16)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(34,197,94,.08)"}>
                  View Session →
                </button>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:10,color:T.sub,letterSpacing:.8,marginBottom:3}}>EST. COST</div>
                <div style={{fontSize:22,fontWeight:800,color:T.green}}>EGP 50</div>
                <div style={{fontSize:11,color:T.sub}}>~2h 10m so far</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{borderRadius:14,padding:"18px 20px",
            background:"rgba(255,255,255,.02)",border:`1px solid ${T.border}`,
            display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontSize:26,opacity:.5}}>🅿️</div>
            <div>
              <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>No active session</div>
              <div style={{fontSize:12,color:T.sub}}>Reserve a parking spot to start a session.</div>
            </div>
          </div>
        )}
      </div>

      {/* ══ RECENT ACTIVITY ══ */}
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800}}>Recent Activity</div>
          <button onClick={()=>setShowAllTx(true)} style={{
            background:"none",border:"none",color:T.purple,
            fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            View all →
          </button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {TRANSACTIONS.slice(0,4).map(t=><TxRow key={t.id} t={t}/>)}
        </div>
      </div>

      {/* Modals */}
      <AddCardModal open={addOpen} onClose={()=>setAddOpen(false)}
        onAdd={c=>setCards(p=>[...p,{...c,id:Date.now()}])}/>

      <Modal open={showAllTx} onClose={()=>setShowAllTx(false)} maxWidth={500}>
        <div style={{padding:"24px 20px"}}>
          <div style={{fontSize:18,fontWeight:800,marginBottom:18}}>All Transactions</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {TRANSACTIONS.map(t=><TxRow key={t.id} t={t}/>)}
          </div>
        </div>
      </Modal>
    </div>
  );
}