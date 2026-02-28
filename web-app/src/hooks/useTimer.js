import { useState, useEffect } from "react";

export default function useTimer(start=5025){
  const [s,setS]=useState(start);
  useEffect(()=>{ const id=setInterval(()=>setS(v=>v+1),1000); return()=>clearInterval(id); },[]);
  return [String(Math.floor(s/3600)).padStart(2,"0"),String(Math.floor((s%3600)/60)).padStart(2,"0"),String(s%60).padStart(2,"0")].join(":");
}
