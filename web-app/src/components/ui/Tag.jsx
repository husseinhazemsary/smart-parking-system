import React from "react";

export default function Tag({ children, color }){
  return <span style={{ padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:700,background:`${color}22`,color }}>{children}</span>;
}
