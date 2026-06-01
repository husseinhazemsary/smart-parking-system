import React from "react";
import { T } from "../../constants/theme";

const CSS = `
  @keyframes pm-in { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
  @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

export default function PaymentModal({
  reservation,        // { amount, durationMins, lotName }
  cards,
  activeCardId,
  onCardChange,
  processing,
  success,
  onConfirm,
  onCancel,
}) {
  if (!reservation) return null;

  const { amount, durationMins, lotName } = reservation;
  const hrs          = Math.floor(durationMins / 60);
  const mins         = durationMins % 60;
  const durationLabel = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  const isFree       = amount === 0;
  const activeCard   = cards.find(c => c.id === activeCardId);
  const canPay       = isFree || cards.length > 0;

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:500,
      background:"rgba(7,0,26,.88)",backdropFilter:"blur(12px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20,
    }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }}/>
      <div style={{
        background:"#110030",border:"1px solid rgba(125,57,235,.3)",
        borderRadius:24,width:"100%",maxWidth:420,
        padding:"28px 26px",
        boxShadow:"0 32px 96px rgba(0,0,0,.7)",
        animation:"pm-in .25s cubic-bezier(.22,1,.36,1)",
      }}>

        {/* ── SUCCESS ─────────────────────────────────────────────── */}
        {success ? (
          <div style={{ textAlign:"center", padding:"16px 0 8px" }}>
            <div style={{ fontSize:60, marginBottom:14 }}>✅</div>
            <div style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Payment Successful!</div>
            <div style={{ fontSize:14, color:T.sub, lineHeight:1.6 }}>
              {isFree
                ? "No charge — free parking."
                : `EGP ${amount.toFixed(2)} charged to card ending ···· ${activeCard?.last4}`
              }
            </div>
          </div>

        /* ── PAYMENT FORM ─────────────────────────────────────────── */
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>Confirm Payment</div>
              <div style={{ fontSize:13, color:T.sub }}>Review your session charges before paying.</div>
            </div>

            {/* Cost summary */}
            <div style={{
              borderRadius:14, padding:"16px 18px", marginBottom:20,
              background: isFree ? "rgba(34,197,94,.05)" : "rgba(125,57,235,.07)",
              border:`1px solid ${isFree ? "rgba(34,197,94,.2)" : "rgba(125,57,235,.2)"}`,
            }}>
              {[["Location", lotName], ["Duration", durationLabel]].map(([label, val]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={{ fontSize:13, color:T.sub }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>{val}</span>
                </div>
              ))}
              <div style={{
                borderTop:`1px solid ${T.border}`, paddingTop:12,
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <span style={{ fontSize:15, fontWeight:700 }}>Total</span>
                <span style={{ fontSize:22, fontWeight:800, color: isFree ? T.green : T.purple }}>
                  {isFree ? "Free" : `EGP ${amount.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Card picker */}
            {!isFree && cards.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, color:T.sub, letterSpacing:.6, marginBottom:10 }}>CHARGE TO</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {cards.map(c => {
                    const sel = c.id === activeCardId;
                    return (
                      <div key={c.id} onClick={() => onCardChange(c.id)} style={{
                        display:"flex", alignItems:"center", gap:12,
                        padding:"12px 14px", borderRadius:12, cursor:"pointer",
                        transition:"all .15s",
                        border:`1.5px solid ${sel ? "rgba(125,57,235,.6)" : T.border}`,
                        background: sel ? "rgba(125,57,235,.1)" : "rgba(255,255,255,.02)",
                      }}>
                        <div style={{
                          width:42, height:28, borderRadius:7, flexShrink:0,
                          background:`linear-gradient(135deg,${c.gradient[0]},${c.gradient[1]})`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:9, fontWeight:900, letterSpacing:.5,
                          color:"rgba(255,255,255,.9)",
                          fontFamily: c.type === "visa" ? "serif" : "sans-serif",
                          fontStyle:  c.type === "visa" ? "italic" : "normal",
                        }}>
                          {c.type === "visa" ? "VISA" : "MC"}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>•••• •••• •••• {c.last4}</div>
                          <div style={{ fontSize:11, color:T.sub }}>{c.holder} · Expires {c.expiry}</div>
                        </div>
                        {sel && (
                          <div style={{
                            width:20, height:20, borderRadius:"50%", flexShrink:0,
                            background:T.purple, display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:10, fontWeight:900, color:"#fff",
                          }}>✓</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No card warning */}
            {!isFree && cards.length === 0 && (
              <div style={{
                marginBottom:20, padding:"12px 14px", borderRadius:12,
                background:"rgba(239,68,68,.07)", border:"1px solid rgba(239,68,68,.2)",
                color:T.red, fontSize:13,
              }}>
                No payment card on file. Please add a card in the Wallet tab.
              </div>
            )}

            {/* Buttons */}
            <div style={{ display:"flex", gap:10 }}>
              {!processing && (
                <button onClick={onCancel} style={{
                  flex:1, padding:"12px", borderRadius:13,
                  border:`1px solid ${T.border}`, background:"transparent",
                  color:T.sub, fontFamily:"inherit", fontSize:14, fontWeight:600, cursor:"pointer",
                }}>Cancel</button>
              )}
              <button
                onClick={onConfirm}
                disabled={processing || !canPay}
                style={{
                  flex:2, padding:"12px", borderRadius:13, border:"none",
                  background: processing ? "rgba(125,57,235,.4)" : T.purple,
                  color:"#fff", fontFamily:"inherit", fontSize:14, fontWeight:700,
                  cursor: processing ? "not-allowed" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  transition:"background .2s", opacity: !canPay ? 0.5 : 1,
                }}>
                {processing
                  ? <>
                      <span style={{
                        width:16, height:16,
                        border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff",
                        borderRadius:"50%", display:"inline-block",
                        animation:"spin .7s linear infinite",
                      }}/>
                      Processing…
                    </>
                  : isFree
                    ? "Confirm Exit"
                    : `Pay EGP ${amount.toFixed(2)}`
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
