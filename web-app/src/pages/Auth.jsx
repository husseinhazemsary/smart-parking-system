import React, { useState } from "react";
import { T } from "../constants/theme";
import Modal from "../components/ui/Modal";
import GlowBtn from "../components/ui/GlowBtn";

/* ─── Auth screens ───────────────────────────────────────────── */
export default function AuthModal({ open, onClose, onAuth }){
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

export const inputStyle = {
  width:"100%", height:48, borderRadius:12, border:`1px solid ${T.border}`,
  background:"rgba(255,255,255,.04)", color:T.text, fontFamily:"inherit",
  fontSize:14, padding:"0 16px", outline:"none", boxSizing:"border-box",
};
