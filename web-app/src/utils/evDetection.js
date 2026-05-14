// Known pure-EV brands — any model from these is always electric
const EV_MAKES = new Set([
  "tesla","rivian","lucid","polestar","byd","nio","xpeng","zeekr","fisker","canoo",
]);

// Keywords that identify EV models regardless of make
const EV_MODEL_KEYWORDS = [
  "electric","ioniq","leaf","bolt ev","id.4","id.3","id.","e-tron","taycan","zoe",
  "kona ev","niro ev","ev6","ev9","i3","i4","ix3","ix5","ix ","eqc","eqs","eqa","eqb",
  "model s","model 3","model x","model y","cybertruck","r1t","r1s","air ","ocean ",
  " ev"," bev",
];

export function detectEV(make, model) {
  const m  = make.trim().toLowerCase();
  const mo = model.trim().toLowerCase();
  if (EV_MAKES.has(m)) return true;
  return EV_MODEL_KEYWORDS.some(k => mo.includes(k));
}
