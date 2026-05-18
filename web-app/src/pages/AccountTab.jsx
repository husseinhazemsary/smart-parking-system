import React, { useState, useEffect } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import Modal from "../components/ui/Modal";
import GlowBtn from "../components/ui/GlowBtn";
import { detectEV } from "../utils/evDetection";

const CSS = `
  .acc-wrap { animation:acc-up .32s cubic-bezier(.22,1,.36,1); }
  @keyframes acc-up { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

  .acc-section {
    border-radius:16px; border:1.5px solid rgba(125,57,235,.18);
    background:rgba(17,0,48,.55); overflow:hidden; margin-bottom:14px;
  }
  .acc-row {
    display:flex; align-items:center; gap:12px;
    padding:13px 18px; cursor:pointer;
    transition:background .18s;
    border-bottom:1px solid rgba(125,57,235,.1);
  }
  .acc-row:last-child { border-bottom:none; }
  .acc-row:hover { background:rgba(125,57,235,.06); }

  .acc-icon {
    width:38px; height:38px; border-radius:10px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:17px; background:rgba(125,57,235,.1);
  }

  .tog-track {
    width:44px; height:24px; border-radius:12px; cursor:pointer;
    transition:background .25s; position:relative; flex-shrink:0; border:none;
  }
  .tog-thumb {
    position:absolute; top:3px;
    width:18px; height:18px; border-radius:9px; background:#fff;
    transition:left .25s cubic-bezier(.22,1,.36,1);
    box-shadow:0 1px 4px rgba(0,0,0,.3);
  }

  .acc-vehicle {
    display:flex; align-items:center; gap:12px; padding:13px 18px;
    border-bottom:1px solid rgba(125,57,235,.1);
  }
  .acc-vehicle:last-child { border-bottom:none; }

  .acc-field {
    width:100%; height:46px; border-radius:11px;
    border:1px solid ${T.border}; background:rgba(255,255,255,.04);
    color:${T.text}; font-family:inherit; font-size:14px;
    padding:0 14px; outline:none; box-sizing:border-box;
    transition:border-color .2s;
  }
  .acc-field:focus { border-color:${T.purple}; }
  .acc-label { font-size:11px; color:${T.sub}; letter-spacing:.6px; margin-bottom:5px; }

  .acc-container { padding:22px 16px; }
  @media (min-width: 880px) {
    .acc-container { padding:28px 22px; }
    .acc-grid { display:grid; grid-template-columns: 1.1fr .9fr; gap:16px; align-items:start; }
    .acc-col { display:flex; flex-direction:column; gap:14px; }
  }
`;

function Toggle({ on, onChange }) {
  return (
    <button className="tog-track" onClick={onChange} style={{ background: on ? T.purple : "rgba(125,57,235,.2)" }}>
      <div className="tog-thumb" style={{ left: on ? 23 : 3 }} />
    </button>
  );
}

function EditProfileModal({ open, onClose, user, profile, onSave }) {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [dob,     setDob]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (open) {
      setName(user?.name || "");
      setPhone(profile?.phoneNumber || "");
      setDob(profile?.dateOfBirth || "");
      setError("");
    }
  }, [open]);

  const handleSave = async () => {
    setError("");
    if (!name.trim()) { setError("Full name is required."); return; }
    setLoading(true);
    try {
      await onSave({ fullName: name.trim(), phoneNumber: phone.trim() || undefined, dateOfBirth: dob || undefined });
      onClose();
    } catch (e) {
      setError(e?.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="acc-label">EMAIL (cannot be changed)</div>
            <input className="acc-field" value={user?.email || ""} readOnly
              style={{ opacity:.5,cursor:"default" }} />
          </div>
          <div>
            <div className="acc-label">PHONE NUMBER</div>
            <input className="acc-field" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20 100 000 0000" />
          </div>
          <div>
            <div className="acc-label">DATE OF BIRTH</div>
            <input className="acc-field" type="date" value={dob} onChange={e => setDob(e.target.value)} />
          </div>
        </div>
        {error && (
          <div style={{ marginTop:12,padding:"9px 13px",borderRadius:9,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",color:T.red,fontSize:13 }}>
            {error}
          </div>
        )}
        <div style={{ display:"flex",gap:10,marginTop:22 }}>
          <button onClick={onClose} style={{
            flex:1,padding:12,borderRadius:11,border:`1px solid ${T.border}`,
            background:"transparent",color:T.sub,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer",
          }}>Cancel</button>
          <div style={{ flex:2 }}><GlowBtn full noArrow onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Save Changes"}</GlowBtn></div>
        </div>
      </div>
    </Modal>
  );
}

function ChangePasswordModal({ open, onClose, onSave }) {
  const [current, setCurrent] = useState("");
  const [next,    setNext]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const reset = () => { setCurrent(""); setNext(""); setConfirm(""); setError(""); };

  const handleSave = async () => {
    setError("");
    if (!current || !next || !confirm) { setError("All fields are required."); return; }
    if (next !== confirm) { setError("New passwords do not match."); return; }
    if (next.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await onSave({ currentPassword: current, newPassword: next });
      reset();
      onClose();
    } catch (e) {
      setError(e?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} maxWidth={400}>
      <div style={{ padding:"26px 22px" }}>
        <div style={{ fontSize:18,fontWeight:800,marginBottom:20 }}>Change Password</div>
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div>
            <div className="acc-label">CURRENT PASSWORD</div>
            <input className="acc-field" type="password" value={current} onChange={e => setCurrent(e.target.value)} />
          </div>
          <div>
            <div className="acc-label">NEW PASSWORD</div>
            <input className="acc-field" type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="Min. 8 characters" />
          </div>
          <div>
            <div className="acc-label">CONFIRM NEW PASSWORD</div>
            <input className="acc-field" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
        </div>
        {error && (
          <div style={{ marginTop:12,padding:"9px 13px",borderRadius:9,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",color:T.red,fontSize:13 }}>
            {error}
          </div>
        )}
        <div style={{ display:"flex",gap:10,marginTop:22 }}>
          <button onClick={() => { reset(); onClose(); }} style={{
            flex:1,padding:12,borderRadius:11,border:`1px solid ${T.border}`,
            background:"transparent",color:T.sub,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer",
          }}>Cancel</button>
          <div style={{ flex:2 }}><GlowBtn full noArrow onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Update Password"}</GlowBtn></div>
        </div>
      </div>
    </Modal>
  );
}

const VEHICLE_TYPES = ["SEDAN", "SUV", "TRUCK"];

// Common Arabic letters used on Egyptian license plates
const AR_LETTERS = [
  "أ","ب","ت","ث","ج","ح","خ","د","ذ","ر",
  "ز","س","ش","ص","ض","ط","ظ","ع","غ","ف",
  "ق","ك","ل","م","ن","ه","و","ي",
];

// Egyptian license plate picker: left = numbers, right = Arabic letters (RTL)
function EgyptianPlatePicker({ onChange }) {
  const [nums,    setNums]    = useState("");
  const [letters, setLetters] = useState([]);

  const toggleLetter = l => {
    setLetters(prev => {
      const next = prev.includes(l) ? prev.filter(x => x !== l) : prev.length < 3 ? [...prev, l] : prev;
      const plate = buildPlate(nums, next);
      onChange(plate);
      return next;
    });
  };

  const handleNums = e => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 5);
    setNums(v);
    onChange(buildPlate(v, letters));
  };

  const buildPlate = (n, ls) => `${n}${ls.length ? " " + ls.join("") : ""}`;

  const platePreview = buildPlate(nums, letters);

  return (
    <div>
      {/* Visual plate preview */}
      <div style={{
        display:"flex",alignItems:"stretch",borderRadius:10,overflow:"hidden",
        border:"3px solid #222",marginBottom:16,height:68,
        background:"linear-gradient(135deg,#f5f0d0,#ede8b8)",
        boxShadow:"0 4px 16px rgba(0,0,0,.35)",
      }}>
        {/* Left: numbers */}
        <div style={{
          flex:1,display:"flex",alignItems:"center",justifyContent:"center",
          borderRight:"3px solid #222",
          fontFamily:"'Courier New',monospace",
          fontSize:26,fontWeight:800,color:"#111",letterSpacing:3,
          padding:"0 12px",
        }}>
          {nums || <span style={{ color:"#bbb",fontSize:20 }}>0000</span>}
        </div>
        {/* Middle: Egypt flag stripe */}
        <div style={{ width:18,display:"flex",flexDirection:"column" }}>
          <div style={{ flex:1,background:"#CE1126" }} />
          <div style={{ flex:1,background:"#fff" }} />
          <div style={{ flex:1,background:"#000" }} />
        </div>
        {/* Right: Arabic letters (RTL) */}
        <div style={{
          flex:1,display:"flex",alignItems:"center",justifyContent:"center",
          direction:"rtl",
          fontFamily:"'Amiri','Noto Naskh Arabic',serif",
          fontSize:26,fontWeight:800,color:"#111",letterSpacing:4,
          padding:"0 12px",
        }}>
          {letters.length > 0
            ? letters.join(" ")
            : <span style={{ color:"#bbb",fontSize:20,fontFamily:"inherit" }}>ـ ـ ـ</span>}
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
        {/* Number input */}
        <div>
          <div className="acc-label">NUMBERS (left side)</div>
          <input
            className="acc-field"
            value={nums}
            onChange={handleNums}
            placeholder="12345"
            inputMode="numeric"
          />
        </div>
        {/* Selected letters display */}
        <div>
          <div className="acc-label">LETTERS SELECTED ({letters.length}/3)</div>
          <div style={{
            height:46,borderRadius:11,border:`1px solid ${letters.length ? T.purple : T.border}`,
            background:"rgba(125,57,235,.05)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:22,letterSpacing:6,direction:"rtl",
            fontFamily:"'Amiri','Noto Naskh Arabic',serif",color:T.text,
          }}>
            {letters.length ? letters.join(" ") : <span style={{ fontSize:12,color:T.sub,letterSpacing:0,fontFamily:"inherit" }}>Pick below</span>}
          </div>
        </div>
      </div>

      {/* Arabic letter grid */}
      <div className="acc-label" style={{ marginBottom:8 }}>ARABIC LETTERS (right side — tap to select)</div>
      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
        {AR_LETTERS.map(l => {
          const sel = letters.includes(l);
          return (
            <button key={l} type="button" onClick={() => toggleLetter(l)} style={{
              width:38,height:38,borderRadius:8,cursor:"pointer",transition:"all .15s",
              border:`1.5px solid ${sel ? T.purple : T.border}`,
              background: sel ? "rgba(125,57,235,.18)" : "rgba(255,255,255,.03)",
              color: sel ? T.purple : T.text,
              fontFamily:"'Amiri','Noto Naskh Arabic',Georgia,serif",
              fontSize:18,fontWeight:700,
            }}>{l}</button>
          );
        })}
      </div>

      {letters.length === 3 && (
        <div style={{ fontSize:11,color:T.sub,marginTop:6 }}>
          Maximum 3 letters selected. Click a letter to deselect it.
        </div>
      )}

      {platePreview.trim() && (
        <div style={{ marginTop:10,fontSize:12,color:T.sub }}>
          Stored as: <strong style={{ color:T.text }}>{platePreview.toUpperCase()}</strong>
        </div>
      )}
    </div>
  );
}

function AddVehicleModal({ open, onClose, onAdd }) {
  const [make,        setMake]        = useState("");
  const [model,       setModel]       = useState("");
  const [plate,       setPlate]       = useState("");
  const [vehicleType, setVehicleType] = useState("SEDAN");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const icons = ["🚗", "🚙", "🛻", "🏎", "🚕"];
  const [icon, setIcon] = useState("🚗");

  const isEV = detectEV(make, model);

  const reset = () => {
    setMake(""); setModel(""); setPlate(""); setVehicleType("SEDAN"); setIcon("🚗"); setError("");
  };

  const handleAdd = async () => {
    setError("");
    if (!plate.replace(/\s/g, "")) { setError("License plate is required — enter the numbers and select letters."); return; }

    setLoading(true);
    try {
      await onAdd({
        plateNumber:  plate.trim().toUpperCase(),
        makeAndModel: `${make.trim()} ${model.trim()}`.trim() || undefined,
        vehicleType,
        label: `${make.trim()} ${model.trim()}`.trim() || plate.trim().toUpperCase(),
        sub:   plate.trim().toUpperCase(),
        isEV,
        icon,
      });
      reset();
      onClose();
    } catch (e) {
      setError(e?.message || "Failed to add vehicle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} maxWidth={480}>
      <div style={{ padding:"26px 22px" }}>
        <div style={{ fontSize:18,fontWeight:800,marginBottom:16 }}>Add Vehicle</div>

        <div style={{ display:"flex",gap:10,marginBottom:16 }}>
          {icons.map(i => (
            <button key={i} onClick={() => setIcon(i)} style={{
              width:44,height:44,borderRadius:11,fontSize:20,
              border:`1.5px solid ${icon===i ? T.purple : T.border}`,
              background: icon===i ? "rgba(125,57,235,.12)" : "transparent",
              cursor:"pointer",transition:"all .15s",
            }}>{i}</button>
          ))}
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
          <div>
            <div className="acc-label">MAKE</div>
            <input className="acc-field" value={make} onChange={e => setMake(e.target.value)} placeholder="Toyota" />
          </div>
          <div>
            <div className="acc-label">MODEL</div>
            <input className="acc-field" value={model} onChange={e => setModel(e.target.value)} placeholder="Corolla" />
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <div className="acc-label">VEHICLE TYPE</div>
          <select
            className="acc-field"
            value={vehicleType}
            onChange={e => setVehicleType(e.target.value)}
            style={{ appearance:"none",cursor:"pointer" }}
          >
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Egyptian plate picker */}
        <div style={{ marginBottom:14,padding:"14px 14px 10px",borderRadius:12,border:`1px solid ${T.border}`,background:"rgba(255,255,255,.02)" }}>
          <div className="acc-label" style={{ marginBottom:10 }}>LICENSE PLATE *</div>
          <EgyptianPlatePicker onChange={setPlate} />
        </div>

        {/* EV detection */}
        {make && model && (
          <div style={{
            marginBottom:14,padding:"9px 13px",borderRadius:9,
            background: isEV ? "rgba(245,158,11,.08)" : "rgba(255,255,255,.03)",
            border:`1px solid ${isEV ? "rgba(245,158,11,.3)" : T.border}`,
            display:"flex",alignItems:"center",gap:8,
          }}>
            <span style={{ fontSize:16 }}>{isEV ? "⚡" : "🚗"}</span>
            <div>
              <div style={{ fontSize:12,fontWeight:700,color:isEV ? "#F59E0B" : T.sub }}>
                {isEV ? "Electric Vehicle Detected" : "Combustion Vehicle"}
              </div>
              <div style={{ fontSize:11,color:T.sub }}>
                {isEV ? "Qualifies for EV charging spots." : "Not eligible for EV charging spots."}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginBottom:12,padding:"10px 13px",borderRadius:9,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",color:T.red,fontSize:13 }}>
            {error}
          </div>
        )}

        <div style={{ display:"flex",gap:10,marginTop:4 }}>
          <button onClick={() => { reset(); onClose(); }} style={{
            flex:1,padding:12,borderRadius:11,border:`1px solid ${T.border}`,
            background:"transparent",color:T.sub,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer",
          }}>Cancel</button>
          <div style={{ flex:2 }}>
            <GlowBtn full noArrow onClick={handleAdd} disabled={loading}>
              {loading ? "Adding…" : "Add Vehicle"}
            </GlowBtn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AccountTab({ user, onLogout, vehicles, profile, onProfileUpdate, onAddVehicle, onSaveProfile, onChangePassword }) {
  const { isMobile } = useBreakpoint();

  const [editOpen,      setEditOpen]      = useState(false);
  const [addVehicle,    setAddVehicle]    = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [prefs, setPrefs] = useState({
    notifications: true,
    location:      true,
    emailAlerts:   false,
    darkMode:      true,
  });
  const toggle = k => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const accessibility = profile?.accessibility ?? false;
  const toggleAccessibility = () => onProfileUpdate({ ...profile, accessibility: !accessibility });

  return (
    <div className="acc-wrap acc-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div style={{ maxWidth:1040,margin:"0 auto" }}>
        {/* Profile hero */}
        <div style={{
          borderRadius:18,overflow:"hidden",border:`1px solid ${T.border}`,
          background:`linear-gradient(135deg,#2A0070,${T.purple} 55%,#4A0E9E)`,
        }}>
          <div style={{ padding:isMobile?"28px 18px 24px":"34px 26px 26px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:20 }}>
              <div style={{
                width:72,height:72,borderRadius:36,flexShrink:0,
                background:"rgba(255,255,255,.15)",border:"2px solid rgba(255,255,255,.3)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,
              }}>
                {(user?.name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                  <div style={{ fontSize:isMobile?20:22,fontWeight:800,color:"#fff",marginBottom:2 }}>
                    {user?.name || "User"}
                  </div>
                  {accessibility && (
                    <span style={{ fontSize:11,fontWeight:700,color:"#60A5FA",background:"rgba(96,165,250,.15)",border:"1px solid rgba(96,165,250,.3)",borderRadius:5,padding:"2px 7px" }}>
                      ♿ Accessibility
                    </span>
                  )}
                </div>
                <div style={{ fontSize:13,color:"rgba(255,255,255,.65)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                  {user?.email || "user@email.com"}
                </div>
              </div>
              <button onClick={() => setEditOpen(true)} style={{
                padding:"7px 14px",borderRadius:9,flexShrink:0,
                border:"1px solid rgba(255,255,255,.3)",background:"rgba(255,255,255,.1)",
                color:"#fff",fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",transition:"background .2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.2)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.1)"}
              >Edit</button>
            </div>

            <div style={{ display:"flex",gap:0,paddingTop:18,borderTop:"1px solid rgba(255,255,255,.15)" }}>
              {[
                { val:vehicles.length, label:"Vehicles"  },
              ].map((s, i) => (
                <div key={s.label} style={{ flex:1,textAlign:"center",borderLeft:i>0?"1px solid rgba(255,255,255,.15)":"none",padding:"0 8px" }}>
                  <div style={{ fontSize:isMobile?17:20,fontWeight:800,color:"#fff",marginBottom:2 }}>{s.val}</div>
                  <div style={{ fontSize:10,color:"rgba(255,255,255,.55)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two-column grid on desktop */}
        <div style={{ marginTop:16 }} className={isMobile ? "" : "acc-grid"}>
          <div className="acc-col">
            {/* Vehicles */}
            <div className="acc-section">
              <div style={{ padding:"13px 18px 10px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div style={{ fontSize:13,fontWeight:700,color:T.sub,letterSpacing:.5 }}>MY VEHICLES</div>
                <button onClick={() => setAddVehicle(true)} style={{
                  padding:"5px 12px",borderRadius:8,fontSize:12,fontWeight:600,
                  border:"1px solid rgba(34,197,94,.35)",background:"rgba(34,197,94,.07)",
                  color:T.green,fontFamily:"inherit",cursor:"pointer",transition:"background .2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(34,197,94,.14)"}
                  onMouseLeave={e => e.currentTarget.style.background="rgba(34,197,94,.07)"}
                >+ Add Vehicle</button>
              </div>

              {vehicles.length === 0 ? (
                <div style={{ padding:"20px 18px",color:T.sub,fontSize:13,textAlign:"center" }}>
                  No vehicles registered. Add one to start reserving.
                </div>
              ) : vehicles.map((v, i) => (
                <div key={v.id || v.sub} className="acc-vehicle"
                  style={{ borderBottom:i<vehicles.length-1?"1px solid rgba(125,57,235,.1)":"none" }}>
                  <div className="acc-icon">{v.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <span style={{ fontSize:14,fontWeight:600 }}>{v.label}</span>
                      {v.isEV && (
                        <span style={{ fontSize:10,fontWeight:700,color:"#F59E0B",background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",borderRadius:4,padding:"1px 5px" }}>
                          ⚡ EV
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:12,color:T.sub }}>{v.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Preferences */}
            <div className="acc-section">
              <div style={{ padding:"13px 18px 10px" }}>
                <div style={{ fontSize:13,fontWeight:700,color:T.sub,letterSpacing:.5 }}>PREFERENCES</div>
              </div>

              <div className="acc-row" style={{ cursor:"default" }}>
                <div className="acc-icon">♿</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14,fontWeight:600 }}>Accessibility Need</div>
                  <div style={{ fontSize:12,color:T.sub }}>
                    {accessibility
                      ? "Enabled — you can reserve accessible parking spots"
                      : "Enable if you have a mobility impairment"}
                  </div>
                </div>
                <Toggle on={accessibility} onChange={toggleAccessibility} />
              </div>

              {[
                { key:"notifications", icon:"🔔", label:"Push Notifications", sub:"Session alerts & reminders" },
                { key:"location",      icon:"📍", label:"Location Services",  sub:"GPS for nearby parking"    },
                { key:"emailAlerts",   icon:"📧", label:"Email Alerts",       sub:"Receipts & booking confirmations" },
                { key:"darkMode",      icon:"🌙", label:"Dark Mode",          sub:"Always on for best experience"    },
              ].map(item => (
                <div key={item.key} className="acc-row" style={{ cursor:"default" }}>
                  <div className="acc-icon">{item.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:600 }}>{item.label}</div>
                    <div style={{ fontSize:12,color:T.sub }}>{item.sub}</div>
                  </div>
                  <Toggle on={prefs[item.key]} onChange={() => toggle(item.key)} />
                </div>
              ))}
            </div>
          </div>

          <div className="acc-col">
            <div className="acc-section">
              <div style={{ padding:"13px 18px 10px" }}>
                <div style={{ fontSize:13,fontWeight:700,color:T.sub,letterSpacing:.5 }}>ACCOUNT</div>
              </div>
              {[
                { icon:"👤", label:"Edit Profile",    sub:"Name, email & phone",     action:() => setEditOpen(true)       },
                { icon:"🔒", label:"Security",        sub:"Password & PIN settings", action:() => setChangePassOpen(true) },
                { icon:"💳", label:"Payment Methods", sub:"Cards & saved payments",  action:() => {}               },
                { icon:"🛡", label:"Privacy",         sub:"Data & permissions",      action:() => {}               },
              ].map(item => (
                <div key={item.label} className="acc-row" onClick={item.action}>
                  <div className="acc-icon">{item.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:600 }}>{item.label}</div>
                    <div style={{ fontSize:12,color:T.sub }}>{item.sub}</div>
                  </div>
                  <span style={{ color:T.sub,fontSize:16 }}>›</span>
                </div>
              ))}
            </div>

            <div className="acc-section">
              <div style={{ padding:"13px 18px 10px" }}>
                <div style={{ fontSize:13,fontWeight:700,color:T.sub,letterSpacing:.5 }}>SUPPORT</div>
              </div>
              {[
                { icon:"❓", label:"Help Center", sub:"FAQs & guides",         action:() => {} },
                { icon:"💬", label:"Contact Us",  sub:"Chat or email support", action:() => {} },
                { icon:"⭐", label:"Rate the App",sub:"Share your feedback",   action:() => {} },
              ].map(item => (
                <div key={item.label} className="acc-row" onClick={item.action}>
                  <div className="acc-icon">{item.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,fontWeight:600 }}>{item.label}</div>
                    <div style={{ fontSize:12,color:T.sub }}>{item.sub}</div>
                  </div>
                  <span style={{ color:T.sub,fontSize:16 }}>›</span>
                </div>
              ))}
            </div>

            <div style={{ textAlign:"center",fontSize:11,color:"rgba(125,57,235,.4)",marginBottom:6 }}>
              ezrakna v1.0.0 · Cairo Parking Platform
            </div>

            <button onClick={onLogout} style={{
              padding:14,borderRadius:14,width:"100%",
              background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.2)",
              color:T.red,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer",transition:"background .2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,.13)"}
              onMouseLeave={e => e.currentTarget.style.background="rgba(239,68,68,.07)"}
            >Sign Out</button>
          </div>
        </div>

        <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} profile={profile} onSave={onSaveProfile} />
        <ChangePasswordModal open={changePassOpen} onClose={() => setChangePassOpen(false)} onSave={onChangePassword} />
        <AddVehicleModal
          open={addVehicle}
          onClose={() => setAddVehicle(false)}
          onAdd={onAddVehicle}
        />
      </div>
    </div>
  );
}
