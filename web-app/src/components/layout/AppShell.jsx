import React, { useEffect, useState } from "react";
import { T } from "../../constants/theme";
import useBreakpoint from "../../hooks/useBreakpoint";
import apiFetch from "../../api/client";
import GlowBtn from "../ui/GlowBtn";
import Card from "../ui/Card";
import BottomNav from "./BottomNav";

import FindTab from "../../pages/FindTab";
import SessionTab from "../../pages/SessionTab";
import WalletTab from "../../pages/WalletTab";
import HistoryTab from "../../pages/HistoryTab";
import AccountTab from "../../pages/AccountTab";
import PaymentModal from "../ui/PaymentModal";

const DEMO_CARDS = [
  { id:1, type:"visa",       last4:"4582", holder:"Nour Ahmed", expiry:"09/28", gradient:["#5B21B6","#7C3AED"] },
  { id:2, type:"mastercard", last4:"1197", holder:"Nour Ahmed", expiry:"03/27", gradient:["#1E3A5F","#1D4ED8"] },
];

export default function AppShell({ user, onLogout, onBack, onAuthOpen, initialSpotId, onSpotDetailOpened }) {
  const [tab, setTab] = useState("find");
  const { isMobile, isTablet } = useBreakpoint();
  const [profile, setProfile] = useState({ accessibility: false });
  const [vehicles, setVehicles] = useState([]);
  const [activeReservation, setActiveReservation] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveError, setReserveError] = useState("");

  // ── Payment state ──────────────────────────────────────────────────────────
  const [cards,             setCards]            = useState(DEMO_CARDS);
  const [activeCardId,      setActiveCardId]     = useState(DEMO_CARDS[0].id);
  const [transactions,      setTransactions]     = useState([]);
  const [paymentModal,      setPaymentModal]     = useState(null); // { reservationId, amount, durationMins, lotName }
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess,    setPaymentSuccess]   = useState(false);

  const mapVehicle = v => ({
    id: v.id,
    icon: "🚗",
    label: v.makeAndModel || v.nickname || v.plateNumber || "My Vehicle",
    sub: v.plateNumber || "",
    isEV: false,
    vehicleType: v.vehicleType,
  });

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
  }, [user]);

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

  // Opens the payment modal — actual API call happens in confirmPayment
  const handleCompleteReservation = reservationId => {
    const enteredAt   = activeReservation?.enteredAt;
    const rate        = activeReservation?.hourlyRate ? Number(activeReservation.hourlyRate) : 0;
    const elapsedSecs = enteredAt ? (Date.now() - new Date(enteredAt).getTime()) / 1000 : 0;
    const amount      = (elapsedSecs / 3600) * rate;
    const durationMins = Math.max(1, Math.ceil(elapsedSecs / 60));

    setPaymentModal({
      reservationId,
      amount,
      durationMins,
      lotName: activeReservation?.parkingLotName || "Parking",
    });
  };

  const confirmPayment = async () => {
    if (!paymentModal) return;
    const { reservationId, amount, durationMins, lotName } = paymentModal;
    const card = cards.find(c => c.id === activeCardId);

    setPaymentProcessing(true);
    try {
      // Simulate payment processing delay
      await new Promise(r => setTimeout(r, 1500));
      await apiFetch(`/api/reservations/${reservationId}/complete`, { method: "POST" });

      const hrs   = Math.floor(durationMins / 60);
      const mins  = durationMins % 60;
      const label = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

      setTransactions(prev => [{
        id:        Date.now(),
        name:      lotName,
        date:      new Date().toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }),
        duration:  label,
        cost:      amount === 0 ? "Free" : `EGP ${amount.toFixed(2)}`,
        status:    amount === 0 ? "Free" : "Paid",
        cardLast4: card?.last4,
        cardType:  card?.type,
        failed:    false,
      }, ...prev]);

      setPaymentSuccess(true);
      setTimeout(() => {
        setActiveReservation(null);
        setPaymentModal(null);
        setPaymentSuccess(false);
        setTab("wallet");
      }, 2000);
    } catch (e) {
      setReserveError(e?.message || "Payment failed. Please try again.");
      setPaymentModal(null);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleAddCard = card => setCards(prev => [...prev, { ...card, id: Date.now() }]);
  const handleRemoveCard = cardId => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    if (activeCardId === cardId) setActiveCardId(cards.find(c => c.id !== cardId)?.id ?? null);
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

  // ── Add vehicle from Account tab ───────────────────────────────────────────

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

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight:"100vh",background:T.dark,color:T.text,display:"flex",flexDirection:"column" }}>
      {/* Top bar */}
      <header style={{
        height:64,display:"flex",alignItems:"center",padding:`0 ${isMobile?"16px":"28px"}`,gap:16,
        borderBottom:`1px solid ${T.border}`,background:"rgba(17,0,48,.95)",
        backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:50,flexShrink:0,
      }}>
        <button onClick={onBack} style={{
          background:"none",border:`1px solid ${T.border}`,borderRadius:10,
          color:T.sub,cursor:"pointer",padding:"6px 12px",fontSize:13,
          fontFamily:"inherit",whiteSpace:"nowrap",
        }}>← Home</button>
        <div style={{ fontWeight:800,fontSize:20,letterSpacing:-0.5,whiteSpace:"nowrap" }}>
          <span style={{ color:T.purple }}>ez</span>rakna
        </div>
        <div style={{ flex:1 }} />

        {/* Desktop nav */}
        {!isMobile && (
          <nav className="hideScroll" style={{
            display:"flex",gap:4,overflowX:"auto",maxWidth:"60vw",
            paddingBottom:2,scrollbarWidth:"none",
          }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTabSafe(t.id)} style={{
                padding:"8px 16px",borderRadius:10,border:"none",fontFamily:"inherit",
                background: tab===t.id ? "rgba(125,57,235,.18)" : "transparent",
                color: tab===t.id ? T.text : T.sub,
                fontSize:13,fontWeight:tab===t.id?700:400,cursor:"pointer",
                position:"relative",whiteSpace:"nowrap",
              }}>
                {!isTablet && `${t.icon} `}{!isTablet ? t.label : t.icon}
                {t.dot && (
                  <span style={{
                    position:"absolute",top:5,right:5,width:7,height:7,
                    borderRadius:4,background:T.green,animation:"pls 1.5s infinite",
                  }} />
                )}
              </button>
            ))}
          </nav>
        )}

        {/* User controls */}
        <div style={{ display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
          {user ? (
            <>
              {!isMobile && <span style={{ fontSize:13,color:T.sub,whiteSpace:"nowrap" }}>{user.name}</span>}
              <button onClick={onLogout} style={{
                background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",
                borderRadius:10,color:T.red,cursor:"pointer",
                padding:"6px 12px",fontSize:12,fontFamily:"inherit",whiteSpace:"nowrap",
              }}>Log out</button>
            </>
          ) : (
            <>
              {!isMobile && <GlowBtn small outline noArrow onClick={onAuthOpen}>Log In</GlowBtn>}
              <GlowBtn small noArrow onClick={onAuthOpen}>Sign Up</GlowBtn>
            </>
          )}
        </div>
      </header>

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
            activeReservation={activeReservation}
            onGoToSession={() => setTab("session")}
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
        {tab==="wallet" && user && (
          <WalletTab
            cards={cards}
            activeCardId={activeCardId}
            onActiveCardChange={setActiveCardId}
            onAddCard={handleAddCard}
            onRemoveCard={handleRemoveCard}
            transactions={transactions}
            activeReservation={activeReservation}
            onGoToSession={() => setTab("session")}
          />
        )}
        {tab==="history" && user && <HistoryTab />}
        {tab==="account" && user && (
          <AccountTab
            user={user}
            onLogout={onLogout}
            vehicles={vehicles}
            profile={{ ...profile, vehicles }}
            onProfileUpdate={setProfile}
            onAddVehicle={handleAddVehicle}
            onVehiclesRefresh={loadVehicles}
          />
        )}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav tabs={tabs} tab={tab} setTabSafe={setTabSafe} />}

      <PaymentModal
        reservation={paymentModal}
        cards={cards}
        activeCardId={activeCardId}
        onCardChange={setActiveCardId}
        processing={paymentProcessing}
        success={paymentSuccess}
        onConfirm={confirmPayment}
        onCancel={() => setPaymentModal(null)}
      />
    </div>
  );
}
