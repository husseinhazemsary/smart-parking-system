import React, { useState } from "react";
import { T } from "../constants/theme";
import Modal from "../components/ui/Modal";
import GlowBtn from "../components/ui/GlowBtn";
import apiFetch from "../api/client";

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRx = /^01[0-9]{9}$/;

function validateField(field, value) {
  switch (field) {
    case "email":    return emailRx.test(value.trim()) ? "" : "Enter a valid email address.";
    case "password": return value.length >= 8 ? "" : "Password must be at least 8 characters.";
    case "name":     return value.trim() ? "" : "Full name is required.";
    case "phone":    return phoneRx.test(value.replace(/\s/g, "")) ? "" : "Enter a valid Egyptian phone number (e.g. 01012345678).";
    case "dob":      return value ? "" : "Date of birth is required.";
    default:         return "";
  }
}

export default function AuthModal({ open, onClose, onAuth, initialMode = "login" }) {
  const [mode, setMode]   = useState(initialMode);
  const [form, setForm]   = useState({ name:"", email:"", password:"", phone:"", dob:"" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (open) { setMode(initialMode); setShowPassword(false); }
  }, [open]);

  // Forgot-password sub-mode
  const [forgot,      setForgot]      = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent,  setForgotSent]  = useState(false);

  const set = k => e => {
    const v = e.target.value;
    setForm(p => ({ ...p, [k]: v }));
    // Re-validate live once the field has been touched (has any entry in fieldErrors)
    if (k in fieldErrors) {
      setFieldErrors(p => ({ ...p, [k]: validateField(k, v) }));
    }
  };

  const blur = k => e => {
    const err = validateField(k, e.target.value);
    setFieldErrors(p => ({ ...p, [k]: err }));
  };

  const switchMode = m => { setMode(m); setError(""); setFieldErrors({}); };

  const openForgot = () => { setForgot(true); setForgotEmail(form.email); setError(""); };
  const closeForgot = () => { setForgot(false); setForgotEmail(""); setForgotSent(false); setError(""); };

  const submit = async () => {
    setError("");
    const fields = mode === "login"
      ? ["email", "password"]
      : ["name", "email", "phone", "dob", "password"];
    const errors = {};
    for (const f of fields) {
      const err = validateField(f, form[f]);
      if (err) errors[f] = err;
    }
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    setLoading(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { fullName: form.name, email: form.email, password: form.password,
            phoneNumber: form.phone, dateOfBirth: form.dob };

      const data = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });

      localStorage.setItem("token",        data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("userId",       data.user.id);
      localStorage.setItem("userName",     data.user.fullName);
      localStorage.setItem("userEmail",    data.user.email);

      onAuth({ id: data.user.id, name: data.user.fullName, email: data.user.email, token: data.accessToken });
    } catch (e) {
      setError(e?.message || "Network error — is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async () => {
    setError("");
    if (!emailRx.test(forgotEmail.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
    } catch {
      // Always show success — don't reveal whether the email exists
    } finally {
      setForgotSent(true);
      setLoading(false);
    }
  };

  const handleKey = e => {
    if (e.key === "Enter") forgot ? submitForgot() : submit();
  };

  // ── Forgot-password view ─────────────────────────────────────────────────────
  if (forgot) {
    return (
      <Modal open={open} onClose={() => { closeForgot(); onClose(); }} maxWidth={440}>
        <div style={{ padding:"36px 32px" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:28, fontWeight:800, letterSpacing:-1 }}>
              <span style={{ color:T.purple }}>ez</span>rakna
            </div>
            <div style={{ color:T.sub, fontSize:14, marginTop:6 }}>Reset your password</div>
          </div>

          {forgotSent ? (
            <div style={{
              padding:"18px 16px", borderRadius:12,
              background:"rgba(34,197,94,.08)", border:"1px solid rgba(34,197,94,.25)",
              color:"#86EFAC", fontSize:14, textAlign:"center", lineHeight:1.6,
            }}>
              ✓ Check your inbox — if that email is registered you'll receive a reset link shortly.
            </div>
          ) : (
            <>
              <div style={{ color:T.sub, fontSize:13, marginBottom:16, lineHeight:1.6 }}>
                Enter your registered email and we'll send you a link to reset your password.
              </div>
              <input
                value={forgotEmail}
                onChange={e => { setForgotEmail(e.target.value); setError(""); }}
                onKeyDown={handleKey}
                placeholder="Email address"
                type="email"
                style={inputStyle}
              />
              {error && <div style={fieldErrStyle}>{error}</div>}
              <GlowBtn full noArrow onClick={submitForgot} style={{ marginTop:16 }} disabled={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
              </GlowBtn>
            </>
          )}

          <div style={{ textAlign:"center", marginTop:16 }}>
            <button onClick={closeForgot}
              style={{ background:"none", border:"none", color:T.purple, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              ← Back to Log In
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Login / Sign-up view ─────────────────────────────────────────────────────
  return (
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

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {mode === "signup" && (
            <div>
              <input value={form.name} onChange={set("name")} onBlur={blur("name")} onKeyDown={handleKey}
                placeholder="Full name"
                style={{ ...inputStyle, borderColor: fieldErrors.name ? T.red : undefined }} />
              {fieldErrors.name && <div style={fieldErrStyle}>{fieldErrors.name}</div>}
            </div>
          )}
          <div>
            <input value={form.email} onChange={set("email")} onBlur={blur("email")} onKeyDown={handleKey}
              placeholder="Email address" type="email"
              style={{ ...inputStyle, borderColor: fieldErrors.email ? T.red : undefined }} />
            {fieldErrors.email && <div style={fieldErrStyle}>{fieldErrors.email}</div>}
          </div>
          {mode === "signup" && (
            <div>
              <input value={form.phone} onChange={set("phone")} onBlur={blur("phone")} onKeyDown={handleKey}
                placeholder="Phone number (e.g. 01012345678)"
                style={{ ...inputStyle, borderColor: fieldErrors.phone ? T.red : undefined }} />
              {fieldErrors.phone && <div style={fieldErrStyle}>{fieldErrors.phone}</div>}
            </div>
          )}
          {mode === "signup" && (
            <div>
              <input value={form.dob} onChange={set("dob")} onBlur={blur("dob")} onKeyDown={handleKey}
                type="date"
                style={{ ...inputStyle, borderColor: fieldErrors.dob ? T.red : undefined }} />
              {fieldErrors.dob && <div style={fieldErrStyle}>{fieldErrors.dob}</div>}
            </div>
          )}
          <div>
            <div style={{ position:"relative" }}>
              <input value={form.password} onChange={set("password")} onBlur={blur("password")} onKeyDown={handleKey}
                placeholder="Password (min 8 characters)" type={showPassword ? "text" : "password"}
                style={{ ...inputStyle, paddingRight:44, borderColor: fieldErrors.password ? T.red : undefined }} />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", padding:4,
                  color: T.sub, display:"flex", alignItems:"center",
                }}
              >
                {showPassword ? (
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && <div style={fieldErrStyle}>{fieldErrors.password}</div>}
          </div>
        </div>

        {mode === "login" && (
          <div style={{ textAlign:"right", marginTop:8 }}>
            <button onClick={openForgot}
              style={{ background:"none", border:"none", color:T.purple, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
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

      </div>
    </Modal>
  );
}

const inputStyle = {
  width:"100%", height:48, borderRadius:12, border:`1px solid ${T.border}`,
  background:"rgba(255,255,255,.04)", color:T.text, fontFamily:"inherit",
  fontSize:14, padding:"0 16px", outline:"none", boxSizing:"border-box",
};

const fieldErrStyle = {
  fontSize:12, color:T.red, marginTop:4, paddingLeft:2,
};
