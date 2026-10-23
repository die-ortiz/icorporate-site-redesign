/* pin.js · cabecera fija ([data-pin], ver .page-hero--pin): mientras la sección siguiente sube y la tapa, atenúa y sube el
   contenido de la cabecera según el scroll (opacity y translate directos, sin lecturas de layout).
   Sin movimiento (prefers-reduced-motion) no hace nada y la cabecera no queda fija. */

const heroes = document.querySelectorAll('[data-pin]');
if (heroes.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  heroes.forEach((hero) => {
    const content = hero.querySelector(':scope > .container');
    if (!content) return;
    let raf = null;
    let height = hero.offsetHeight;
    const update = () => {
      raf = null;
      const p = Math.min(Math.max(window.scrollY / Math.max(height * 0.7, 1), 0), 1);
      content.style.opacity = (1 - p * 1.3).toFixed(3);
      content.style.translate = `0 ${(-p * 3).toFixed(2)}rem`;
    };
    const request = () => { if (raf === null) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', () => { height = hero.offsetHeight; request(); });
    update();
  });
}
