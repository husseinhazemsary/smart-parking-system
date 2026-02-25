import React from "react";
import { T } from "../../constants/theme";

export default function SectionLabel({ children }){
  return <div style={{ fontSize:12,fontWeight:700,color:T.sub,letterSpacing:1,marginBottom:14,textTransform:"uppercase" }}>{children}</div>;
}
