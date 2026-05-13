import React, { useState } from "react";
import { T } from "../constants/theme";
import Modal from "../components/ui/Modal";
import GlowBtn from "../components/ui/GlowBtn";

const API = "http://localhost:8081";

export default function AuthModal({ open, onClose, onAuth }){
  const [mode, setMode]   = useState("login");
  const [form, setForm]   = useState({ name:"", email:"", password:"", phone:"", dob:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const switchMode = (m) => { setMode(m); setError(""); };

  const submit = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Email and password are required."); return; }
    if (mode === "signup" && (!form.name || !form.phone || !form.dob)) {
      setError("All fields are required for registration."); return;
    }

    setLoading(true);
    try {
      const url  = mode === "login" ? `${API}/api/auth/login` : `${API}/api/auth/register`;
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { fullName: form.name, email: form.email, password: form.password,
            phoneNumber: form.phone, dateOfBirth: form.dob };

      const res  = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.detail || "Something went wrong."); return; }

      localStorage.setItem("token",        data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("userId",       data.user.id);
      localStorage.setItem("userName",     data.user.fullName);
      localStorage.setItem("userEmail",    data.user.email);

      onAuth({ id: data.user.id, name: data.user.fullName, email: data.user.email, token: data.accessToken });
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => { if (e.key === "Enter") submit(); };

  return(
    <Modal open={open} onClose={onClose} maxWidth={440}>
      <div style={{ padding:"36px 32px" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:28, fontWeight:800, letterSpacing:-1 }}>
            <span style={{ color:T.purple }}>ez</span>rakna
          </div>
          <div style={{ color:T.sub, fontSize:14, marginTop:6 }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display:"flex", gap:0, marginBottom:28, borderRadius:12, overflow:"hidden", border:`1px solid ${T.border}` }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex:1, padding:"11px", border:"none", fontFamily:"inherit",
              background: mode === m ? T.purple : "transparent",
              color: mode === m ? "#fff" : T.sub, fontWeight:700, fontSize:14, cursor:"pointer",
            }}>{m === "login" ? "Log In" : "Sign Up"}</button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {mode === "signup" && (
            <input value={form.name} onChange={set("name")} onKeyDown={handleKey}
              placeholder="Full name" style={inputStyle} />
          )}
          <input value={form.email} onChange={set("email")} onKeyDown={handleKey}
            placeholder="Email address" type="email" style={inputStyle} />
          {mode === "signup" && (
            <input value={form.phone} onChange={set("phone")} onKeyDown={handleKey}
              placeholder="Phone number (e.g. 01012345678)" style={inputStyle} />
          )}
          {mode === "signup" && (
            <input value={form.dob} onChange={set("dob")} onKeyDown={handleKey}
              placeholder="Date of birth (YYYY-MM-DD)" style={inputStyle} />
          )}
          <input value={form.password} onChange={set("password")} onKeyDown={handleKey}
            placeholder="Password (min 8 characters)" type="password" style={inputStyle} />
        </div>

        {mode === "login" && (
          <div style={{ textAlign:"right", marginTop:8 }}>
            <button style={{ background:"none", border:"none", color:T.purple, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop:14, padding:"10px 14px", borderRadius:10,
            background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)",
            color:"#FCA5A5", fontSize:13 }}>
            {error}
          </div>
        )}

        <GlowBtn full noArrow onClick={submit} style={{ marginTop:20 }} disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
        </GlowBtn>

        <div style={{ textAlign:"center", marginTop:16, fontSize:13, color:T.sub }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            style={{ background:"none", border:"none", color:T.purple, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13 }}>
            {mode === "login" ? "Sign Up" : "Log In"}
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
