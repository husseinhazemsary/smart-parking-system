import React from "react";
import { T } from "../../constants/theme";

export default function Card({ children, style={}, glow=false, onClick }){
  return(
    <div onClick={onClick} style={{
      background:T.surface, borderRadius:20, border:`1px solid ${T.border}`,
      boxShadow:glow?"0 0 32px rgba(125,57,235,.12)":"none",
      cursor:onClick?"pointer":"default", ...style,
    }}>{children}</div>
  );
}
