/* parallax.js · parallax de cabecera ([data-parallax]).
   Escribe en la sección --par-p (0 a 1): 0 con la sección arriba de todo y 1 cuando ya salió de pantalla por arriba.
   El CSS lo usa para mover la foto más lento que la página y apagar el texto (ver "Parallax de cabecera" en styles.css).
   Solo trabaja mientras la sección se ve. Con movimiento reducido no hace nada y la cabecera queda fija como antes. */

const el = document.querySelector('[data-parallax]');
if (el && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let visible = true;
  let queued = false;
  let last = '';
  const update = () => {
    queued = false;
    const r = el.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / r.height));
    const v = p.toFixed(3);
    if (v !== last) { el.style.setProperty('--par-p', v); last = v; }
  };
  const onScroll = () => { if (visible && !queued) { queued = true; requestAnimationFrame(update); } };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) onScroll(); }).observe(el);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}
