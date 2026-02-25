import React from "react";
import { T } from "../../constants/theme";

export default function GlowBtn({ children, onClick, small, outline, danger, full, style={} }){
  const bg = danger ? T.red : outline ? "transparent" : `linear-gradient(135deg,${T.purple},${T.purpleDim})`;
  const border = outline ? `1.5px solid ${T.purple}` : danger ? `1px solid ${T.red}` : "none";
  const shadow = outline||danger ? "none" : "0 4px 24px rgba(125,57,235,.45)";
  return(
    <button onClick={onClick} style={{
      padding:small?"9px 20px":"14px 32px", borderRadius:999, border,
      background:bg, color:"#fff", fontFamily:"inherit", fontWeight:700,
      fontSize:small?13:15, cursor:"pointer", letterSpacing:0.3,
      boxShadow:shadow, transition:"opacity .15s",
      width:full?"100%":"auto", ...style,
    }}
      onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
      onMouseLeave={e=>e.currentTarget.style.opacity="1"}
    >{children}</button>
  );
}
