import React, { useState } from "react";
import { T } from "../../constants/theme";

export default function Toggle(){
  const [on,setOn]=useState(true);
  return(
    <div onClick={()=>setOn(o=>!o)} style={{ width:40,height:22,borderRadius:11,background:on?T.purple:"#555",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0 }}>
      <div style={{ width:18,height:18,borderRadius:9,background:"#fff",position:"absolute",top:2,left:on?20:2,transition:"left .2s" }} />
    </div>
  );
}
