// Keyboard (WASD / arrows / space) + mouse orbit/zoom + shift-click splash.

export class Input {
  constructor(canvas, camera, { onPick } = {}) {
    this.keys = new Set();
    this.camera = camera;
    this.canvas = canvas;
    this.onPick = onPick;
    const typing = (e) => e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA');
    window.addEventListener('keydown', (e) => {
      if (typing(e)) return;
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    let drag = null;
    canvas.addEventListener('pointerdown', (e) => {
      if (e.shiftKey && this.onPick) {
        const r = canvas.getBoundingClientRect();
        this.onPick((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
        return;
      }
      drag = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      camera.orbit(e.clientX - drag.x, e.clientY - drag.y);
      drag = { x: e.clientX, y: e.clientY };
    });
    const end = () => (drag = null);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        camera.zoom(e.deltaY * (e.deltaMode === 1 ? 30 : 1));
      },
      { passive: false },
    );
  }

  // Camera-relative move intent -> world-frame action.
  action() {
    const k = this.keys;
    let f = 0;
    let r = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) r += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) r -= 1;
    const { fwd, right } = this.camera.basis();
    let mx = fwd[0] * f + right[0] * r;
    let mz = fwd[1] * f + right[1] * r;
    const l = Math.hypot(mx, mz);
    if (l > 1) { mx /= l; mz /= l; }
    return { mx, mz, jump: k.has('Space'), raw: [r, f] };
  }
}
