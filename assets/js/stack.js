/* stack.js · Home, Our services ([data-stack]): las tarjetas quedan fijas con position: sticky (CSS) y la siguiente sube
   y las tapa. Este módulo solo achica (scale) y oscurece (--stack-dim) apenas la tarjeta que va quedando debajo, según
   cuánto la cubre la siguiente. Escucha el scroll solo mientras la lista está en pantalla y escribe en un rAF.
   Sin efecto con prefers-reduced-motion (las tarjetas se apilan igual, sin achicarse). Sin dependencias. */

const stack = document.querySelector('[data-stack]');
if (stack && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const items = [...stack.querySelectorAll('.stack__item')];
  const cards = items.map((li) => li.querySelector('.stack__card'));
  let queued = false;

  const update = () => {
    queued = false;
    for (let i = 0; i < items.length - 1; i++) {
      const cur = items[i].getBoundingClientRect();
      const next = items[i + 1].getBoundingClientRect();
      const covered = Math.min(1, Math.max(0, (cur.bottom - next.top) / cur.height));
      cards[i].style.transform = covered ? `scale(${1 - covered * 0.06})` : '';
      cards[i].style.setProperty('--stack-dim', (covered * 0.55).toFixed(3));
    }
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { window.addEventListener('scroll', onScroll, { passive: true }); update(); }
    else window.removeEventListener('scroll', onScroll);
  }).observe(stack);
}
