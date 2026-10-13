/* magnetic.js · galería magnética de casos ([data-magnetic]). Cargar solo donde exista ese marcado.
   Marcado: [data-magnetic] > .magnetic__strip > li.magnetic__item > (button.magnetic__card + .magnetic__close + .magnetic__actions)
   - Escritorio (≥ 768 px): las tarjetas cercanas al cursor crecen (efecto "dock"); clic abre una tarjeta grande y
     atenúa las demás. Flechas izquierda/derecha cambian de tarjeta, Esc cierra.
   - Móvil (< 768 px): sin efecto; el CSS muestra una fila con scroll horizontal y el enlace siempre visible.
   - Movimiento reducido: sin easing; la tarjeta bajo el cursor/foco se expande al instante.
   Las tarjetas reparten el ancho con flex-grow (--f por ítem; --w1, --h0, --h1, --open, --open-grow, --gap en la raíz);
   no se re-renderiza nada por frame. */

const root = document.querySelector('[data-magnetic]');
if (root) {
  const items = [...root.querySelectorAll('.magnetic__item')];
  const n = items.length;
  const desktop = window.matchMedia('(min-width: 768px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const W0 = 78, H0 = 360, H1 = 430, OPEN_MAX = 520, GAP = 14, INFLUENCE = 220;
  const current = new Array(n).fill(0);
  const target = new Array(n).fill(0);
  let raf = null;
  let openIndex = -1;
  let settle = null;
  let g = { slot: W0, gap: GAP, scale: 1 };

  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const smooth = (v) => { const t = clamp(v, 0, 1); return t * t * (3 - 2 * t); };

  // Geometría responsive: las tarjetas reparten todo el ancho (flex); la abierta toma una proporción cuadrada
  const PAD = 28;
  const measure = () => {
    const W = root.clientWidth, H = root.clientHeight;
    const gap = GAP;
    const avail = Math.max(240, W - PAD * 2 - (n - 1) * gap);
    const slot = avail / n;
    const open = Math.min(OPEN_MAX, H * 0.86, avail * 0.6);
    g = { slot, gap, scale: 1 };
    const s = root.style;
    s.setProperty('--w1', Math.max(slot * 1.5, 150) + 'px');
    s.setProperty('--h0', Math.min(H0, H * 0.68) + 'px'); s.setProperty('--h1', Math.min(H1, H * 0.82) + 'px');
    s.setProperty('--open', open + 'px'); s.setProperty('--gap', gap + 'px');
    s.setProperty('--open-grow', (open * (n - 1) / Math.max(1, avail - open)).toFixed(3));
  };

  const paint = () => items.forEach((li, i) => {
    li.style.setProperty('--f', current[i].toFixed(3));
    li.style.setProperty('--reveal', clamp((current[i] - 0.16) / 0.84, 0, 1).toFixed(3));
  });

  const loop = () => {
    let moving = false;
    for (let i = 0; i < n; i++) {
      const d = target[i] - current[i];
      if (Math.abs(d) > 0.001) { current[i] += d * 0.17; moving = true; } else current[i] = target[i];
    }
    paint();
    raf = moving ? requestAnimationFrame(loop) : null;
  };
  const push = () => {
    if (reduce.matches) { current.splice(0, n, ...target); paint(); return; }
    if (raf === null) raf = requestAnimationFrame(loop);
  };
  const rest = () => { target.fill(0); push(); };

  // Estado abierto/cerrado
  const setOpen = (i, focusCard) => {
    openIndex = i;
    root.classList.toggle('is-open', i >= 0);
    root.classList.add('is-settling');
    clearTimeout(settle);
    settle = setTimeout(() => root.classList.remove('is-settling'), 700);
    items.forEach((li, k) => {
      li.classList.toggle('is-open', k === i);
      li.querySelector('.magnetic__card').setAttribute('aria-expanded', String(k === i));
    });
    target.fill(0); current.fill(0); paint();
    if (focusCard && i >= 0) items[i].querySelector('.magnetic__card').focus({ preventScroll: true });
  };

  root.addEventListener('pointermove', (e) => {
    if (!desktop.matches || openIndex >= 0 || e.pointerType === 'touch') return;
    const b = root.getBoundingClientRect();
    const x = e.clientX - b.left - PAD;
    for (let i = 0; i < n; i++) {
      const c = i * (g.slot + g.gap) + g.slot / 2;
      target[i] = smooth(1 - Math.abs(x - c) / Math.max(INFLUENCE * 0.8, g.slot * 1.9));
    }
    if (reduce.matches) { // sin gradiente: solo la más cercana
      const k = target.indexOf(Math.max(...target));
      target.fill(0); target[k] = 1;
    }
    push();
  });
  root.addEventListener('pointerleave', () => { if (openIndex < 0) rest(); });

  // Teclado: el foco expande la tarjeta (revela su texto) incluso sin cursor
  root.addEventListener('focusin', (e) => {
    if (!desktop.matches || openIndex >= 0) return;
    const li = e.target.closest('.magnetic__item');
    if (!li || !e.target.matches(':focus-visible')) return;
    target.fill(0); target[items.indexOf(li)] = 1; push();
  });
  root.addEventListener('focusout', () => { if (openIndex < 0) rest(); });

  items.forEach((li, i) => {
    li.querySelector('.magnetic__card').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!desktop.matches) return;
      setOpen(openIndex === i ? -1 : i, false);
    });
    li.querySelector('.magnetic__close').addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(-1, false);
      li.querySelector('.magnetic__card').focus({ preventScroll: true });
    });
  });
  // Clic en el fondo cierra
  root.addEventListener('click', (e) => {
    if (openIndex >= 0 && !e.target.closest('.magnetic__item')) setOpen(-1, false);
  });

  root.addEventListener('keydown', (e) => {
    if (!desktop.matches) return;
    if (e.key === 'Escape' && openIndex >= 0) {
      const k = openIndex;
      setOpen(-1, false);
      items[k].querySelector('.magnetic__card').focus({ preventScroll: true });
      return;
    }
    if (openIndex >= 0 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      setOpen((openIndex + (e.key === 'ArrowRight' ? 1 : -1) + n) % n, true);
    }
  });

  measure();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(root);
  else window.addEventListener('resize', measure);
  desktop.addEventListener('change', () => { setOpen(-1, false); rest(); measure(); });
}
