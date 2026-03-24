// =============================================
//  CANVAS — setup, resize, screen dimensions
// =============================================

export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");
export const fxCanvas = document.getElementById("fx-canvas");
export const fxCtx = fxCanvas.getContext("2d");
export const bassPulse = document.getElementById("bass-pulse");

export let W = 0, H = 0;

export function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fxCanvas.width = W * dpr;
  fxCanvas.height = H * dpr;
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resize();
window.addEventListener("resize", resize);

export function triggerBassPulse(type) {
  bassPulse.className = '';
  void bassPulse.offsetWidth;
  bassPulse.classList.add(type);
  setTimeout(() => bassPulse.className = '', 200);
}
