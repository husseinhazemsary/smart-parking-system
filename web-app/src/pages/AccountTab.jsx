import React, { useState, useEffect, useRef } from "react";
import { T } from "../constants/theme";
import Modal from "../components/ui/Modal";
import GlowBtn from "../components/ui/GlowBtn";
import { detectEV } from "../utils/evDetection";
import apiFetch from "../api/client";

const BASE_URL = "http://localhost:8081";

function validatePhone(raw) {
  const digits = raw.replace(/[\s\-()]/g, "").replace(/^\+20/, "0").replace(/\D/g, "");
  if (!digits) return "";
  if (digits[0] !== "0") return "Must start with 0 — e.g. 01012345678.";
  if (digits.length >= 2 && digits[1] !== "1") return "Must start with 01 — e.g. 01012345678.";
  if (digits.length >= 3 && !["010","011","012","015"].includes(digits.slice(0, 3)))
    return "Must start with 010, 011, 012, or 015.";
  if (digits.length > 11) { const n = digits.length - 11; return `${n} digit${n === 1 ? "" : "s"} too many — remove ${n}.`; }
  if (digits.length < 11) { const n = 11 - digits.length; return `${n} more digit${n === 1 ? "" : "s"} needed.`; }
  return "";
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const Ic = ({ d, size = 16, children, ...rest }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size, display: "block", flexShrink: 0 }}
    aria-hidden="true" {...rest}>
    {children}
    {d && <path d={d} />}
  </svg>
);

const IEdit       = ({ size }) => <Ic size={size} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />;
const IPlus       = ({ size }) => <Ic size={size} d="M12 5v14M5 12h14" />;
const IChevronR   = ({ size }) => <Ic size={size} d="M9 18l6-6-6-6" />;
const ILogOut     = ({ size }) => <Ic size={size} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />;
const IUser       = ({ size }) => <Ic size={size} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"><circle cx="12" cy="7" r="4" /></Ic>;
const ILock       = ({ size }) => <Ic size={size} d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" />;
const ICreditCard = ({ size }) => <Ic size={size} d="M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z"><line x1="2" y1="12" x2="22" y2="12" /></Ic>;
const IShield     = ({ size }) => <Ic size={size} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
const IHelp       = ({ size }) => <Ic size={size} d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"><circle cx="12" cy="12" r="10" /><line x1="12" y1="17" x2="12.01" y2="17" /></Ic>;
const IMsg        = ({ size }) => <Ic size={size} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />;
const IStar       = ({ size }) => <Ic size={size}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Ic>;
const ICar        = ({ size }) => <Ic size={size} d="M5 17H3a2 2 0 01-2-2v-5a2 2 0 012-2h14l3 4v3a2 2 0 01-2 2h-2"><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></Ic>;
const IBell       = ({ size }) => <Ic size={size} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />;
const IMapPin     = ({ size }) => <Ic size={size} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"><circle cx="12" cy="10" r="3" /></Ic>;
const IMail       = ({ size }) => <Ic size={size} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"><polyline points="22,6 12,13 2,6" /></Ic>;
const IMoon       = ({ size }) => <Ic size={size} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />;
const IWheelchair = ({ size }) => <Ic size={size}><circle cx="12" cy="4" r="1.5" /><path d="M9 9h6l-1 6H9zM9 21a4 4 0 004-4M17 21a4 4 0 00-4-4H9M9 15l-2 6" /></Ic>;

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');

  .acc-wrap {
    animation: acc-up .3s cubic-bezier(.22,1,.36,1);
    font-family: 'DM Sans', 'Sora', sans-serif;
    --brand:       #7D39EB;
    --brand-dim:   #A98BFF;
    --brand-faint: rgba(125,57,235,0.08);
    --brand-glow:  rgba(125,57,235,0.18);
    --surf:        rgba(10,0,28,0.72);
    --surf2:       rgba(20,0,50,0.60);
    --surf3:       rgba(30,8,70,0.55);
    --bdr:         rgba(255,255,255,0.06);
    --bdr-bright:  rgba(255,255,255,0.11);
    --tx:          #F0EAFA;
    --tx-m:        rgba(240,234,250,0.50);
    --tx-f:        rgba(240,234,250,0.30);
    --red:         #E5484D;
  }
  @keyframes acc-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

  /* ── Page wrapper ── */
  .acc-main {
    padding: 32px 52px 52px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  /* ── Page header ── */
  .acc-ph {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }
  .acc-ph-title {
    font-family: 'Syne', 'Sora', sans-serif;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--tx);
  }
  .acc-ph-sub {
    font-size: 14px;
    color: var(--tx-m);
    margin-top: 4px;
  }
  .acc-btn-edit {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border: 0.5px solid var(--bdr-bright);
    border-radius: 8px;
    background: transparent;
    color: var(--tx);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all .15s;
  }
  .acc-btn-edit:hover { background: var(--surf2); border-color: var(--brand-dim); color: var(--brand-dim); }

  /* ── Hero strip ── */
  .acc-hero {
    background: rgba(8,0,22,0.78);
    border: 0.5px solid var(--bdr);
    border-radius: 16px;
    padding: 28px 32px;
    display: flex;
    align-items: center;
    gap: 24px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  .acc-hero::after {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 220px; height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(125,57,235,0.18) 0%, transparent 70%);
    pointer-events: none;
  }
  .acc-hero-avatar {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--brand) 0%, #A98BFF 100%);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', 'Sora', sans-serif;
    font-weight: 700; font-size: 26px; color: #fff;
    flex-shrink: 0;
    box-shadow: 0 0 0 4px rgba(125,57,235,.2);
  }
  .acc-hero-info { flex: 1; min-width: 0; }
  .acc-hero-name {
    font-family: 'Syne', 'Sora', sans-serif;
    font-size: 22px; font-weight: 700;
    letter-spacing: -0.3px; color: var(--tx);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .acc-hero-email {
    font-size: 14px; color: var(--tx-m); margin-top: 3px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .acc-hero-badge {
    margin-top: 8px;
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600; color: #60A5FA;
    background: rgba(96,165,250,.1); border: 0.5px solid rgba(96,165,250,.25);
    border-radius: 5px; padding: 2px 8px;
  }
  /* stats pushed to the far right of the hero strip */
  .acc-stats {
    display: flex;
    align-items: center;
    gap: 0;
    margin-left: auto;
    flex-shrink: 0;
  }
  .acc-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 28px;
    border-left: 0.5px solid var(--bdr-bright);
  }
  .acc-stat:first-child { border-left: none; }
  .acc-stat-val {
    font-family: 'Syne', 'Sora', sans-serif;
    font-size: 26px; font-weight: 700; color: var(--brand-dim);
    line-height: 1;
  }
  .acc-stat-lbl {
    font-size: 11px; color: var(--tx-f);
    text-transform: uppercase; letter-spacing: 0.7px;
    margin-top: 4px;
  }

  /* ── 2-col grid ── */
  .acc-grid2 {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 20px;
  }

  /* ── Card ── */
  .acc-card {
    background: var(--surf);
    border: 0.5px solid var(--bdr);
    border-radius: 14px;
    padding: 22px 24px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .acc-card-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px;
  }
  .acc-card-title {
    font-family: 'Syne', 'Sora', sans-serif;
    font-size: 13px; font-weight: 600;
    letter-spacing: 0.8px; text-transform: uppercase;
    color: var(--tx-f);
  }
  .acc-card-action {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; color: var(--brand-dim); cursor: pointer;
    padding: 4px 10px;
    border: 0.5px solid rgba(125,57,235,.3);
    border-radius: 6px;
    background: var(--brand-faint);
    font-family: inherit;
    transition: all .15s;
  }
  .acc-card-action:hover { background: var(--brand-glow); }

  /* ── Vehicle rows ── */
  .vehicle-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 0;
    border-bottom: 0.5px solid var(--bdr);
  }
  .vehicle-row:last-child { border-bottom: none; padding-bottom: 0; }
  .vehicle-row:first-child { padding-top: 0; }
  .vehicle-icon-wrap {
    width: 40px; height: 40px; border-radius: 10px;
    background: var(--surf3);
    border: 0.5px solid var(--bdr);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; color: var(--brand-dim);
  }
  .vehicle-name { font-size: 14px; font-weight: 500; color: var(--tx); }
  .vehicle-plate { font-size: 12px; color: var(--tx-f); margin-top: 2px; }
  .vehicle-ev-badge {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 10px; font-weight: 700; color: #F59E0B;
    background: rgba(245,158,11,.12); border: 0.5px solid rgba(245,158,11,.3);
    border-radius: 4px; padding: 1px 5px; margin-left: 6px;
  }
  .btn-v {
    font-size: 12px; padding: 5px 12px; border-radius: 6px;
    border: 0.5px solid var(--bdr-bright); background: transparent;
    color: var(--tx-m); cursor: pointer; font-family: inherit; transition: all .15s;
  }
  .btn-v:hover { color: var(--tx); background: var(--surf2); }
  .btn-v.danger { border-color: rgba(229,72,77,.3); color: var(--red); }
  .btn-v.danger:hover { background: rgba(229,72,77,.1); }

  /* ── No vehicles empty state ── */
  .no-vehicles {
    display: flex; flex-direction: column; align-items: center;
    padding: 24px 0 6px; gap: 8px; text-align: center;
  }
  .no-vehicles-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: var(--surf3); border: 0.5px solid var(--bdr);
    display: flex; align-items: center; justify-content: center;
    color: var(--tx-f); margin-bottom: 4px;
  }

  /* ── Toggle items ── */
  .toggle-row {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 0;
    border-bottom: 0.5px solid var(--bdr);
  }
  .toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
  .toggle-row:first-child { padding-top: 0; }
  .toggle-icon-wrap {
    width: 34px; height: 34px; border-radius: 8px;
    background: var(--surf3);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .toggle-label { font-size: 13px; font-weight: 500; color: var(--tx); }
  .toggle-sub { font-size: 11px; color: var(--tx-f); margin-top: 1px; }

  .tog-track {
    width: 40px; height: 22px; border-radius: 11px;
    border: 0.5px solid var(--bdr);
    position: relative; cursor: pointer;
    transition: background .2s; flex-shrink: 0;
  }
  .tog-thumb {
    position: absolute; width: 16px; height: 16px; border-radius: 50%;
    background: #fff; top: 2px; left: 2px;
    transition: left .2s cubic-bezier(.22,1,.36,1);
    box-shadow: 0 1px 3px rgba(0,0,0,.3);
  }

  /* ── Menu list (Account & Support) ── */
  .menu-list { display: flex; flex-direction: column; gap: 2px; }
  .menu-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; border-radius: 10px;
    cursor: pointer; transition: background .12s;
    border: 0.5px solid transparent;
  }
  .menu-row:hover { background: var(--surf2); border-color: var(--bdr); }
  .menu-icon-wrap {
    width: 34px; height: 34px; border-radius: 8px;
    background: var(--surf3);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; color: var(--brand-dim);
  }
  .menu-item-title { font-size: 13px; font-weight: 500; color: var(--tx); }
  .menu-item-sub { font-size: 11px; color: var(--tx-f); margin-top: 1px; }
  .menu-chevron { color: var(--tx-f); display: flex; margin-left: auto; }

  .acc-version { font-size: 11px; color: var(--tx-f); margin-top: 2px; }

  /* ── Form fields used inside modals ── */
  .acc-field {
    width: 100%; height: 46px; border-radius: 11px;
    border: 1px solid rgba(125,57,235,.22); background: rgba(255,255,255,.04);
    color: #F0EAFA; font-family: inherit; font-size: 14px;
    padding: 0 14px; outline: none; box-sizing: border-box;
    transition: border-color .2s;
  }
  .acc-field:focus { border-color: #7D39EB; }
  .acc-label { font-size: 11px; color: #9B8EC4; letter-spacing: .6px; margin-bottom: 5px; text-transform: uppercase; }

  /* ── Modal toggle (size matches modal design) ── */
  .mod-tog-track {
    width: 44px; height: 24px; border-radius: 12px; cursor: pointer;
    transition: background .25s; position: relative; flex-shrink: 0; border: none;
  }
  .mod-tog-thumb {
    position: absolute; top: 3px; width: 18px; height: 18px;
    border-radius: 9px; background: #fff;
    transition: left .25s cubic-bezier(.22,1,.36,1);
    box-shadow: 0 1px 4px rgba(0,0,0,.3);
  }

  /* ── Mobile ── */
  @media (max-width: 767px) {
    .acc-main { padding: 14px 16px 44px; gap: 14px; }
    .acc-ph { flex-direction: column; align-items: flex-start; }
    .acc-hero { flex-wrap: wrap; padding: 20px 18px; gap: 14px; }
    .acc-hero-info { min-width: 0; }
    .acc-stats { margin-left: 0; width: 100%; border-top: 0.5px solid var(--bdr-bright); padding-top: 14px; }
    .acc-stat { flex: 1; padding: 0; align-items: center; }
    .acc-stat + .acc-stat { border-left: 0.5px solid var(--bdr-bright); }
    .acc-stat-val { font-size: 20px; }
    .acc-stat-lbl { font-size: 10px; }
    .acc-grid2 { grid-template-columns: 1fr; }
  }

  /* ── Tablet ── */
  @media (min-width: 768px) and (max-width: 1099px) {
    .acc-main { padding: 28px 32px 48px; }
  }
`;

// ── Toggle (sized for new design) ────────────────────────────────────────────

function Toggle({ on, onChange }) {
  return (
    <button
      className="tog-track"
      onClick={onChange}
      style={{ background: on ? "#7D39EB" : "var(--surf3)" }}
    >
      <div className="tog-thumb" style={{ left: on ? 20 : 2 }} />
    </button>
  );
}

// ── Modal Toggle (larger, for modal forms) ────────────────────────────────────

function ModalToggle({ on, onChange }) {
  return (
    <button
      className="mod-tog-track"
      onClick={onChange}
      style={{ background: on ? T.purple : "rgba(125,57,235,.2)" }}
    >
      <div className="mod-tog-thumb" style={{ left: on ? 23 : 3 }} />
    </button>
  );
}

// ── EmailCodeInput ────────────────────────────────────────────────────────────

function EmailCodeInput({ value, onChange }) {
  const refsArr = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const notify = (arr) => onChange(arr.join(""));

  const handleChange = (i, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) { const arr = [...digits]; arr[i] = ""; notify(arr); return; }
    if (raw.length > 1) {
      const arr = [...digits];
      for (let j = 0; j < raw.length && i + j < 6; j++) arr[i + j] = raw[j];
      notify(arr); refsArr.current[Math.min(i + raw.length, 5)]?.focus(); return;
    }
    const arr = [...digits]; arr[i] = raw[0]; notify(arr);
    if (i < 5) refsArr.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const arr = [...digits]; arr[i - 1] = ""; notify(arr);
      refsArr.current[i - 1]?.focus();
    }
  };

  return (
    <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { refsArr.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={6} value={d}
          onChange={e => handleChange(i, e)} onKeyDown={e => handleKey(i, e)}
          style={{
            width:44, height:52, borderRadius:10, textAlign:"center",
            fontSize:22, fontWeight:700, fontFamily:"inherit",
            border:`1.5px solid ${d ? T.purple : T.border}`,
            background:"rgba(255,255,255,.04)", color:T.text,
            outline:"none", caretColor:"transparent",
          }}
        />
      ))}
    </div>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────

function EditProfileModal({ open, onClose, user, profile, onSave, onEmailChanged }) {
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [dob,        setDob]        = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail,        setNewEmail]        = useState("");
  const [emailStep,       setEmailStep]       = useState("input");
  const [emailCode,       setEmailCode]       = useState("");
  const [emailLoading,    setEmailLoading]    = useState(false);
  const [emailError,      setEmailError]      = useState("");

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user?.name || ""); setPhone(profile?.phoneNumber || "");
      setPhoneError(""); setDob(profile?.dateOfBirth || ""); setError("");
      setShowEmailChange(false); setNewEmail(""); setEmailStep("input");
      setEmailCode(""); setEmailError("");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setError("");
    if (!name.trim()) { setError("Full name is required."); return; }
    const pErr = validatePhone(phone);
    if (pErr) { setPhoneError(pErr); return; }
    setLoading(true);
    try {
      await onSave({ fullName: name.trim(), phoneNumber: phone.trim() || undefined, dateOfBirth: dob || undefined });
      onClose();
    } catch (e) { setError(e?.message || "Failed to save profile."); }
    finally { setLoading(false); }
  };

  const handleEmailChangeRequest = async () => {
    setEmailError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) { setEmailError("Enter a valid email address."); return; }
    if (newEmail.trim().toLowerCase() === (user?.email || "").toLowerCase()) { setEmailError("That's already your current email."); return; }
    setEmailLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${BASE_URL}/api/users/me/email-change-request`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body:JSON.stringify({ newEmail: newEmail.trim() }),
      });
      setEmailStep("code");
    } catch (e) { setEmailError(e?.message || "Failed to send code."); }
    finally { setEmailLoading(false); }
  };

  const handleEmailChangeVerify = async () => {
    if (emailCode.length < 6) { setEmailError("Enter the full 6-digit code."); return; }
    setEmailError(""); setEmailLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/users/me/verify-email-change`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body:JSON.stringify({ code: emailCode }),
      });
      if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message || "Invalid code. Please try again."); }
      const fresh = await apiFetch("/api/users/me");
      if (fresh?.email) { localStorage.setItem("userEmail", fresh.email); onEmailChanged?.({ email: fresh.email, name: fresh.fullName }); }
      setShowEmailChange(false); setNewEmail(""); setEmailStep("input"); setEmailCode("");
    } catch (e) { setEmailError(e?.message || "Invalid code. Please try again."); }
    finally { setEmailLoading(false); }
  };

  const subBtnStyle = { flex:1, padding:"9px", borderRadius:9, fontFamily:"inherit", fontSize:13, cursor:"pointer" };

  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <div style={{ padding:"26px 22px" }}>
        <div style={{ fontSize:18,fontWeight:800,marginBottom:20 }}>Edit Profile</div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div>
            <div className="acc-label">FULL NAME</div>
            <input className="acc-field" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
              <div className="acc-label" style={{ marginBottom:0 }}>EMAIL</div>
              {!showEmailChange && (
                <button onClick={() => setShowEmailChange(true)} style={{ background:"none",border:"none",color:T.purple,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Change Email</button>
              )}
            </div>
            <input className="acc-field" value={user?.email || ""} readOnly style={{ opacity:.55,cursor:"default" }} />
          </div>
          {showEmailChange && (
            <div style={{ padding:"14px 14px 12px",borderRadius:12,border:`1px solid ${T.border}`,background:"rgba(125,57,235,.04)" }}>
              {emailStep === "input" && (
                <>
                  <div className="acc-label">NEW EMAIL ADDRESS</div>
                  <input className="acc-field" type="email" value={newEmail} onChange={e => { setNewEmail(e.target.value); setEmailError(""); }} placeholder="new@example.com" />
                  {emailError && <div style={{ fontSize:12,color:T.red,marginTop:4 }}>{emailError}</div>}
                  <div style={{ display:"flex",gap:8,marginTop:10 }}>
                    <button onClick={() => { setShowEmailChange(false); setNewEmail(""); setEmailError(""); }} style={{ ...subBtnStyle, border:`1px solid ${T.border}`,background:"transparent",color:T.sub }}>Cancel</button>
                    <button onClick={handleEmailChangeRequest} disabled={emailLoading} style={{ ...subBtnStyle, flex:2, border:`1px solid ${T.purple}`,background:"rgba(125,57,235,.12)",color:T.purple,fontWeight:600 }}>{emailLoading ? "Sending…" : "Send Code"}</button>
                  </div>
                </>
              )}
              {emailStep === "code" && (
                <>
                  <div style={{ fontSize:12,color:T.sub,marginBottom:12,lineHeight:1.6 }}>Enter the 6-digit code sent to <strong style={{ color:T.text }}>{newEmail}</strong></div>
                  <EmailCodeInput value={emailCode} onChange={v => { setEmailCode(v); setEmailError(""); }} />
                  {emailError && <div style={{ fontSize:12,color:T.red,marginTop:8,textAlign:"center" }}>{emailError}</div>}
                  <div style={{ display:"flex",gap:8,marginTop:12 }}>
                    <button onClick={() => { setEmailStep("input"); setEmailCode(""); setEmailError(""); }} style={{ ...subBtnStyle, border:`1px solid ${T.border}`,background:"transparent",color:T.sub }}>Back</button>
                    <button onClick={handleEmailChangeVerify} disabled={emailLoading || emailCode.length < 6} style={{ ...subBtnStyle, flex:2, border:`1px solid ${T.purple}`,background:"rgba(125,57,235,.12)",color:T.purple,fontWeight:600 }}>{emailLoading ? "Verifying…" : "Confirm Change"}</button>
                  </div>
                </>
              )}
            </div>
          )}
          <div>
            <div className="acc-label">PHONE NUMBER</div>
            <input className="acc-field" value={phone}
              onChange={e => { setPhone(e.target.value); if (phoneError) setPhoneError(validatePhone(e.target.value)); }}
              onBlur={e => setPhoneError(validatePhone(e.target.value))}
              placeholder="01012345678"
              style={{ borderColor: phoneError ? T.red : undefined }} />
            {phoneError && <div style={{ fontSize:12,color:T.red,marginTop:4 }}>{phoneError}</div>}
          </div>
          <div>
            <div className="acc-label">DATE OF BIRTH</div>
            <input className="acc-field" type="date" value={dob} onChange={e => setDob(e.target.value)} />
          </div>
        </div>
        {error && <div style={{ marginTop:12,padding:"9px 13px",borderRadius:9,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",color:T.red,fontSize:13 }}>{error}</div>}
        <div style={{ display:"flex",gap:10,marginTop:22 }}>
          <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:11,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer" }}>Cancel</button>
          <div style={{ flex:2 }}><GlowBtn full noArrow onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Save Changes"}</GlowBtn></div>
        </div>
      </div>
    </Modal>
  );
}

// ── Change Password Modal ─────────────────────────────────────────────────────

function ChangePasswordModal({ open, onClose, onSave, userEmail }) {
  const [current, setCurrent] = useState("");
  const [next,    setNext]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [showForgot,    setShowForgot]    = useState(false);
  const [forgotSent,    setForgotSent]    = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const reset = () => { setCurrent(""); setNext(""); setConfirm(""); setError(""); setShowForgot(false); setForgotSent(false); };

  const handleSave = async () => {
    setError("");
    if (!current || !next || !confirm) { setError("All fields are required."); return; }
    if (next !== confirm) { setError("New passwords do not match."); return; }
    if (next.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try { await onSave({ currentPassword: current, newPassword: next }); reset(); onClose(); }
    catch (e) { setError(e?.message || "Failed to change password."); }
    finally { setLoading(false); }
  };

  const handleForgot = async () => {
    setForgotLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body:JSON.stringify({ email: userEmail }),
      });
    } catch { /* always show success */ }
    finally { setForgotSent(true); setForgotLoading(false); }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} maxWidth={400}>
      <div style={{ padding:"26px 22px" }}>
        <div style={{ fontSize:18,fontWeight:800,marginBottom:20 }}>Change Password</div>
        {showForgot ? (
          <div>
            {forgotSent ? (
              <div style={{ padding:"14px 16px",borderRadius:12,background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.25)",color:"#86EFAC",fontSize:13,lineHeight:1.6,marginBottom:16 }}>
                ✓ A password reset link has been sent to <strong>{userEmail}</strong>. Check your inbox.
              </div>
            ) : (
              <>
                <div style={{ color:T.sub,fontSize:13,lineHeight:1.6,marginBottom:16 }}>We'll send a password reset link to <strong style={{ color:T.text }}>{userEmail}</strong>.</div>
                <GlowBtn full noArrow onClick={handleForgot} disabled={forgotLoading}>{forgotLoading ? "Sending…" : "Send Reset Link"}</GlowBtn>
              </>
            )}
            <div style={{ textAlign:"center",marginTop:12 }}>
              <button onClick={() => setShowForgot(false)} style={{ background:"none",border:"none",color:T.sub,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>← Back</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div><div className="acc-label">CURRENT PASSWORD</div><input className="acc-field" type="password" value={current} onChange={e => setCurrent(e.target.value)} /></div>
              <div><div className="acc-label">NEW PASSWORD</div><input className="acc-field" type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="Min. 8 characters" /></div>
              <div><div className="acc-label">CONFIRM NEW PASSWORD</div><input className="acc-field" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
            </div>
            <div style={{ textAlign:"right",marginTop:10 }}>
              <button onClick={() => setShowForgot(true)} style={{ background:"none",border:"none",color:T.purple,fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>Forgot your current password?</button>
            </div>
            {error && <div style={{ marginTop:8,padding:"9px 13px",borderRadius:9,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",color:T.red,fontSize:13 }}>{error}</div>}
            <div style={{ display:"flex",gap:10,marginTop:16 }}>
              <button onClick={() => { reset(); onClose(); }} style={{ flex:1,padding:12,borderRadius:11,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer" }}>Cancel</button>
              <div style={{ flex:2 }}><GlowBtn full noArrow onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Update Password"}</GlowBtn></div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Egyptian Plate Picker ─────────────────────────────────────────────────────

const VEHICLE_TYPES = ["SEDAN", "SUV", "TRUCK"];

const AR_LETTERS = [
  "أ","ب","ت","ث","ج","ح","خ","د","ذ","ر",
  "ز","س","ش","ص","ض","ط","ظ","ع","غ","ف",
  "ق","ك","ل","م","ن","ه","و","ي",
];

function EgyptianPlatePicker({ onChange, initialPlate }) {
  const parseInitial = () => {
    if (!initialPlate) return { nums:"", letters:[] };
    const normalized = initialPlate.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660));
    const tokens = normalized.trim().split(/\s+/);
    const numStr = tokens.filter(t => /^\d+$/.test(t)).join("").slice(0, 5);
    const letterChars = tokens.filter(t => /[؀-ۿ]/.test(t)).flatMap(t => [...t]).filter(c => /[؀-ۿ]/.test(c)).slice(0, 3);
    return { nums: numStr, letters: letterChars };
  };
  const init = parseInitial();
  const [nums,    setNums]    = useState(init.nums);
  const [letters, setLetters] = useState(init.letters);

  const buildPlate = (n, ls) => `${n}${ls.length ? " " + ls.join("") : ""}`;

  const toggleLetter = l => {
    setLetters(prev => {
      const next = prev.includes(l) ? prev.filter(x => x !== l) : prev.length < 3 ? [...prev, l] : prev;
      onChange(buildPlate(nums, next)); return next;
    });
  };

  const handleNums = e => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 5);
    setNums(v); onChange(buildPlate(v, letters));
  };

  const handleLetterInput = e => {
    const arabic = [...e.target.value].filter(c => /[؀-ۿ]/.test(c)).slice(0, 3);
    setLetters(arabic); onChange(buildPlate(nums, arabic));
  };

  const platePreview = buildPlate(nums, letters);

  return (
    <div>
      <div style={{ display:"flex",alignItems:"stretch",borderRadius:10,overflow:"hidden",border:"3px solid #222",marginBottom:16,height:68,background:"linear-gradient(135deg,#f5f0d0,#ede8b8)",boxShadow:"0 4px 16px rgba(0,0,0,.35)" }}>
        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",borderRight:"3px solid #222",fontFamily:"'Courier New',monospace",fontSize:26,fontWeight:800,color:"#111",letterSpacing:3,padding:"0 12px" }}>
          {nums || <span style={{ color:"#bbb",fontSize:20 }}>0000</span>}
        </div>
        <div style={{ width:18,display:"flex",flexDirection:"column" }}>
          <div style={{ flex:1,background:"#CE1126" }} /><div style={{ flex:1,background:"#fff" }} /><div style={{ flex:1,background:"#000" }} />
        </div>
        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",direction:"rtl",fontFamily:"'Amiri','Noto Naskh Arabic',serif",fontSize:26,fontWeight:800,color:"#111",letterSpacing:4,padding:"0 12px" }}>
          {letters.length > 0 ? letters.join(" ") : <span style={{ color:"#bbb",fontSize:20,fontFamily:"inherit" }}>ـ ـ ـ</span>}
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
        <div><div className="acc-label">NUMBERS (left side)</div><input className="acc-field" value={nums} onChange={handleNums} placeholder="12345" inputMode="numeric" /></div>
        <div><div className="acc-label">ARABIC LETTERS — type or tap</div><input className="acc-field" value={letters.join("")} onChange={handleLetterInput} placeholder="ص ص ص" dir="rtl" style={{ fontFamily:"'Amiri','Noto Naskh Arabic',serif",fontSize:22,letterSpacing:4,textAlign:"center",borderColor:letters.length ? T.purple : undefined }} /></div>
      </div>
      <div className="acc-label" style={{ marginBottom:8 }}>OR TAP TO SELECT LETTERS</div>
      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
        {AR_LETTERS.map(l => {
          const sel = letters.includes(l);
          return (
            <button key={l} type="button" onClick={() => toggleLetter(l)} style={{ width:38,height:38,borderRadius:8,cursor:"pointer",transition:"all .15s",border:`1.5px solid ${sel ? T.purple : T.border}`,background:sel ? "rgba(125,57,235,.18)" : "rgba(255,255,255,.03)",color:sel ? T.purple : T.text,fontFamily:"'Amiri','Noto Naskh Arabic',Georgia,serif",fontSize:18,fontWeight:700 }}>{l}</button>
          );
        })}
      </div>
      {letters.length === 3 && <div style={{ fontSize:11,color:T.sub,marginTop:6 }}>Maximum 3 letters selected. Tap a letter or clear the text input to change.</div>}
      {platePreview.trim() && <div style={{ marginTop:10,fontSize:12,color:T.sub }}>Stored as: <strong style={{ color:T.text }}>{platePreview.toUpperCase()}</strong></div>}
    </div>
  );
}

// ── Add Vehicle Modal ─────────────────────────────────────────────────────────

const menuItemStyle = {
  display:"block",width:"100%",padding:"11px 16px",textAlign:"left",
  border:"none",borderBottom:`1px solid rgba(125,57,235,.1)`,
  background:"transparent",color:T.text,fontFamily:"inherit",fontSize:13,cursor:"pointer",transition:"background .15s",
};

async function scanPlateImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/api/plates/scan`, { method:"POST", headers:token ? { Authorization:`Bearer ${token}` } : {}, body:formData });
  if (!res.ok) throw new Error("Scan request failed");
  const data = await res.json().catch(() => null);
  if (data?.valid && data?.plate) return data.plate;
  return null;
}

function AddVehicleModal({ open, onClose, onAdd }) {
  const [make,         setMake]         = useState("");
  const [model,        setModel]        = useState("");
  const [nickname,     setNickname]     = useState("");
  const [plate,        setPlate]        = useState("");
  const [vehicleType,  setVehicleType]  = useState("SEDAN");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [scannedPlate, setScannedPlate] = useState(null);
  const [scanning,     setScanning]     = useState(false);
  const [scanError,    setScanError]    = useState("");
  const [showScanMenu, setShowScanMenu] = useState(false);
  const cameraRef  = useRef(null);
  const galleryRef = useRef(null);
  const icons = ["🚗","🚙","🛻","🏎","🚕"];
  const [icon, setIcon] = useState("🚗");
  const isEV = detectEV(make, model);

  const reset = () => { setMake(""); setModel(""); setNickname(""); setPlate(""); setVehicleType("SEDAN"); setIcon("🚗"); setError(""); setScannedPlate(null); setScanError(""); setShowScanMenu(false); };

  const handleScanFile = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = ""; setScanError(""); setScanning(true); setShowScanMenu(false);
    try {
      const detected = await scanPlateImage(file);
      if (detected) { setScannedPlate(detected); setScanError(""); }
      else setScanError(plate.replace(/\s/g,"") ? "Could not read a plate from that image — your current entry is kept below." : "Could not read a plate from that image. Please enter it manually.");
    } catch { setScanError("Scan failed. Please enter the plate manually."); }
    finally { setScanning(false); }
  };

  const handleAdd = async () => {
    setError("");
    if (!plate.replace(/\s/g,"")) { setError("License plate is required — enter the numbers and select letters."); return; }
    setLoading(true);
    try {
      const makeModel = `${make.trim()} ${model.trim()}`.trim() || undefined;
      await onAdd({ plateNumber:plate.trim().toUpperCase(), makeAndModel:makeModel, nickname:nickname.trim() || undefined, vehicleType, label:nickname.trim() || makeModel || plate.trim().toUpperCase(), sub:plate.trim().toUpperCase(), isEV, icon });
      reset(); onClose();
    } catch (e) { setError(e?.message || "Failed to add vehicle. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} maxWidth={480}>
      <div style={{ padding:"26px 22px" }}>
        <div style={{ fontSize:18,fontWeight:800,marginBottom:16 }}>Add Vehicle</div>
        <div style={{ display:"flex",gap:10,marginBottom:16 }}>
          {icons.map(i => (
            <button key={i} onClick={() => setIcon(i)} style={{ width:44,height:44,borderRadius:11,fontSize:20,border:`1.5px solid ${icon===i ? T.purple : T.border}`,background:icon===i ? "rgba(125,57,235,.12)" : "transparent",cursor:"pointer",transition:"all .15s" }}>{i}</button>
          ))}
        </div>
        <div style={{ marginBottom:14 }}>
          <div className="acc-label">NICKNAME <span style={{ color:T.sub,fontWeight:400,letterSpacing:0 }}>(optional)</span></div>
          <input className="acc-field" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g. Daily Driver, Work Car…" />
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
          <div><div className="acc-label">MAKE</div><input className="acc-field" value={make} onChange={e => setMake(e.target.value)} placeholder="Toyota" /></div>
          <div><div className="acc-label">MODEL</div><input className="acc-field" value={model} onChange={e => setModel(e.target.value)} placeholder="Corolla" /></div>
        </div>
        <div style={{ marginBottom:14 }}>
          <div className="acc-label">VEHICLE TYPE</div>
          <select className="acc-field" value={vehicleType} onChange={e => setVehicleType(e.target.value)} style={{ appearance:"none",cursor:"pointer" }}>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:14,padding:"14px 14px 10px",borderRadius:12,border:`1px solid ${T.border}`,background:"rgba(255,255,255,.02)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <div className="acc-label" style={{ marginBottom:0 }}>LICENSE PLATE *</div>
            <div style={{ position:"relative" }}>
              <button type="button" onClick={() => setShowScanMenu(p => !p)} disabled={scanning} style={{ padding:"5px 10px",borderRadius:7,fontSize:12,fontWeight:600,border:`1px solid ${T.border}`,background:"rgba(125,57,235,.08)",color:T.purple,fontFamily:"inherit",cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}>{scanning ? "Scanning…" : "📷 Scan Plate"}</button>
              {showScanMenu && (
                <div style={{ position:"absolute",right:0,top:"calc(100% + 6px)",zIndex:10,background:"#1a0040",border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden",minWidth:180,boxShadow:"0 8px 24px rgba(0,0,0,.4)" }}>
                  <button type="button" onClick={() => cameraRef.current?.click()} style={menuItemStyle}>📷 Take Photo</button>
                  <button type="button" onClick={() => galleryRef.current?.click()} style={{ ...menuItemStyle, borderBottom:"none" }}>🖼 Choose from Gallery</button>
                </div>
              )}
            </div>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleScanFile} />
          <input ref={galleryRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleScanFile} />
          {scanError && <div style={{ marginBottom:10,padding:"8px 11px",borderRadius:8,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",color:T.red,fontSize:12 }}>{scanError}</div>}
          {scannedPlate && <div style={{ marginBottom:10,padding:"8px 11px",borderRadius:8,background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.2)",color:"#86EFAC",fontSize:12 }}>✓ Plate detected: <strong>{scannedPlate}</strong>. You can adjust it below.</div>}
          <EgyptianPlatePicker key={scannedPlate || "none"} onChange={setPlate} initialPlate={scannedPlate} />
        </div>
        {make && model && (
          <div style={{ marginBottom:14,padding:"9px 13px",borderRadius:9,background:isEV ? "rgba(245,158,11,.08)" : "rgba(255,255,255,.03)",border:`1px solid ${isEV ? "rgba(245,158,11,.3)" : T.border}`,display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:16 }}>{isEV ? "⚡" : "🚗"}</span>
            <div>
              <div style={{ fontSize:12,fontWeight:700,color:isEV ? "#F59E0B" : T.sub }}>{isEV ? "Electric Vehicle Detected" : "Combustion Vehicle"}</div>
              <div style={{ fontSize:11,color:T.sub }}>{isEV ? "Qualifies for EV charging spots." : "Not eligible for EV charging spots."}</div>
            </div>
          </div>
        )}
        {error && <div style={{ marginBottom:12,padding:"10px 13px",borderRadius:9,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",color:T.red,fontSize:13 }}>{error}</div>}
        <div style={{ display:"flex",gap:10,marginTop:4 }}>
          <button onClick={() => { reset(); onClose(); }} style={{ flex:1,padding:12,borderRadius:11,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer" }}>Cancel</button>
          <div style={{ flex:2 }}><GlowBtn full noArrow onClick={handleAdd} disabled={loading}>{loading ? "Adding…" : "Add Vehicle"}</GlowBtn></div>
        </div>
      </div>
    </Modal>
  );
}

// ── Edit Vehicle Modal ────────────────────────────────────────────────────────

function EditVehicleModal({ open, onClose, vehicle, onSave }) {
  const [make,        setMake]        = useState("");
  const [model,       setModel]       = useState("");
  const [nickname,    setNickname]    = useState("");
  const [plate,       setPlate]       = useState("");
  const [vehicleType, setVehicleType] = useState("SEDAN");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (open && vehicle) {
      const parts = (vehicle.makeAndModel || "").split(" ");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMake(parts[0] || ""); setModel(parts.slice(1).join(" ") || "");
      setNickname(vehicle.nickname || ""); setPlate(vehicle.plateNumber || "");
      setVehicleType(vehicle.vehicleType || "SEDAN"); setError("");
    }
  }, [open, vehicle]);

  const handleSave = async () => {
    setError("");
    if (!plate.replace(/\s/g,"")) { setError("License plate is required."); return; }
    setLoading(true);
    try {
      const makeModel = `${make.trim()} ${model.trim()}`.trim() || undefined;
      await onSave(vehicle.id, { plateNumber:plate.trim().toUpperCase(), vehicleType, makeAndModel:makeModel, nickname:nickname.trim() || null });
      onClose();
    } catch (e) { setError(e?.message || "Failed to update vehicle."); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={480}>
      <div style={{ padding:"26px 22px" }}>
        <div style={{ fontSize:18,fontWeight:800,marginBottom:16 }}>Edit Vehicle</div>
        <div style={{ marginBottom:14 }}>
          <div className="acc-label">NICKNAME <span style={{ color:T.sub,fontWeight:400,letterSpacing:0 }}>(optional)</span></div>
          <input className="acc-field" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g. Daily Driver, Work Car…" />
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
          <div><div className="acc-label">MAKE</div><input className="acc-field" value={make} onChange={e => setMake(e.target.value)} placeholder="Toyota" /></div>
          <div><div className="acc-label">MODEL</div><input className="acc-field" value={model} onChange={e => setModel(e.target.value)} placeholder="Corolla" /></div>
        </div>
        <div style={{ marginBottom:14 }}>
          <div className="acc-label">VEHICLE TYPE</div>
          <select className="acc-field" value={vehicleType} onChange={e => setVehicleType(e.target.value)} style={{ appearance:"none",cursor:"pointer" }}>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:14,padding:"14px 14px 10px",borderRadius:12,border:`1px solid ${T.border}`,background:"rgba(255,255,255,.02)" }}>
          <div className="acc-label" style={{ marginBottom:10 }}>LICENSE PLATE *</div>
          <EgyptianPlatePicker key={open ? vehicle?.id : "closed"} onChange={setPlate} initialPlate={plate} />
        </div>
        {error && <div style={{ marginBottom:12,padding:"10px 13px",borderRadius:9,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",color:T.red,fontSize:13 }}>{error}</div>}
        <div style={{ display:"flex",gap:10,marginTop:4 }}>
          <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:11,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer" }}>Cancel</button>
          <div style={{ flex:2 }}><GlowBtn full noArrow onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Save Changes"}</GlowBtn></div>
        </div>
      </div>
    </Modal>
  );
}

// ── Account Tab ───────────────────────────────────────────────────────────────

const PREF_ITEMS = [
  { key:"accessibility", icon: <IWheelchair size={16} />, color:"#A98BFF", label:"Accessibility",      sub:"Mobility impairment mode",       isAccessibility: true },
  { key:"notifications", icon: <IBell      size={16} />, color:"#F5A623", label:"Push Notifications", sub:"Session alerts & reminders"          },
  { key:"location",      icon: <IMapPin    size={16} />, color:"#3DD68C", label:"Location Services",  sub:"GPS for nearby parking"              },
  { key:"emailAlerts",   icon: <IMail      size={16} />, color:"#A98BFF", label:"Email Alerts",       sub:"Receipts & confirmations"            },
  { key:"darkMode",      icon: <IMoon      size={16} />, color:"#A98BFF", label:"Dark Mode",          sub:"Always on for best experience"       },
];

const ACCOUNT_ITEMS = [
  { Icon: IUser,       label:"Edit Profile",    sub:"Name, email & phone",    action:"edit"     },
  { Icon: ILock,       label:"Security",        sub:"Password & PIN settings", action:"password" },
  { Icon: ICreditCard, label:"Payment Methods", sub:"Cards & saved payments",  action:null       },
  { Icon: IShield,     label:"Privacy",         sub:"Data & permissions",      action:null       },
];

const SUPPORT_ITEMS = [
  { Icon: IHelp, label:"Help Center",  sub:"FAQs & guides"            },
  { Icon: IMsg,  label:"Contact Us",   sub:"Chat or email support"    },
  { Icon: IStar, label:"Rate the App", sub:"Share your feedback"      },
];

export default function AccountTab({ user, vehicles, profile, onProfileUpdate, onAddVehicle, onUpdateVehicle, onDeleteVehicle, onSaveProfile, onChangePassword, onUserUpdate }) {
  const [editOpen,       setEditOpen]       = useState(false);
  const [addVehicle,     setAddVehicle]     = useState(false);
  const [editVehicle,    setEditVehicle]    = useState(null);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [deletingId,     setDeletingId]     = useState(null);

  const [sessionCount, setSessionCount] = useState(0);
  const [totalSpent,   setTotalSpent]   = useState(0);

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/reservations/history").then(history => {
      if (!Array.isArray(history)) return;
      const completed = history.filter(r => r.status === "COMPLETED");
      setSessionCount(completed.length);
      const spent = completed.reduce((sum, r) => {
        if (!r.enteredAt || !r.exitedAt || !r.hourlyRate) return sum;
        const hours = (new Date(r.exitedAt) - new Date(r.enteredAt)) / 3_600_000;
        return sum + hours * Number(r.hourlyRate);
      }, 0);
      setTotalSpent(Math.round(spent));
    }).catch(() => {});
  }, [user]);

  const [prefs, setPrefs] = useState({ notifications:true, location:true, emailAlerts:false, darkMode:true });
  const toggle = k => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const accessibility = profile?.accessibility ?? false;
  const toggleAccessibility = () => onProfileUpdate({ ...profile, accessibility: !accessibility });

  const initials = (user?.name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const handleAccountAction = (action) => {
    if (action === "edit")     setEditOpen(true);
    if (action === "password") setChangePassOpen(true);
  };

  return (
    <div className="acc-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="acc-main">

        {/* ── Page header ── */}
        <div className="acc-ph">
          <div>
            <div className="acc-ph-title">My Account</div>
            <div className="acc-ph-sub">Manage your profile, vehicles, and preferences</div>
          </div>
          <button className="acc-btn-edit" onClick={() => setEditOpen(true)}>
            <IEdit size={14} /> Edit Profile
          </button>
        </div>

        {/* ── Hero identity strip ── */}
        <div className="acc-hero">
          <div className="acc-hero-avatar">{initials}</div>
          <div className="acc-hero-info">
            <div className="acc-hero-name">{user?.name || "User"}</div>
            <div className="acc-hero-email">{user?.email || "user@email.com"}</div>
            {accessibility && (
              <div className="acc-hero-badge">
                <IWheelchair size={11} /> Accessibility
              </div>
            )}
          </div>
          <div className="acc-stats">
            <div className="acc-stat">
              <div className="acc-stat-val">{vehicles.length}</div>
              <div className="acc-stat-lbl">Vehicles</div>
            </div>
            <div className="acc-stat">
              <div className="acc-stat-val">{sessionCount}</div>
              <div className="acc-stat-lbl">Sessions</div>
            </div>
            <div className="acc-stat">
              <div className="acc-stat-val">{totalSpent}</div>
              <div className="acc-stat-lbl">EGP Spent</div>
            </div>
          </div>
        </div>

        {/* ── Row 1: Vehicles + Preferences ── */}
        <div className="acc-grid2">

          {/* Vehicles card */}
          <div className="acc-card">
            <div className="acc-card-head">
              <span className="acc-card-title">My Vehicles</span>
              <button className="acc-card-action" onClick={() => setAddVehicle(true)}>
                <IPlus size={12} /> Add Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="no-vehicles">
                <div className="no-vehicles-icon"><ICar size={20} /></div>
                <div style={{ fontSize:13,fontWeight:500,color:"var(--tx)" }}>No vehicles yet</div>
                <div style={{ fontSize:12,color:"var(--tx-f)" }}>Add one to start reserving parking spots.</div>
              </div>
            ) : vehicles.map(v => (
              <div key={v.id || v.sub} className="vehicle-row">
                <div className="vehicle-icon-wrap"><ICar size={18} /></div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div className="vehicle-name">
                    {v.label}
                    {v.isEV && <span className="vehicle-ev-badge">⚡ EV</span>}
                  </div>
                  <div className="vehicle-plate">{v.sub}</div>
                </div>
                <div style={{ display:"flex",gap:8,flexShrink:0 }}>
                  <button className="btn-v" onClick={() => setEditVehicle(v)}>Edit</button>
                  <button
                    className="btn-v danger"
                    disabled={deletingId === v.id}
                    onClick={async () => {
                      setDeletingId(v.id);
                      try { await onDeleteVehicle?.(v.id); } finally { setDeletingId(null); }
                    }}
                  >{deletingId === v.id ? "…" : "Remove"}</button>
                </div>
              </div>
            ))}
          </div>

          {/* Preferences card */}
          <div className="acc-card">
            <div className="acc-card-head">
              <span className="acc-card-title">Preferences</span>
            </div>
            {PREF_ITEMS.map(item => {
              const isOn = item.isAccessibility ? accessibility : prefs[item.key];
              const handleToggle = item.isAccessibility ? toggleAccessibility : () => toggle(item.key);
              return (
                <div key={item.key} className="toggle-row">
                  <div className="toggle-icon-wrap" style={{ color: item.color }}>{item.icon}</div>
                  <div style={{ flex:1 }}>
                    <div className="toggle-label">{item.label}</div>
                    <div className="toggle-sub">{item.sub}</div>
                  </div>
                  <Toggle on={isOn} onChange={handleToggle} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Row 2: Account + Support ── */}
        <div className="acc-grid2">

          {/* Account card */}
          <div className="acc-card">
            <div className="acc-card-head">
              <span className="acc-card-title">Account</span>
            </div>
            <div className="menu-list">
              {ACCOUNT_ITEMS.map(item => {
                const ItemIcon = item.Icon;
                return (
                  <div key={item.label} className="menu-row" onClick={() => handleAccountAction(item.action)}>
                    <div className="menu-icon-wrap"><ItemIcon size={16} /></div>
                    <div style={{ flex:1 }}>
                      <div className="menu-item-title">{item.label}</div>
                      <div className="menu-item-sub">{item.sub}</div>
                    </div>
                    <div className="menu-chevron"><IChevronR size={14} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Support card */}
          <div className="acc-card">
            <div className="acc-card-head">
              <span className="acc-card-title">Support</span>
            </div>
            <div className="menu-list">
              {SUPPORT_ITEMS.map(item => {
                const ItemIcon = item.Icon;
                return (
                  <div key={item.label} className="menu-row">
                    <div className="menu-icon-wrap"><ItemIcon size={16} /></div>
                    <div style={{ flex:1 }}>
                      <div className="menu-item-title">{item.label}</div>
                      <div className="menu-item-sub">{item.sub}</div>
                    </div>
                    <div className="menu-chevron"><IChevronR size={14} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ textAlign:"center" }}>
          <div className="acc-version">ezrakna v1.0.0 · Cairo Parking Platform</div>
        </div>

      </div>

      {/* ── Modals ── */}
      <EditProfileModal
        open={editOpen} onClose={() => setEditOpen(false)}
        user={user} profile={profile} onSave={onSaveProfile} onEmailChanged={onUserUpdate}
      />
      <ChangePasswordModal
        open={changePassOpen} onClose={() => setChangePassOpen(false)}
        onSave={onChangePassword} userEmail={user?.email}
      />
      <AddVehicleModal open={addVehicle} onClose={() => setAddVehicle(false)} onAdd={onAddVehicle} />
      <EditVehicleModal open={!!editVehicle} onClose={() => setEditVehicle(null)} vehicle={editVehicle} onSave={onUpdateVehicle} />
    </div>
  );
}
