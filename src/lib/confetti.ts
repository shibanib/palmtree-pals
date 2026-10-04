const COLORS = ["#f4b8c8", "#fff6ea", "#9fd9d4", "#f7d7a8", "#e7c4ef"];

/** A short pastel burst. Drawn on a canvas, then removed. */
export function burstConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const context = canvas.getContext("2d");
  if (!context) {
    canvas.remove();
    return;
  }
  const pieces = Array.from({ length: 70 }, () => ({
    x: canvas.width * (0.15 + Math.random() * 0.7),
    y: canvas.height * 0.35 + Math.random() * 40,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 6,
    vx: -3 + Math.random() * 6,
    vy: -7 - Math.random() * 4,
    rot: Math.random() * Math.PI,
    vr: -0.2 + Math.random() * 0.4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0],
  }));
  let frame = 0;
  const tick = () => {
    frame += 1;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const piece of pieces) {
      piece.vy += 0.18;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rot += piece.vr;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rot);
      context.fillStyle = piece.color;
      context.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      context.restore();
    }
    if (frame < 80) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
