import React from "react";

export default function ProgressBar({ value, color }){
  return(
    <div style={{ height:5, borderRadius:4, background:"rgba(255,255,255,.07)", overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.max(0,Math.min(1,value))*100}%`, background:color, borderRadius:4, transition:"width .4s" }} />
    </div>
  );
}
