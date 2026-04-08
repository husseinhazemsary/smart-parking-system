import React, { useState } from "react";
import { T } from "../constants/theme";
import useBreakpoint from "../hooks/useBreakpoint";
import { HISTORY_DATA } from "../data/history";
import Modal from "../components/ui/Modal";
import GlowBtn from "../components/ui/GlowBtn";

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

// Known pure-EV brands — any model from these is always electric
const EV_MAKES = new Set([
  "tesla","rivian","lucid","polestar","byd","nio","xpeng","zeekr","fisker","canoo",
]);

// Keywords that identify EV models regardless of make
const EV_MODEL_KEYWORDS = [
  "electric","ioniq","leaf","bolt ev","id.4","id.3","id.","e-tron","taycan","zoe",
  "kona ev","niro ev","ev6","ev9","i3","i4","ix3","ix5","ix ","eqc","eqs","eqa","eqb",
  "model s","model 3","model x","model y","cybertruck","r1t","r1s","air ","ocean ",
  " ev"," bev",
];

export function detectEV(make, model) {
  const m  = make.trim().toLowerCase();
  const mo = model.trim().toLowerCase();
  if (EV_MAKES.has(m)) return true;
  return EV_MODEL_KEYWORDS.some(k => mo.includes(k));
}

function Toggle({ on, onChange }) {
  return (
    <button
      className="tog-track"
      onClick={onChange}
      style={{ background: on ? T.purple : "rgba(125,57,235,.2)" }}
    >
      <div className="tog-thumb" style={{ left: on ? 23 : 3 }} />
    </button>
  );
}

function EditProfileModal({ open, onClose, user }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("+20 100 000 0000");

  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <div style={{ padding: "26px 22px" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Edit Profile</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div className="acc-label">FULL NAME</div>
            <input className="acc-field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <div className="acc-label">EMAIL</div>
            <input className="acc-field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <div className="acc-label">PHONE NUMBER</div>
            <input className="acc-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 12, borderRadius: 11,
            border: `1px solid ${T.border}`, background: "transparent",
            color: T.sub, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Cancel</button>
          <div style={{ flex: 2 }}>
            <GlowBtn full noArrow onClick={onClose}>Save Changes</GlowBtn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Add vehicle modal — auto-detects EV from make & model as user types.
function AddVehicleModal({ open, onClose, onAdd }) {
  const [make,  setMake]  = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const icons = ["🚗", "🚙", "🛻", "🏎", "🚕"];
  const [icon, setIcon] = useState("🚗");

  const isEV = detectEV(make, model);

  const handleAdd = () => {
    if (!make || !model || !plate) return;
    onAdd({ icon, label: `${make} ${model}`, sub: plate.toUpperCase(), isEV });
    setMake(""); setModel(""); setPlate(""); setIcon("🚗");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <div style={{ padding: "26px 22px" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Add Vehicle</div>

        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {icons.map((i) => (
            <button key={i} onClick={() => setIcon(i)} style={{
              width: 44, height: 44, borderRadius: 11, fontSize: 20,
              border: `1.5px solid ${icon === i ? T.purple : T.border}`,
              background: icon === i ? "rgba(125,57,235,.12)" : "transparent",
              cursor: "pointer", transition: "all .15s",
            }}>{i}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="acc-label">MAKE</div>
              <input className="acc-field" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" />
            </div>
            <div>
              <div className="acc-label">MODEL</div>
              <input className="acc-field" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Corolla" />
            </div>
          </div>
          <div>
            <div className="acc-label">PLATE NUMBER</div>
            <input className="acc-field" value={plate} onChange={(e) => setPlate(e.target.value)}
              placeholder="BG 4567" style={{ textTransform: "uppercase" }} />
          </div>
        </div>

        {/* EV detection badge — appears as user types make/model */}
        {make && model && (
          <div style={{
            marginTop: 12, padding: "9px 13px", borderRadius: 9,
            background: isEV ? "rgba(245,158,11,.08)" : "rgba(255,255,255,.03)",
            border: `1px solid ${isEV ? "rgba(245,158,11,.3)" : T.border}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>{isEV ? "⚡" : "🚗"}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: isEV ? "#F59E0B" : T.sub }}>
                {isEV ? "Electric Vehicle Detected" : "Combustion Vehicle"}
              </div>
              <div style={{ fontSize: 11, color: T.sub }}>
                {isEV
                  ? "This vehicle qualifies for EV charging spots."
                  : "Not eligible for EV charging spots."}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 12, borderRadius: 11,
            border: `1px solid ${T.border}`, background: "transparent",
            color: T.sub, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Cancel</button>
          <div style={{ flex: 2 }}>
            <GlowBtn full noArrow onClick={handleAdd}>Add Vehicle</GlowBtn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Account tab — user profile hero, vehicle list, preferences toggles, settings, and sign out.
export default function AccountTab({ user, onLogout, profile, onProfileUpdate }) {
  const { isMobile } = useBreakpoint();

  const [editOpen, setEditOpen] = useState(false);
  const [addVehicle, setAddVehicle] = useState(false);
  const [prefs, setPrefs] = useState({
    notifications: true,
    location: true,
    emailAlerts: false,
    darkMode: true,
  });
  const toggle = (k) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const vehicles     = profile.vehicles;
  const accessibility = profile.accessibility;

  const addVehicleToProfile = (v) =>
    onProfileUpdate({ ...profile, vehicles: [...profile.vehicles, v] });

  const toggleAccessibility = () =>
    onProfileUpdate({ ...profile, accessibility: !profile.accessibility });

  // Derived from history data for the profile stats strip
  const completed = HISTORY_DATA.filter((h) => h.status === "completed");
  const totalMins = HISTORY_DATA.reduce((a, h) => {
    const m = h.duration.match(/(\d+)h\s*(\d+)?m?/);
    return a + (m ? +m[1] * 60 + (+m[2] || 0) : 0);
  }, 0);

  return (
    <div className="acc-wrap acc-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Profile hero card */}
        <div style={{
          borderRadius: 18, overflow: "hidden",
          border: `1px solid ${T.border}`,
          background: `linear-gradient(135deg,#2A0070,${T.purple} 55%,#4A0E9E)`,
        }}>
          <div style={{ padding: isMobile ? "28px 18px 24px" : "34px 26px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 36, flexShrink: 0,
                background: "rgba(255,255,255,.15)", border: "2px solid rgba(255,255,255,.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
              }}>
                {(user?.name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
                    {user?.name || "User"}
                  </div>
                  {accessibility && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#60A5FA",
                      background: "rgba(96,165,250,.15)", border: "1px solid rgba(96,165,250,.3)",
                      borderRadius: 5, padding: "2px 7px",
                    }}>♿ Accessibility</span>
                  )}
                </div>
                <div style={{
                  fontSize: 13, color: "rgba(255,255,255,.65)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {user?.email || "user@email.com"}
                </div>
              </div>
              <button onClick={() => setEditOpen(true)} style={{
                padding: "7px 14px", borderRadius: 9, flexShrink: 0,
                border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.1)",
                color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "background .2s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.1)")}
              >Edit</button>
            </div>

            <div style={{ display: "flex", gap: 0, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.15)" }}>
              {[
                { val: HISTORY_DATA.length, label: "Sessions" },
                { val: `${Math.floor(totalMins / 60)}h`, label: "Parked" },
                { val: vehicles.length, label: "Vehicles" },
                { val: completed.length, label: "Completed" },
              ].map((s, i) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: "center",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,.15)" : "none",
                  padding: "0 8px",
                }}>
                  <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two-column grid on desktop, stacked on mobile */}
        <div style={{ marginTop: 16 }} className={isMobile ? "" : "acc-grid"}>
          <div className="acc-col">
            {/* Vehicles */}
            <div className="acc-section">
              <div style={{ padding: "13px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, letterSpacing: 0.5 }}>MY VEHICLES</div>
                <button onClick={() => setAddVehicle(true)} style={{
                  padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1px solid rgba(34,197,94,.35)`, background: "rgba(34,197,94,.07)",
                  color: T.green, fontFamily: "inherit", cursor: "pointer", transition: "background .2s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,197,94,.14)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(34,197,94,.07)")}
                >+ Add Vehicle</button>
              </div>
              {vehicles.map((v, i) => (
                <div key={v.sub} className="acc-vehicle"
                  style={{ borderBottom: i < vehicles.length - 1 ? "1px solid rgba(125,57,235,.1)" : "none" }}>
                  <div className="acc-icon">{v.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{v.label}</span>
                      {v.isEV && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: "#F59E0B",
                          background: "rgba(245,158,11,.12)", border: "1px solid rgba(245,158,11,.3)",
                          borderRadius: 4, padding: "1px 5px",
                        }}>⚡ EV</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: T.sub }}>{v.sub}</div>
                  </div>
                  <button style={{
                    padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                    border: `1px solid ${T.border}`, background: "transparent",
                    color: T.sub, fontFamily: "inherit", cursor: "pointer",
                  }}>Edit</button>
                </div>
              ))}
            </div>

            {/* Preferences */}
            <div className="acc-section">
              <div style={{ padding: "13px 18px 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, letterSpacing: 0.5 }}>PREFERENCES</div>
              </div>

              {/* Accessibility Need — lifted to shared profile state */}
              <div className="acc-row" style={{ cursor: "default" }}>
                <div className="acc-icon">♿</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Accessibility Need</div>
                  <div style={{ fontSize: 12, color: T.sub }}>
                    {accessibility
                      ? "Enabled — you can reserve accessible parking spots"
                      : "Enable if you have a mobility impairment"}
                  </div>
                </div>
                <Toggle on={accessibility} onChange={toggleAccessibility} />
              </div>

              {[
                { key: "notifications", icon: "🔔", label: "Push Notifications", sub: "Session alerts & reminders" },
                { key: "location",      icon: "📍", label: "Location Services",  sub: "GPS for nearby parking" },
                { key: "emailAlerts",   icon: "📧", label: "Email Alerts",       sub: "Receipts & booking confirmations" },
                { key: "darkMode",      icon: "🌙", label: "Dark Mode",          sub: "Always on for best experience" },
              ].map((item) => (
                <div key={item.key} className="acc-row" style={{ cursor: "default" }}>
                  <div className="acc-icon">{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: T.sub }}>{item.sub}</div>
                  </div>
                  <Toggle on={prefs[item.key]} onChange={() => toggle(item.key)} />
                </div>
              ))}
            </div>
          </div>

          <div className="acc-col">
            <div className="acc-section">
              <div style={{ padding: "13px 18px 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, letterSpacing: 0.5 }}>ACCOUNT</div>
              </div>
              {[
                { icon: "👤", label: "Edit Profile",     sub: "Name, email & phone",    action: () => setEditOpen(true) },
                { icon: "🔒", label: "Security",         sub: "Password & PIN settings", action: () => {} },
                { icon: "💳", label: "Payment Methods",  sub: "Cards & saved payments",  action: () => {} },
                { icon: "🛡", label: "Privacy",          sub: "Data & permissions",      action: () => {} },
              ].map((item) => (
                <div key={item.label} className="acc-row" onClick={item.action}>
                  <div className="acc-icon">{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: T.sub }}>{item.sub}</div>
                  </div>
                  <span style={{ color: T.sub, fontSize: 16 }}>›</span>
                </div>
              ))}
            </div>

            <div className="acc-section">
              <div style={{ padding: "13px 18px 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, letterSpacing: 0.5 }}>SUPPORT</div>
              </div>
              {[
                { icon: "❓", label: "Help Center", sub: "FAQs & guides",          action: () => {} },
                { icon: "💬", label: "Contact Us",  sub: "Chat or email support",  action: () => {} },
                { icon: "⭐", label: "Rate the App",sub: "Share your feedback",    action: () => {} },
              ].map((item) => (
                <div key={item.label} className="acc-row" onClick={item.action}>
                  <div className="acc-icon">{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: T.sub }}>{item.sub}</div>
                  </div>
                  <span style={{ color: T.sub, fontSize: 16 }}>›</span>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(125,57,235,.4)", marginBottom: 6 }}>
              ezrakna v1.0.0 · Cairo Parking Platform
            </div>

            <button onClick={onLogout} style={{
              padding: 14, borderRadius: 14, width: "100%",
              background: "rgba(239,68,68,.07)", border: `1px solid rgba(239,68,68,.2)`,
              color: T.red, fontFamily: "inherit", fontSize: 15, fontWeight: 700,
              cursor: "pointer", transition: "background .2s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,.13)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,.07)")}
            >Sign Out</button>
          </div>
        </div>

        <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} />
        <AddVehicleModal
          open={addVehicle}
          onClose={() => setAddVehicle(false)}
          onAdd={addVehicleToProfile}
        />
      </div>
    </div>
  );
}
