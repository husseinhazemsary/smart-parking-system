import React from "react";
import { T } from "../constants/theme";
import useTimer from "../hooks/useTimer";
import useBreakpoint from "../hooks/useBreakpoint";
import Card from "../components/ui/Card";
import Divider from "../components/ui/Divider";
import SectionLabel from "../components/ui/SectionLabel";
import GlowBtn from "../components/ui/GlowBtn";

const CSS = `@keyframes pls { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(2.4);opacity:0} }`;

export default function SessionTab({ activeReservation, vehicles, onActivate, onCancel, onComplete }) {
  const { isMobile } = useBreakpoint();

  // Timer only ticks when ACTIVE — pass enteredAt as the start reference
  const elapsed = useTimer(
    activeReservation?.status === "ACTIVE" ? activeReservation.enteredAt : null
  );

  if (!activeReservation) {
    return (
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16 }}>
        <div style={{ fontSize:64 }}>🅿️</div>
        <div style={{ fontSize:22,fontWeight:700 }}>No active session</div>
        <div style={{ fontSize:14,color:T.sub,textAlign:"center",padding:"0 20px" }}>
          Reserve a spot from the Find Parking tab to get started.
        </div>
      </div>
    );
  }

  const {
    id, vehicleId, plateNumber, gateName, spotCode,
    parkingLotName, hourlyRate, status, enteredAt, startTime, endTime,
  } = activeReservation;

  const isPending = status === "PENDING";
  const isActive  = status === "ACTIVE";

  const vehicle = vehicles?.find(v => v.id === vehicleId);
  const vehicleLabel = vehicle
    ? `${vehicle.label}  ·  ${vehicle.sub}`
    : plateNumber || "–";

  const rate = hourlyRate ? Number(hourlyRate) : 0;
  const parts = elapsed.split(":").map(Number);
  const elapsedSecs = parts[0] * 3600 + parts[1] * 60 + parts[2];
  const cost = ((elapsedSecs / 3600) * rate).toFixed(2);

  const fmt = iso => new Date(iso).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });

  return (
    <div style={{ maxWidth:780,margin:"0 auto",padding:isMobile?"20px 16px":"40px 28px" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Status banner */}
      {isPending && (
        <div style={{
          display:"flex",alignItems:"flex-start",gap:10,marginBottom:28,
          padding:"14px 18px",borderRadius:14,
          background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.2)",
        }}>
          <div style={{ width:10,height:10,borderRadius:5,background:"#F59E0B",animation:"pls 1.5s infinite",flexShrink:0,marginTop:3 }} />
          <div>
            <div style={{ fontWeight:700,color:"#F59E0B",fontSize:14,marginBottom:2 }}>Reservation Pending</div>
            <div style={{ color:T.sub,fontSize:13 }}>
              Your spot is reserved — billing only starts when you enter the gate.
            </div>
          </div>
        </div>
      )}

      {isActive && (
        <div style={{
          display:"flex",alignItems:"center",gap:10,marginBottom:28,
          padding:"12px 18px",borderRadius:14,
          background:"rgba(34,197,94,.07)",border:"1px solid rgba(34,197,94,.18)",
        }}>
          <div style={{ width:10,height:10,borderRadius:5,background:T.green,animation:"pls 1.5s infinite",flexShrink:0 }} />
          <div>
            <span style={{ fontWeight:700,color:T.green,fontSize:14 }}>Session Active</span>
            <span style={{ color:T.sub,fontSize:13,marginLeft:8 }}>• Entered at {fmt(enteredAt)}</span>
          </div>
        </div>
      )}

      {/* Location header */}
      <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:28 }}>
        <div style={{
          width:60,height:60,borderRadius:18,flexShrink:0,
          background:"rgba(125,57,235,.15)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,
        }}>🅿️</div>
        <div>
          <div style={{ fontSize:isMobile?20:24,fontWeight:800,letterSpacing:-0.5 }}>
            {parkingLotName || "Parking Lot"}
          </div>
          <div style={{ fontSize:14,color:T.sub }}>{gateName || "–"}</div>
        </div>
      </div>

      {/* PENDING: reservation window info */}
      {isPending && (
        <Card style={{ padding:20,marginBottom:20 }}>
          <div style={{ fontSize:12,color:T.sub,marginBottom:6,letterSpacing:.5 }}>RESERVATION WINDOW</div>
          <div style={{ fontSize:16,fontWeight:700,marginBottom:6 }}>
            {fmt(startTime)} – {fmt(endTime)}
          </div>
          <div style={{ fontSize:13,color:T.sub,lineHeight:1.6 }}>
            Your parking spot ({spotCode || "–"}) is locked for you. Drive to the gate within this window — the clock and charges begin the moment you enter.
          </div>
        </Card>
      )}

      {/* ACTIVE: live elapsed + running cost */}
      {isActive && (
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20 }}>
          <Card style={{ padding:isMobile?18:24,textAlign:"center" }} glow>
            <div style={{ fontSize:11,color:T.sub,letterSpacing:1,marginBottom:8 }}>ELAPSED TIME</div>
            <div style={{
              fontSize:isMobile?36:48,fontWeight:800,color:T.purple,
              fontVariantNumeric:"tabular-nums",letterSpacing:-2,lineHeight:1,
            }}>{elapsed}</div>
          </Card>
          <Card style={{ padding:isMobile?18:24,textAlign:"center" }} glow>
            <div style={{ fontSize:11,color:T.sub,letterSpacing:1,marginBottom:8 }}>RUNNING COST</div>
            <div style={{
              fontSize:isMobile?36:48,fontWeight:800,color:T.green,letterSpacing:-2,lineHeight:1,
            }}>
              {rate === 0 ? "Free" : `EGP ${cost}`}
            </div>
          </Card>
        </div>
      )}

      {/* Session details */}
      <Card style={{ padding:22,marginBottom:20 }}>
        <SectionLabel>Session Details</SectionLabel>
        {[
          ["Vehicle",  vehicleLabel],
          ["Slot",     spotCode || "–"],
          ["Rate",     rate > 0 ? `EGP ${rate}/hr` : "Free"],
          ["Status",   isPending ? "Pending — not yet billed" : "Active — billing in progress"],
        ].map(([l, v], i, arr) => (
          <div key={l}>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 0" }}>
              <span style={{ color:T.sub,fontSize:14 }}>{l}</span>
              <span style={{ color:T.text,fontSize:14,fontWeight:600 }}>{v}</span>
            </div>
            {i < arr.length - 1 && <Divider />}
          </div>
        ))}
      </Card>

      {/* Action buttons */}
      <div style={{ display:"flex",gap:12,flexDirection:isMobile?"column":"row" }}>
        {isPending && (
          <>
            <div style={{ flex:2 }}>
              <GlowBtn full noArrow onClick={() => onActivate(id)}>
                🚗 Enter Gate (Simulate Access)
              </GlowBtn>
            </div>
            <button
              onClick={() => onCancel(id)}
              style={{
                flex:1,padding:"12px 18px",borderRadius:13,
                border:"1px solid rgba(239,68,68,.3)",background:"rgba(239,68,68,.07)",
                color:T.red,fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer",
                transition:"background .2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,.14)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,.07)"}
            >
              Cancel Reservation
            </button>
          </>
        )}
        {isActive && (
          <div style={{ flex:1 }}>
            <GlowBtn full noArrow onClick={() => onComplete(id)}>
              🚪 Exit Parking
            </GlowBtn>
          </div>
        )}
      </div>
    </div>
  );
}
