/* pin.js · cabecera fija ([data-pin], ver .page-hero--pin): mientras la sección siguiente sube y la tapa, escribe en --pin
   (0 a 1) cuánto scroll lleva, y el CSS atenúa y sube el contenido de la cabecera. Solo corre mientras se ve.
   Sin movimiento (prefers-reduced-motion) no hace nada y la cabecera no queda fija. */

const heroes = document.querySelectorAll('[data-pin]');
if (heroes.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  heroes.forEach((hero) => {
    let raf = null;
    const update = () => {
      raf = null;
      const p = Math.min(Math.max(window.scrollY / Math.max(hero.offsetHeight * 0.7, 1), 0), 1);
      hero.style.setProperty('--pin', p.toFixed(3));
    };
    const request = () => { if (raf === null) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  });
}
