import React from "react";
import { T } from "../../constants/theme";

export default function GradientBorder({ children, radius=16, style={} }){
  return(
    <div style={{ padding:1.5, borderRadius:radius, background:"linear-gradient(90deg,rgba(125,57,235,.55),rgba(10,3,32,.55))", ...style }}>
      <div style={{ borderRadius:radius-1.5, overflow:"hidden", background:T.surface }}>{children}</div>
    </div>
  );
}
