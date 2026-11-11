/* stack.js · Home, Our services ([data-stack]). Dos modos:
   - Horizontal (≥ 900 px y con movimiento): agrega .stack--x a la lista, que pasa a ser una pista alta; las tarjetas
     quedan fijas (sticky, CSS) una encima de otra y, según el avance del scroll por la pista, cada una entra desde la
     derecha y tapa la anterior, que se achica (scale) y oscurece (--stack-dim) apenas.
   - Vertical (móvil): las tarjetas quedan fijas con position: sticky (CSS) y la siguiente sube y las tapa; solo se
     achica y oscurece la que va quedando debajo, según cuánto la cubre la siguiente.
   Escucha el scroll solo mientras la lista está en pantalla y escribe en un rAF. Sin efecto con prefers-reduced-motion
   (las tarjetas se apilan en columna, sin achicarse). Sin dependencias. */

const stack = document.querySelector('[data-stack]');
if (stack && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const items = [...stack.querySelectorAll('.stack__item')];
  const cards = items.map((li) => li.querySelector('.stack__card'));
  const wide = window.matchMedia('(min-width: 900px)');
  const STEP = 1.1;   // scroll por tarjeta, en altos de pantalla
  const EASE = 0.09;  // suavizado: fracción del camino que recorre cada cuadro hacia la posición del scroll
  let top = 110;      // top de la tarjeta fija (--stack-top), centrada en la pantalla bajo la cabecera
  let queued = false;
  let shown = -1;     // progreso dibujado; persigue al del scroll para que la entrada no vaya a saltos

  const cover = (i, t) => {
    cards[i].style.transform = t ? `scale(${1 - t * 0.06})` : '';
    cards[i].style.setProperty('--stack-dim', (t * 0.55).toFixed(3));
  };

  const smooth = (x) => x * x * (3 - 2 * x); // arranca y llega suave

  const updateX = () => {
    const box = stack.getBoundingClientRect();
    const cardH = items[0].offsetHeight;
    const target = Math.min(1, Math.max(0, (top - box.top) / (box.height - cardH)));
    shown = shown < 0 ? target : shown + (target - shown) * EASE;
    if (Math.abs(target - shown) < 0.0005) shown = target;
    else onScroll(); // sigue animando hasta alcanzar el scroll
    const from = window.innerWidth - box.left; // la tarjeta arranca justo fuera del borde derecho
    for (let i = 1; i < items.length; i++) {
      // cada tarjeta usa su tramo del recorrido, con una pausa al inicio y otra al final antes de la siguiente
      const t = smooth(Math.min(1, Math.max(0, (shown * (items.length - 1) - (i - 1)) * 1.5 - 0.15)));
      items[i].style.transform = t < 1 ? `translateX(${((1 - t) * from).toFixed(1)}px)` : '';
      cover(i - 1, t);
    }
  };

  const updateY = () => {
    for (let i = 0; i < items.length - 1; i++) {
      const cur = items[i].getBoundingClientRect();
      const next = items[i + 1].getBoundingClientRect();
      cover(i, Math.min(1, Math.max(0, (cur.bottom - next.top) / cur.height)));
    }
  };

  const update = () => { queued = false; (wide.matches ? updateX : updateY)(); };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  // Altura de la pista: lo que mide una tarjeta más el recorrido de las que entran
  const layout = () => {
    stack.classList.toggle('stack--x', wide.matches);
    items.forEach((li, i) => { li.style.transform = ''; cover(i, 0); });
    const cardH = items[0].offsetHeight;
    top = Math.max(110, Math.round((window.innerHeight + 72 - cardH) / 2)); // 72: alto aprox. de la cabecera
    stack.style.setProperty('--stack-top', `${top}px`);
    shown = -1;
    stack.style.height = wide.matches
      ? `${items[0].offsetHeight + (items.length - 1) * STEP * window.innerHeight}px`
      : '';
    update();
  };

  layout();
  wide.addEventListener('change', layout);
  window.addEventListener('resize', () => { if (wide.matches) layout(); }, { passive: true });

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { window.addEventListener('scroll', onScroll, { passive: true }); update(); }
    else window.removeEventListener('scroll', onScroll);
  }).observe(stack);
}
