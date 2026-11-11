/* stack.js · Home, Our services ([data-stack] en .stack-track, con .stack-stage > .stack-head + .stack-nav + ol.stack).
   Dos modos:
   - Horizontal (≥ 900 px y con movimiento): agrega .stack-track--x y fija la altura de la pista. El escenario (título,
     indicador y tarjetas superpuestas) queda fijo y centrado en pantalla (sticky, --stack-top); según el avance del
     scroll cada tarjeta entra desde la derecha y tapa la anterior, que se achica (scale) y oscurece (--stack-dim). La que
     entra trae la foto con parallax (--stack-par), el texto con retraso (--stack-text) y la línea de acento dibujándose
     (--stack-line). El progreso dibujado persigue al del scroll (suavizado), así la entrada no va a saltos.
     El indicador (.stack-nav) llena la línea de cada servicio (--fill), marca el actual (.is-active) y al hacer clic lleva
     a su tarjeta. Con teclado, al recibir foco una tarjeta, el scroll salta a donde ya entró.
   - Vertical (móvil): las tarjetas quedan fijas con position: sticky (CSS) y la siguiente sube y las tapa; solo se
     achica y oscurece la que va quedando debajo, según cuánto la cubre la siguiente.
   Escucha el scroll solo mientras la sección está en pantalla y escribe en un rAF. Sin efecto con prefers-reduced-motion
   (las tarjetas se apilan en columna, sin achicarse). Sin dependencias. */

const track = document.querySelector('[data-stack]');
if (track && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const stage = track.querySelector('.stack-stage');
  const items = [...track.querySelectorAll('.stack__item')];
  const cards = items.map((li) => li.querySelector('.stack__card'));
  const navs = [...track.querySelectorAll('.stack-nav button')];
  const n = items.length;
  const wide = window.matchMedia('(min-width: 900px)');
  const HEADER = 72;  // alto de la cabecera fija
  const STEP = 1.1;   // scroll por tarjeta, en altos de pantalla
  const EASE = 0.09;  // suavizado: fracción del camino que recorre cada cuadro hacia la posición del scroll
  const DONE = 1.15 / 1.5; // punto del tramo de cada tarjeta en el que termina de entrar (ver enter())
  let top = HEADER + 16;
  let queued = false;
  let shown = -1;     // progreso dibujado (0-1); persigue al del scroll

  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const smooth = (x) => x * x * (3 - 2 * x); // arranca y llega suave
  // entrada de la tarjeta i (1..n-1) según el progreso p: usa su tramo, con una pausa al inicio y otra al final
  const enter = (i, p) => smooth(clamp01((p * (n - 1) - (i - 1)) * 1.5 - 0.15));
  // progreso en el que la tarjeta i ya entró del todo
  const progressFor = (i) => (i ? (i - 1 + DONE) / (n - 1) : 0);

  const cover = (i, t) => {
    cards[i].style.transform = t ? `scale(${1 - t * 0.06})` : '';
    cards[i].style.setProperty('--stack-dim', (t * 0.55).toFixed(3));
  };

  const range = () => track.offsetHeight - stage.offsetHeight;
  const trackTop = () => track.getBoundingClientRect().top + window.scrollY;

  const updateX = () => {
    const box = track.getBoundingClientRect();
    const target = clamp01((top - box.top) / range());
    shown = shown < 0 ? target : shown + (target - shown) * EASE;
    if (Math.abs(target - shown) < 0.0005) shown = target;
    else onScroll(); // sigue animando hasta alcanzar el scroll
    const from = window.innerWidth - box.left; // arranca justo fuera del borde derecho
    let active = 0;
    navs[0]?.style.setProperty('--fill', 1);
    for (let i = 1; i < n; i++) {
      const t = enter(i, shown);
      const li = items[i];
      li.style.transform = t < 1 ? `translateX(${((1 - t) * from).toFixed(1)}px)` : '';
      li.style.setProperty('--stack-par', (1 - t).toFixed(3));
      li.style.setProperty('--stack-text', clamp01((t - 0.35) / 0.65).toFixed(3));
      li.style.setProperty('--stack-line', clamp01((t - 0.3) / 0.7).toFixed(3));
      cover(i - 1, t);
      navs[i]?.style.setProperty('--fill', t.toFixed(3));
      if (t > 0.5) active = i;
    }
    navs.forEach((b, i) => b.classList.toggle('is-active', i === active));
  };

  const updateY = () => {
    for (let i = 0; i < n - 1; i++) {
      const cur = items[i].getBoundingClientRect();
      const next = items[i + 1].getBoundingClientRect();
      cover(i, clamp01((cur.bottom - next.top) / cur.height));
    }
  };

  const update = () => { queued = false; (wide.matches ? updateX : updateY)(); };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  // Altura de la pista: lo que mide el escenario más el recorrido de las tarjetas que entran
  const layout = () => {
    track.classList.toggle('stack-track--x', wide.matches);
    items.forEach((li, i) => {
      li.style.transform = '';
      ['--stack-par', '--stack-text', '--stack-line'].forEach((v) => li.style.removeProperty(v));
      cover(i, 0);
    });
    shown = -1;
    if (wide.matches) {
      top = Math.max(HEADER + 16, Math.round((window.innerHeight + HEADER - stage.offsetHeight) / 2));
      track.style.setProperty('--stack-top', `${top}px`);
      track.style.height = `${stage.offsetHeight + (n - 1) * STEP * window.innerHeight}px`;
    } else {
      track.style.height = '';
    }
    update();
  };

  // Lleva el scroll al punto en que la tarjeta i ya entró
  const scrollToCard = (i, behavior) => {
    window.scrollTo({ top: trackTop() - top + progressFor(i) * range(), behavior });
  };

  navs.forEach((b, i) => b.addEventListener('click', () => scrollToCard(i, 'smooth')));

  // Teclado: una tarjeta que recibe foco puede estar fuera de pantalla o tapada; se salta a donde se ve
  items.forEach((li, i) => li.addEventListener('focusin', () => {
    if (!wide.matches) return;
    scrollToCard(i, 'instant');
    shown = progressFor(i);
    update();
  }));

  layout();
  wide.addEventListener('change', layout);
  window.addEventListener('resize', () => { if (wide.matches) layout(); }, { passive: true });

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { window.addEventListener('scroll', onScroll, { passive: true }); update(); }
    else window.removeEventListener('scroll', onScroll);
  }).observe(track);
}
