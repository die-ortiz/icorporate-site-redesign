/* core.js · se carga en TODAS las páginas.
   - Cabecera: pasa de transparente a sólida con el scroll (escribe --scroll-p y .is-scrolled en .site-header).
   - Mega-menú de escritorio: abre solo con clic (.nav__item.has-sub, .nav__caret); .is-mega en la cabecera.
   - Menú móvil (.menu-toggle + #site-nav).
   - Entrada suave de secciones (.reveal -> .in, con IntersectionObserver).
   Sin dependencias de otros archivos de JS. */

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

// Desplegables de servicio (escritorio): abren solo con clic (en el nombre o en la flecha; en el nombre, Ctrl/Cmd/Shift-clic sigue yendo a la página); cierran con Esc, clic fuera o al salir el foco
const subItems = document.querySelectorAll('.nav__item.has-sub');
if (subItems.length) {
  const desktop = window.matchMedia('(min-width: 1200px)');
  const syncHeader = () => {
    if (header) header.classList.toggle('is-mega', [...subItems].some((el) => el.classList.contains('is-open')));
  };
  const closeAll = (except) => subItems.forEach((el) => { if (el !== except) setSub(el, false); });
  function setSub(item, open) {
    const on = open && desktop.matches;
    if (on) closeAll(item);
    item.classList.toggle('is-open', on);
    item.querySelector('.nav__caret').setAttribute('aria-expanded', String(on));
    syncHeader();
  }
  subItems.forEach((item) => {
    const caret = item.querySelector('.nav__caret');
    const label = item.querySelector(':scope > a');
    if (label) label.addEventListener('click', (e) => {
      if (!desktop.matches || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
      e.preventDefault();
      setSub(item, !item.classList.contains('is-open'));
    });
    item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) setSub(item, false); });
    caret.addEventListener('click', () => setSub(item, !item.classList.contains('is-open')));
  });
  document.addEventListener('click', (e) => { subItems.forEach((el) => { if (!el.contains(e.target)) setSub(el, false); }); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = [...subItems].find((el) => el.classList.contains('is-open'));
    if (open) { setSub(open, false); open.querySelector('.nav__caret').focus(); }
  });
  desktop.addEventListener('change', () => closeAll());
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
