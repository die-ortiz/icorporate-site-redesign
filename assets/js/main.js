// Header: pasa de transparente a sólido de forma continua con el scroll
const header = document.querySelector('.site-header');
if (header) {
  const RANGE = 160;                 // px de scroll hasta quedar totalmente sólido
  const FLIP_ON = 0.46, FLIP_OFF = 0.42; // punto de equilibrio de contraste (0.44) con histéresis
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  let flipped = false;
  const update = () => {
    const p = clamp01(window.scrollY / RANGE);
    header.style.setProperty('--scroll-p', p.toFixed(3));
    if (!flipped && p >= FLIP_ON) flipped = true;
    else if (flipped && p <= FLIP_OFF) flipped = false;
    header.classList.toggle('is-scrolled', flipped);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// Menú móvil (se cierra con Esc o al elegir un enlace)
const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    header && header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
}

// Entrada suave de secciones
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && reveals.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

// Fondos de rayos (WebGL). Si falla, queda el degradado CSS.
const rayEls = document.querySelectorAll('[data-siderays]');
if (rayEls.length) {
  import('./siderays.js')
    .then(({ initSideRays }) => {
      rayEls.forEach((el) => initSideRays(el, { origin: el.dataset.origin || 'top-right', intensity: Number(el.dataset.intensity || 2) }));
    })
    .catch(() => {});
}

// Carrusel de logos: bucle continuo a ancho completo
const marquee = document.querySelector('.marquee');
if (marquee) {
  const track = marquee.querySelector('.marquee__track');
  const groups = track.querySelectorAll('.marquee__group');
  const base = [...groups[0].children];
  const SPEED = 55; // px por segundo
  const fill = () => {
    // Cada mitad del track debe cubrir al menos el ancho de la pantalla para que el bucle no deje huecos
    let guard = 0;
    while (groups[0].scrollWidth < window.innerWidth && guard++ < 10) {
      base.forEach((li) => groups.forEach((g, i) => {
        const copy = li.cloneNode(true);
        if (i === 0) { copy.setAttribute('aria-hidden', 'true'); copy.querySelector('img').alt = ''; }
        g.appendChild(copy);
      }));
    }
    track.style.setProperty('--marquee-duration', Math.round(groups[0].scrollWidth / SPEED) + 's');
  };
  fill();
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fill, 200); });
}

// Muro de testimonios: cada mitad de la columna debe ser más alta que la ventana para que el bucle no deje huecos
const wall = document.querySelector('.wall');
if (wall) {
  const SPEEDS = [26, 21, 24]; // px por segundo, distinto por columna para que no se muevan al unísono
  const fillWall = () => {
    const h = wall.clientHeight;
    wall.querySelectorAll('.wall__col').forEach((col, idx) => {
      if (!col.offsetParent) return; // columna oculta en este ancho
      const groups = col.querySelectorAll('.wall__group');
      const base = [...groups[0].children].slice(0, 3);
      let guard = 0;
      while (groups[0].scrollHeight < h && guard++ < 6) {
        base.forEach((li) => groups.forEach((g, i) => {
          const copy = li.cloneNode(true);
          if (i === 0) copy.setAttribute('aria-hidden', 'true');
          g.appendChild(copy);
        }));
      }
      col.style.setProperty('--wall-duration', Math.round(groups[0].scrollHeight / SPEEDS[idx]) + 's');
    });
  };
  fillWall();
  let wt;
  window.addEventListener('resize', () => { clearTimeout(wt); wt = setTimeout(fillWall, 200); });
  // No animar fuera de pantalla
  const voices = wall.closest('.voices');
  if (voices && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => voices.classList.toggle('is-offscreen', !e.isIntersecting)).observe(voices);
  }
}

// Botones de pausa (WCAG 2.2.2): logos y testimonios
document.querySelectorAll('.marquee-pause').forEach((btn) => {
  btn.addEventListener('click', () => {
    const paused = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? btn.dataset.play : btn.dataset.pause);
    btn.closest('.trust, .voices').classList.toggle('is-paused', paused);
  });
});
