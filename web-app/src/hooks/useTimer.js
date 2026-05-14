import { useState, useEffect } from "react";

export default function useTimer(startTimestamp = null) {
  const calcElapsed = () => {
    if (!startTimestamp) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(startTimestamp).getTime()) / 1000));
  };

  const [s, setS] = useState(calcElapsed);

  useEffect(() => {
    setS(calcElapsed());
    const id = setInterval(() => setS(v => v + 1), 1000);
    return () => clearInterval(id);
  }, [startTimestamp]);

  return [
    String(Math.floor(s / 3600)).padStart(2, "0"),
    String(Math.floor((s % 3600) / 60)).padStart(2, "0"),
    String(s % 60).padStart(2, "0"),
  ].join(":");
}
