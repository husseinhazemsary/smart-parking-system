import React, { useEffect } from "react";
import { T } from "../../constants/theme";

export default function Modal({ open, onClose, children, maxWidth=520 }){
  useEffect(()=>{ document.body.style.overflow=open?"hidden":""; return()=>{ document.body.style.overflow=""; }; },[open]);
  if(!open) return null;
  return(
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.75)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.surface,borderRadius:24,border:`1px solid ${T.border}`,width:"100%",maxWidth,maxHeight:"90vh",overflowY:"auto",animation:"fadeUp .25s ease" }}>
        {children}
      </div>
    </div>
  );
}
