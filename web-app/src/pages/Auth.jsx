import React, { useState, useRef } from "react";
import { T } from "../constants/theme";
import Modal from "../components/ui/Modal";
import GlowBtn from "../components/ui/GlowBtn";
import apiFetch from "../api/client";

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePhone(raw) {
  const digits = raw.replace(/[\s\-()]/g, "").replace(/\D/g, "");
  if (!digits) return "Phone number is required.";
  if (digits[0] !== "0") return "Must start with 0 — e.g. 01012345678.";
  if (digits.length >= 2 && digits[1] !== "1") return "Must start with 01 — e.g. 01012345678.";
  if (digits.length >= 3 && !["010","011","012","015"].includes(digits.slice(0, 3)))
    return "Must start with 010, 011, 012, or 015.";
  if (digits.length > 11) {
    const n = digits.length - 11;
    return `${n} digit${n === 1 ? "" : "s"} too many — remove ${n}.`;
  }
  if (digits.length < 11) {
    const n = 11 - digits.length;
    return `${n} more digit${n === 1 ? "" : "s"} needed.`;
  }
  return "";
}

function validateField(field, value) {
  switch (field) {
    case "email":    return emailRx.test(value.trim()) ? "" : "Enter a valid email address.";
    case "password": return value.length >= 8 ? "" : "Password must be at least 8 characters.";
    case "name":     return value.trim() ? "" : "Full name is required.";
    case "phone":    return validatePhone(value);
    case "dob":      return value ? "" : "Date of birth is required.";
    default:         return "";
  }
}

/* ── 6-digit code input ──────────────────────────────────────────────────────── */
function CodeInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleChange = (i, e) => {
    const ch = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    onChange(next.join(""));
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      const next = [...digits];
      next[i - 1] = "";
      onChange(next.join(""));
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(text.padEnd(6, "").slice(0, 6));
    inputs.current[Math.min(text.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          maxLength={1}
          inputMode="numeric"
          style={{
            width:44, height:52, borderRadius:12, textAlign:"center",
            border:`2px solid ${d ? T.purple : T.border}`,
            background:"rgba(255,255,255,.04)", color:T.text,
            fontFamily:"inherit", fontSize:22, fontWeight:700, outline:"none",
            transition:"border-color .15s",
          }}
        />
      ))}
    </div>
  );
}

export default function AuthModal({ open, onClose, onAuth, initialMode = "login" }) {
  const [mode, setMode]   = useState(initialMode);
  const [form, setForm]   = useState({ name:"", email:"", password:"", phone:"", dob:"" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Await-verification state (after signup) ──
  const [awaitVerify, setAwaitVerify]     = useState(null); // { email }
  const [verifyCode,  setVerifyCode]      = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError,   setVerifyError]   = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent,    setResendSent]    = useState(false);

  // ── Forgot-password state ──
  const [forgot,       setForgot]       = useState(false);
  const [forgotEmail,  setForgotEmail]  = useState("");
  const [forgotStep,   setForgotStep]   = useState("email"); // email | code | done
  const [forgotCode,   setForgotCode]   = useState("");
  const [forgotPw,     setForgotPw]     = useState("");
  const [forgotPwErr,  setForgotPwErr]  = useState("");
  const [showForgotPw, setShowForgotPw] = useState(false);

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(initialMode);
      setShowPassword(false);
      setAwaitVerify(null); setVerifyCode(""); setVerifyError(""); setResendSent(false);
      setForgot(false); setForgotEmail(""); setForgotStep("email"); setForgotCode(""); setForgotPw("");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = k => e => {
    const v = e.target.value;
    setForm(p => ({ ...p, [k]: v }));
    if (k in fieldErrors) setFieldErrors(p => ({ ...p, [k]: validateField(k, v) }));
  };
  const blur = k => e => setFieldErrors(p => ({ ...p, [k]: validateField(k, e.target.value) }));
  const switchMode = m => { setMode(m); setError(""); setFieldErrors({}); };
  const openForgot = () => { setForgot(true); setForgotEmail(form.email); setError(""); };
  const closeForgot = () => { setForgot(false); setForgotEmail(""); setForgotStep("email"); setForgotCode(""); setForgotPw(""); setError(""); };

  /* ── Submit signup / login ── */
  const submit = async () => {
    setError("");
    const fields = mode === "login" ? ["email", "password"] : ["name", "email", "phone", "dob", "password"];
    const errors = {};
    for (const f of fields) { const err = validateField(f, form[f]); if (err) errors[f] = err; }
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    setLoading(true);
    try {
      if (mode === "login") {
        const data = await apiFetch("/api/auth/login", { method:"POST", body:JSON.stringify({ email:form.email, password:form.password }) });
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userName", data.user.fullName);
        localStorage.setItem("userEmail", data.user.email);
        onAuth({ id:data.user.id, name:data.user.fullName, email:data.user.email, token:data.accessToken });
      } else {
        const data = await apiFetch("/api/auth/register", { method:"POST", body:JSON.stringify({
          fullName:form.name, email:form.email, password:form.password,
          phoneNumber:form.phone, dateOfBirth:form.dob,
        })});
        if (data.requiresVerification) setAwaitVerify({ email: data.email });
      }
    } catch (e) {
      setError(e?.message || "Network error — is the server running?");
    } finally {
      setLoading(false);
    }
  };

  /* ── Submit verification code ── */
  const submitVerifyCode = async () => {
    if (verifyCode.length < 6) { setVerifyError("Enter the full 6-digit code."); return; }
    setVerifyError(""); setVerifyLoading(true);
    try {
      const data = await apiFetch("/api/auth/verify-email", { method:"POST",
        body:JSON.stringify({ email:awaitVerify.email, code:verifyCode }) });
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.fullName);
      localStorage.setItem("userEmail", data.user.email);
      onAuth({ id:data.user.id, name:data.user.fullName, email:data.user.email, token:data.accessToken });
    } catch (e) {
      setVerifyError(e?.message || "Verification failed. Check the code and try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  /* ── Resend verification code ── */
  const resendVerification = async () => {
    setResendLoading(true);
    try {
      await apiFetch("/api/auth/resend-verification", { method:"POST", body:JSON.stringify({ email:awaitVerify.email }) });
    } catch { /* always show success */ } finally {
      setVerifyCode(""); setResendSent(true); setResendLoading(false);
    }
  };

  /* ── Forgot password: send code ── */
  const submitForgotEmail = async () => {
    setError("");
    if (!emailRx.test(forgotEmail.trim())) { setError("Enter a valid email address."); return; }
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", { method:"POST", body:JSON.stringify({ email:forgotEmail.trim() }) });
    } catch { /* always proceed */ } finally {
      setForgotStep("code"); setLoading(false);
    }
  };

  /* ── Forgot password: submit code + new password ── */
  const submitForgotReset = async () => {
    setForgotPwErr("");
    if (forgotCode.length < 6) { setForgotPwErr("Enter the full 6-digit code."); return; }
    if (forgotPw.length < 8)   { setForgotPwErr("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", { method:"POST",
        body:JSON.stringify({ email:forgotEmail.trim(), code:forgotCode, newPassword:forgotPw }) });
      setForgotStep("done");
    } catch (e) {
      setForgotPwErr(e?.message || "Reset failed. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => { if (e.key === "Enter") submit(); };

  /* ═══════════════════════════════════════════════════════════════════
     VIEWS
  ══════════════════════════════════════════════════════════════════════ */

  /* ── Await email verification ── */
  if (awaitVerify) {
    return (
      <Modal open={open} onClose={onClose} maxWidth={440}>
        <div style={{ padding:"36px 32px" }}>
          <Logo sub="Verify your email" />
          <div style={{ color:T.sub, fontSize:13, lineHeight:1.7, marginBottom:20, textAlign:"center" }}>
            We sent a 6-digit code to<br />
            <strong style={{ color:T.text }}>{awaitVerify.email}</strong>
          </div>
          <CodeInput value={verifyCode} onChange={v => { setVerifyCode(v); setVerifyError(""); }} />
          {verifyError && <div style={{ ...errStyle, marginTop:12, textAlign:"center" }}>{verifyError}</div>}
          <GlowBtn full noArrow onClick={submitVerifyCode} style={{ marginTop:20 }} disabled={verifyLoading || verifyCode.length < 6}>
            {verifyLoading ? "Verifying…" : "Verify Email"}
          </GlowBtn>
          <div style={{ marginTop:14, textAlign:"center" }}>
            {resendSent
              ? <span style={{ color:"#86EFAC", fontSize:13 }}>✓ New code sent</span>
              : <button onClick={resendVerification} disabled={resendLoading} style={linkStyle}>
                  {resendLoading ? "Sending…" : "Resend code"}
                </button>
            }
          </div>
          <div style={{ textAlign:"center", marginTop:8 }}>
            <button onClick={() => { setAwaitVerify(null); switchMode("login"); }} style={linkStyle}>
              Back to Log In
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ── Forgot password ── */
  if (forgot) {
    return (
      <Modal open={open} onClose={() => { closeForgot(); onClose(); }} maxWidth={440}>
        <div style={{ padding:"36px 32px" }}>
          <Logo sub="Reset your password" />

          {/* Step 1 — enter email */}
          {forgotStep === "email" && (
            <>
              <div style={{ color:T.sub, fontSize:13, marginBottom:16, lineHeight:1.6 }}>
                Enter your registered email and we'll send you a 6-digit reset code.
              </div>
              <input value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && submitForgotEmail()}
                placeholder="Email address" type="email" style={inputStyle} />
              {error && <div style={errStyle}>{error}</div>}
              <GlowBtn full noArrow onClick={submitForgotEmail} style={{ marginTop:16 }} disabled={loading}>
                {loading ? "Sending…" : "Send Code"}
              </GlowBtn>
            </>
          )}

          {/* Step 2 — enter code + new password */}
          {forgotStep === "code" && (
            <>
              <div style={{ color:T.sub, fontSize:13, marginBottom:6, textAlign:"center", lineHeight:1.6 }}>
                Enter the code sent to<br /><strong style={{ color:T.text }}>{forgotEmail}</strong>
              </div>
              <div style={{ marginBottom:20, marginTop:16 }}>
                <CodeInput value={forgotCode} onChange={v => { setForgotCode(v); setForgotPwErr(""); }} />
              </div>
              <div style={{ marginBottom:12 }}>
                <div style={{ color:T.sub, fontSize:11, letterSpacing:.5, marginBottom:6 }}>NEW PASSWORD</div>
                <div style={{ position:"relative" }}>
                  <input value={forgotPw} onChange={e => { setForgotPw(e.target.value); setForgotPwErr(""); }}
                    onKeyDown={e => e.key === "Enter" && submitForgotReset()}
                    type={showForgotPw ? "text" : "password"} placeholder="Min 8 characters" style={{ ...inputStyle, paddingRight:44 }} />
                  <EyeBtn show={showForgotPw} toggle={() => setShowForgotPw(v => !v)} />
                </div>
              </div>
              {forgotPwErr && <div style={errStyle}>{forgotPwErr}</div>}
              <GlowBtn full noArrow onClick={submitForgotReset} style={{ marginTop:16 }} disabled={loading || forgotCode.length < 6}>
                {loading ? "Saving…" : "Reset Password"}
              </GlowBtn>
              <div style={{ textAlign:"center", marginTop:12 }}>
                <button onClick={() => setForgotStep("email")} style={linkStyle}>← Try a different email</button>
              </div>
            </>
          )}

          {/* Step 3 — success */}
          {forgotStep === "done" && (
            <div style={{ textAlign:"center" }}>
              <div style={{ width:60, height:60, borderRadius:"50%", margin:"0 auto 16px",
                background:"rgba(34,197,94,.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>Password reset!</div>
              <div style={{ color:T.sub, fontSize:13, lineHeight:1.6, marginBottom:20 }}>
                You can now log in with your new password.
              </div>
              <GlowBtn full noArrow onClick={() => { closeForgot(); switchMode("login"); }}>
                Go to Log In
              </GlowBtn>
            </div>
          )}

          {forgotStep !== "done" && (
            <div style={{ textAlign:"center", marginTop:16 }}>
              <button onClick={closeForgot} style={linkStyle}>← Back to Log In</button>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  /* ── Login / Sign-up ── */
  return (
    <Modal open={open} onClose={onClose} maxWidth={440}>
      <div style={{ padding:"36px 32px" }}>
        <Logo sub={mode === "login" ? "Welcome back" : "Create your account"} />

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
                placeholder="Full name" style={{ ...inputStyle, borderColor:fieldErrors.name?T.red:undefined }} />
              {fieldErrors.name && <div style={fieldErrStyle}>{fieldErrors.name}</div>}
            </div>
          )}
          <div>
            <input value={form.email} onChange={set("email")} onBlur={blur("email")} onKeyDown={handleKey}
              placeholder="Email address" type="email" style={{ ...inputStyle, borderColor:fieldErrors.email?T.red:undefined }} />
            {fieldErrors.email && <div style={fieldErrStyle}>{fieldErrors.email}</div>}
          </div>
          {mode === "signup" && (
            <div>
              <input value={form.phone} onChange={set("phone")} onBlur={blur("phone")} onKeyDown={handleKey}
                placeholder="Phone number (e.g. 01012345678)" style={{ ...inputStyle, borderColor:fieldErrors.phone?T.red:undefined }} />
              {fieldErrors.phone && <div style={fieldErrStyle}>{fieldErrors.phone}</div>}
            </div>
          )}
          {mode === "signup" && (
            <div>
              <input value={form.dob} onChange={set("dob")} onBlur={blur("dob")} onKeyDown={handleKey}
                type="date" style={{ ...inputStyle, borderColor:fieldErrors.dob?T.red:undefined }} />
              {fieldErrors.dob && <div style={fieldErrStyle}>{fieldErrors.dob}</div>}
            </div>
          )}
          <div>
            <div style={{ position:"relative" }}>
              <input value={form.password} onChange={set("password")} onBlur={blur("password")} onKeyDown={handleKey}
                placeholder="Password (min 8 characters)" type={showPassword?"text":"password"}
                style={{ ...inputStyle, paddingRight:44, borderColor:fieldErrors.password?T.red:undefined }} />
              <EyeBtn show={showPassword} toggle={() => setShowPassword(v => !v)} />
            </div>
            {fieldErrors.password && <div style={fieldErrStyle}>{fieldErrors.password}</div>}
          </div>
        </div>

        {mode === "login" && (
          <div style={{ textAlign:"right", marginTop:8 }}>
            <button onClick={openForgot} style={linkStyle}>Forgot password?</button>
          </div>
        )}

        {error && <div style={{ marginTop:14, padding:"10px 14px", borderRadius:10,
          background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", color:"#FCA5A5", fontSize:13 }}>
          {error}
        </div>}

        <GlowBtn full noArrow onClick={submit} style={{ marginTop:20 }} disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
        </GlowBtn>
      </div>
    </Modal>
  );
}

/* ── Shared helpers ── */
function Logo({ sub }) {
  return (
    <div style={{ textAlign:"center", marginBottom:24 }}>
      <div style={{ fontSize:28, fontWeight:800, letterSpacing:-1 }}>
        <span style={{ color:T.purple }}>ez</span>rakna
      </div>
      {sub && <div style={{ color:T.sub, fontSize:14, marginTop:6 }}>{sub}</div>}
    </div>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button type="button" onClick={toggle} style={{
      position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
      background:"none", border:"none", cursor:"pointer", padding:4,
      color:T.sub, display:"flex", alignItems:"center",
    }}>
      {show ? (
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
  );
}

const inputStyle = {
  width:"100%", height:48, borderRadius:12, border:`1px solid ${T.border}`,
  background:"rgba(255,255,255,.04)", color:T.text, fontFamily:"inherit",
  fontSize:14, padding:"0 16px", outline:"none", boxSizing:"border-box",
};
const fieldErrStyle = { fontSize:12, color:T.red, marginTop:4, paddingLeft:2 };
const errStyle = { fontSize:13, color:"#FCA5A5", marginTop:8 };
const linkStyle = { background:"none", border:"none", color:T.purple, fontSize:13, cursor:"pointer", fontFamily:"inherit" };
