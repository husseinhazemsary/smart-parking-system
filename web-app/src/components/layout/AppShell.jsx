import React, { useEffect, useState } from "react";
import { T } from "../../constants/theme";
import useBreakpoint from "../../hooks/useBreakpoint";
import apiFetch from "../../api/client";
import { detectEV } from "../../utils/evDetection";
import GlowBtn from "../ui/GlowBtn";
import Card from "../ui/Card";
import BottomNav from "./BottomNav";

import FindTab from "../../pages/FindTab";
import SessionTab from "../../pages/SessionTab";
import WalletTab from "../../pages/WalletTab";
import HistoryTab from "../../pages/HistoryTab";
import AccountTab from "../../pages/AccountTab";

export default function AppShell({ user, onLogout, onUserUpdate, onBack, onAuthOpen, initialSpotId, onSpotDetailOpened }) {
  const [tab, setTab] = useState("find");
  const { isMobile, isTablet } = useBreakpoint();
  const [profile, setProfile] = useState({ accessibility: false });
  const [vehicles, setVehicles] = useState([]);
  const [activeReservation, setActiveReservation] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveError, setReserveError] = useState("");

  const mapVehicle = v => {
    const label = v.nickname || v.makeAndModel || v.plateNumber || "My Vehicle";
    const subParts = [
      v.makeAndModel && v.makeAndModel !== label ? v.makeAndModel : null,
      v.plateNumber || null,
    ].filter(Boolean);
    const [make = "", model = ""] = (v.makeAndModel || "").split(" ");
    return {
      id: v.id,
      icon: "🚗",
      label,
      sub: subParts.join(" · "),
      isEV: detectEV(make, model),
      vehicleType: v.vehicleType,
      plateNumber: v.plateNumber,
      makeAndModel: v.makeAndModel,
      nickname: v.nickname,
    };
  };

  const tabs = [
    { id:"find",    label:"Find Parking", icon:"🔍" },
    { id:"session", label:"My Session",   icon:"⏱",  dot: !!activeReservation },
    { id:"wallet",  label:"Wallet",       icon:"💳" },
    { id:"history", label:"History",      icon:"🕐" },
    { id:"account", label:"Account",      icon:"👤" },
  ];

  const setTabSafe = id => {
    if (!user && id !== "find") { onAuthOpen?.(); return; }
    setTab(id);
  };

  // ── Auto-logout on JWT expiry ──────────────────────────────────────────────

  useEffect(() => {
    const handler = () => {
      onLogout();
      onAuthOpen?.();
      setReserveError("Your session expired. Please sign in again.");
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [onLogout, onAuthOpen]);

  // ── Load vehicles + current session when user logs in ──────────────────────

  useEffect(() => {
    if (!user) {
      setVehicles([]);
      setActiveReservation(null);
      setProfile({ accessibility: false });
      return;
    }
    loadVehicles();
    loadCurrentSession();
    loadProfile();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    try {
      const data = await apiFetch("/api/users/me");
      setProfile(prev => ({ ...prev, phoneNumber: data.phoneNumber, dateOfBirth: data.dateOfBirth }));
    } catch (e) {
      console.error("Failed to load profile", e);
    }
  };

  const handleSaveProfile = async ({ fullName, phoneNumber, dateOfBirth }) => {
    const data = await apiFetch("/api/users/me", {
      method: "PUT",
      body: JSON.stringify({ fullName, phoneNumber, dateOfBirth }),
    });
    setProfile(prev => ({ ...prev, phoneNumber: data.phoneNumber, dateOfBirth: data.dateOfBirth }));
    if (data.fullName) onUserUpdate?.({ name: data.fullName });
  };

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    await apiFetch("/api/users/me/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  };

  const loadVehicles = async () => {
    try {
      const data = await apiFetch("/api/users/me/vehicles");
      const mapped = (data || []).map(mapVehicle);
      setVehicles(mapped);
      setProfile(prev => ({ ...prev, vehicles: mapped }));
    } catch (e) {
      console.error("Failed to load vehicles", e);
    }
  };

  const loadCurrentSession = async () => {
    try {
      const res = await apiFetch("/api/reservations/current");
      setActiveReservation(res); // null on 204
    } catch (e) {
      console.warn("No current session", e);
      setActiveReservation(null);
    }
  };

  // ── Reservation lifecycle handlers ─────────────────────────────────────────

  const handleActivate = async reservationId => {
    setReserveError("");
    try {
      const updated = await apiFetch(`/api/reservations/${reservationId}/activate`, { method: "POST" });
      setActiveReservation(updated);
    } catch (e) {
      setReserveError(e?.message || "Failed to activate reservation");
    }
  };

  const handleCancelReservation = async reservationId => {
    setReserveError("");
    try {
      await apiFetch(`/api/reservations/${reservationId}`, { method: "DELETE" });
      setActiveReservation(null);
      setTab("find");
    } catch (e) {
      setReserveError(e?.message || "Failed to cancel reservation");
    }
  };

  const handleCompleteReservation = async reservationId => {
    setReserveError("");
    try {
      await apiFetch(`/api/reservations/${reservationId}/complete`, { method: "POST" });
      setActiveReservation(null);
      setTab("history");
    } catch (e) {
      setReserveError(e?.message || "Failed to complete session");
    }
  };

  // ── Reserve a spot ─────────────────────────────────────────────────────────

  const findBackendLot = async spot => {
    let lots = parkingLots;
    if (!lots.length) {
      lots = await apiFetch("/api/parking-lots");
      setParkingLots(lots || []);
    }
    if (!lots?.length) return null;

    const lc = s => (s || "").toLowerCase();
    const spotName = lc(spot.name);

    // 1. Exact name match (case-insensitive)
    const exact = lots.find(l => lc(l.name) === spotName);
    if (exact) return exact;

    // 2. Partial name overlap
    const partial = lots.find(l =>
      lc(l.name).includes(spotName) || spotName.includes(lc(l.name))
    );
    if (partial) return partial;

    // 3. Address match
    const byAddr = lots.find(l => lc(l.address) === lc(spot.address));
    if (byAddr) return byAddr;

    // 4. Fallback: first lot in the list (DB has at least one seeded lot)
    return lots[0];
  };

  const handleReserve = async spot => {
    setReserveError("");
    if (!user) { onAuthOpen?.(); return; }

    if (!vehicles.length) {
      setReserveError("Please add a vehicle with a license plate in Account before reserving.");
      return;
    }

    const primaryVehicle = vehicles[0];
    if (!primaryVehicle.sub) {
      setReserveError("Your vehicle has no license plate registered. Please update it in Account.");
      return;
    }

    if (activeReservation) {
      setReserveError("You already have an active reservation. Go to My Session to manage it.");
      setTab("session");
      return;
    }

    setReserveLoading(true);
    try {
      const lot = await findBackendLot(spot);
      if (!lot) throw new Error("No parking lots are available in the system. Please contact an administrator.");

      const startTime = new Date(Date.now() + 5 * 60_000).toISOString();
      const endTime   = new Date(Date.now() + 65 * 60_000).toISOString();

      const reservation = await apiFetch("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          vehicleId:    primaryVehicle.id,
          parkingLotId: lot.id,
          startTime,
          endTime,
        }),
      });

      setActiveReservation(reservation);
      setTab("session");
    } catch (e) {
      const msg = e?.message || "Reservation failed";
      if (msg.includes("pending or active")) {
        setReserveError("You already have an active reservation. Go to My Session to manage it.");
        setTab("session");
        await loadCurrentSession();
      } else {
        setReserveError(msg);
      }
    } finally {
      setReserveLoading(false);
    }
  };

  // ── Vehicle CRUD from Account tab ──────────────────────────────────────────

  const handleAddVehicle = async vehicleData => {
    const res = await apiFetch("/api/users/me/vehicles", {
      method: "POST",
      body: JSON.stringify({
        plateNumber: vehicleData.plateNumber,
        vehicleType: vehicleData.vehicleType || "SEDAN",
        makeAndModel: vehicleData.makeAndModel || vehicleData.label,
        nickname: vehicleData.nickname || null,
        isDefault: false,
        autoPay: false,
      }),
    });
    await loadVehicles();
    return res;
  };

  const handleUpdateVehicle = async (id, vehicleData) => {
    const res = await apiFetch(`/api/users/me/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        plateNumber: vehicleData.plateNumber,
        vehicleType: vehicleData.vehicleType || "SEDAN",
        makeAndModel: vehicleData.makeAndModel || null,
        nickname: vehicleData.nickname || null,
        isDefault: vehicleData.isDefault ?? false,
        autoPay: vehicleData.autoPay ?? false,
      }),
    });
    await loadVehicles();
    return res;
  };

  const handleDeleteVehicle = async id => {
    await apiFetch(`/api/users/me/vehicles/${id}`, { method: "DELETE" });
    await loadVehicles();
  };

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight:"100vh",background:T.dark,color:T.text,display:"flex",flexDirection:"column" }}>
      {/* Top bar */}
      <header style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,flexShrink:0,
        background:"rgba(7,0,26,0.65)",backdropFilter:"blur(18px)",
        borderBottom:`1px solid ${T.border}`,
        padding: isMobile ? "18px 20px" : "18px 52px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
      }}>
        {/* Left: Logo */}
        <div
          onClick={onBack}
          style={{ fontWeight:800,fontSize:22,letterSpacing:-0.5,cursor:"pointer",flexShrink:0 }}
        >
          <span style={{ color:T.purple }}>ez</span>rakna
        </div>

        {/* Center: Nav links */}
        {!isMobile && (
          <nav style={{ display:"flex",gap:36,fontSize:14,color:T.sub }}>
            {tabs.map(t => (
              <button key={t.id}
                onClick={() => setTabSafe(t.id)}
                className={"nav-link-ul" + (tab===t.id ? " nav-active" : "")}
                style={{
                  background:"none",border:"none",cursor:"pointer",
                  color: tab===t.id ? "#C6FF33" : T.sub,
                  fontWeight: tab===t.id ? 600 : 400,
                  fontSize:14,fontFamily:"inherit",
                  padding:"4px 0",transition:"color .2s",
                  position:"relative",whiteSpace:"nowrap",
                }}
                onMouseEnter={e=>{ if(tab!==t.id) e.currentTarget.style.color=T.text; }}
                onMouseLeave={e=>{ if(tab!==t.id) e.currentTarget.style.color=T.sub; }}
              >
                {t.label}
                {t.dot && (
                  <span style={{
                    position:"absolute",top:-2,right:-8,width:6,height:6,
                    borderRadius:3,background:T.green,animation:"pls 1.5s infinite",
                  }} />
                )}
              </button>
            ))}
          </nav>
        )}

        {/* Right: User controls */}
        <div style={{ display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
          {user ? (
            <>
              {!isMobile && (
                <span style={{ fontSize:13,color:T.sub,whiteSpace:"nowrap" }}>{user.name}</span>
              )}
              <button
                onClick={onLogout}
                style={{
                  background:"transparent",border:"1px solid rgba(239,68,68,0.4)",
                  borderRadius:100,color:T.red,cursor:"pointer",
                  padding:"7px 16px",fontSize:13,fontFamily:"inherit",whiteSpace:"nowrap",
                  transition:"color .2s, border-color .2s, background .2s",
                }}
                onMouseEnter={e=>{
                  e.currentTarget.style.background="rgba(239,68,68,0.1)";
                  e.currentTarget.style.borderColor="rgba(239,68,68,0.7)";
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.background="transparent";
                  e.currentTarget.style.borderColor="rgba(239,68,68,0.4)";
                }}
              >Log out</button>
            </>
          ) : (
            <>
              {!isMobile && <GlowBtn small outline noArrow onClick={() => onAuthOpen?.("login")}>Log In</GlowBtn>}
              <GlowBtn small noArrow onClick={() => onAuthOpen?.("signup")}>Sign Up</GlowBtn>
            </>
          )}
        </div>
      </header>

      {/* Spacer to push content below fixed header (~18+20+18px) */}
      <div style={{ height:56,flexShrink:0 }} />

      {/* Error banner */}
      {reserveError && (
        <div style={{
          padding:"14px 28px",color:"#FECACA",
          background:"rgba(251,146,60,.08)",
          borderTop:"1px solid rgba(251,146,60,.16)",
          borderBottom:"1px solid rgba(251,146,60,.16)",
          display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,
        }}>
          <span>{reserveError}</span>
          <button onClick={() => setReserveError("")} style={{
            background:"none",border:"none",color:"#FECACA",cursor:"pointer",fontSize:16,flexShrink:0,
          }}>✕</button>
        </div>
      )}

      {/* Content */}
      <div style={{ flex:1,overflow:"auto" }}>
        {tab==="find" && (
          <FindTab
            user={user}
            onAuthOpen={onAuthOpen}
            onReserve={handleReserve}
            reserveLoading={reserveLoading}
            initialSpotId={initialSpotId}
            onSpotDetailOpened={onSpotDetailOpened}
            profile={{ ...profile, vehicles }}
          />
        )}

        {tab!=="find" && !user && (
          <div style={{ padding:28,maxWidth:720,margin:"0 auto" }}>
            <Card style={{ padding:24,textAlign:"center" }}>
              <div style={{ fontSize:26,marginBottom:10 }}>🔒</div>
              <div style={{ fontSize:18,fontWeight:800,marginBottom:8 }}>Please log in to access this section</div>
              <div style={{ color:T.sub,fontSize:14,lineHeight:1.7,marginBottom:16 }}>
                You can browse parking locations without an account. To reserve, manage sessions, or view your wallet and history, please log in.
              </div>
              <GlowBtn onClick={onAuthOpen}>Log In / Sign Up</GlowBtn>
            </Card>
          </div>
        )}

        {tab==="session" && user && (
          <SessionTab
            activeReservation={activeReservation}
            vehicles={vehicles}
            onActivate={handleActivate}
            onCancel={handleCancelReservation}
            onComplete={handleCompleteReservation}
          />
        )}
        {tab==="wallet"  && user && <WalletTab user={user} onLogout={onLogout}/>}
        {tab==="history" && user && <HistoryTab />}
        {tab==="account" && user && (
          <AccountTab
            user={user}
            onLogout={onLogout}
            vehicles={vehicles}
            profile={{ ...profile, vehicles }}
            onProfileUpdate={setProfile}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onSaveProfile={handleSaveProfile}
            onChangePassword={handleChangePassword}
            onUserUpdate={onUserUpdate}
          />
        )}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav tabs={tabs} tab={tab} setTabSafe={setTabSafe} />}
    </div>
  );
}
