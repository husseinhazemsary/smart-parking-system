import React from "react";

/*
  AnimatedBtn — the expanding-circle arrow button style.
  Props:
    children  — label text
    onClick   — handler
    small     — smaller size
    outline   — inverted colours (transparent bg, purple border)
    full      — width: 100%
    style     — extra inline overrides
    gold      — gold colour variant (for B2B CTAs)
*/

const CSS = `
  .ez-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 2px solid transparent;
    background-color: transparent;
    border-radius: 100px;
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
    white-space: nowrap;
    text-decoration: none;
    vertical-align: middle;
  }

  /* ── Size variants ── */
  .ez-btn-normal { padding: 13px 32px; font-size: 15px; }
  .ez-btn-small  { padding: 9px 22px;  font-size: 13px; }

  /* ── Colour: purple (default) ── */
  .ez-btn-purple {
    color: #7D39EB;
    box-shadow: 0 0 0 2px #7D39EB;
  }
  .ez-btn-purple .ez-circle { background-color: #7D39EB; }
  .ez-btn-purple svg         { fill: #7D39EB; }
  .ez-btn-purple:hover       { color: #fff; }
  .ez-btn-purple:hover svg   { fill: #fff; }
  .ez-btn-purple:active      { box-shadow: 0 0 0 4px #7D39EB; }

  /* ── Colour: purple filled ── */
  .ez-btn-purple-filled {
    color: #fff;
    box-shadow: 0 0 0 2px #7D39EB;
    background: linear-gradient(135deg, #7D39EB, #9D50E8);
  }
  .ez-btn-purple-filled .ez-circle { background-color: #fff; }
  .ez-btn-purple-filled svg         { fill: #fff; }
  .ez-btn-purple-filled:hover       { color: #7D39EB; }
  .ez-btn-purple-filled:hover svg   { fill: #7D39EB; }
  .ez-btn-purple-filled:active      { box-shadow: 0 0 0 4px #7D39EB; scale: 0.97; }

  /* ── Colour: gold ── */
  .ez-btn-gold {
    color: #F0B429;
    box-shadow: 0 0 0 2px #F0B429;
  }
  .ez-btn-gold .ez-circle { background-color: #F0B429; }
  .ez-btn-gold svg         { fill: #F0B429; }
  .ez-btn-gold:hover       { color: #07001A; }
  .ez-btn-gold:hover svg   { fill: #07001A; }
  .ez-btn-gold:active      { box-shadow: 0 0 0 4px #F0B429; }

  /* ── Shared hover effects ── */
  .ez-btn:hover {
    box-shadow: 0 0 0 12px transparent;
    border-radius: 12px;
  }
  .ez-btn:active { scale: 0.96; }

  /* ── SVG arrows ── */
  .ez-btn svg {
    position: absolute;
    width: 20px;
    z-index: 9;
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
    flex-shrink: 0;
  }
  .ez-btn-small svg { width: 16px; }
  .ez-arr-1 { right: 14px; }
  .ez-arr-2 { left: -22%; }
  .ez-btn:hover .ez-arr-1 { right: -22%; }
  .ez-btn:hover .ez-arr-2 { left: 14px; }
  .ez-btn-small .ez-arr-1 { right: 11px; }
  .ez-btn-small:hover .ez-arr-1 { right: -22%; }
  .ez-btn-small:hover .ez-arr-2 { left: 11px; }

  /* ── Expanding circle ── */
  .ez-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    opacity: 0;
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
    z-index: 0;
  }
  .ez-btn:hover .ez-circle {
    width: 500px;
    height: 500px;
    opacity: 1;
  }

  /* ── Text ── */
  .ez-text {
    position: relative;
    z-index: 1;
    transform: translateX(-10px);
    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
    /* leave room for right arrow */
    padding-right: 12px;
  }
  .ez-btn-small .ez-text { transform: translateX(-8px); padding-right: 8px; }
  .ez-btn:hover .ez-text { transform: translateX(10px); }
  .ez-btn-small:hover .ez-text { transform: translateX(8px); }

  /* ── No-arrow variant ── */
  .ez-btn-no-arrow svg { display: none; }
  .ez-btn-no-arrow .ez-text {
    transform: translateX(0) !important;
    padding-right: 0 !important;
    padding-left: 0 !important;
  }
  .ez-btn-no-arrow:hover .ez-text { transform: translateX(0) !important; }

  /* ── Full width ── */
  .ez-btn-full { width: 100%; }
`;

const ArrowSVG = ({ cls }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={cls}>
    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
  </svg>
);

export default function GlowBtn({ children, onClick, small, outline, full, gold, noArrow, style={} }){
  let colorClass;
  if(gold)         colorClass = "ez-btn-gold";
  else if(outline) colorClass = "ez-btn-purple";
  else             colorClass = "ez-btn-purple-filled";

  const classes = [
    "ez-btn",
    small ? "ez-btn-small" : "ez-btn-normal",
    colorClass,
    full   ? "ez-btn-full"     : "",
    noArrow? "ez-btn-no-arrow" : "",
  ].filter(Boolean).join(" ");

  return(
    <>
      <style dangerouslySetInnerHTML={{__html: CSS}}/>
      <button className={classes} onClick={onClick} style={style}>
        <ArrowSVG cls="ez-arr-2"/>
        <span className="ez-text">{children}</span>
        <span className="ez-circle"/>
        <ArrowSVG cls="ez-arr-1"/>
      </button>
    </>
  );
}