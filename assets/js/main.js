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

// Submenú de Services (escritorio): abre con hover, foco o clic en la flecha; cierra con Esc o clic fuera
const subItem = document.querySelector('.nav__item.has-sub');
if (subItem) {
  const caret = subItem.querySelector('.nav__caret');
  const desktop = window.matchMedia('(min-width: 1020px)');
  let closeTimer;
  const setSub = (open) => {
    clearTimeout(closeTimer);
    const on = open && desktop.matches;
    subItem.classList.toggle('is-open', on);
    caret.setAttribute('aria-expanded', String(on));
    if (header) header.classList.toggle('is-mega', on);
  };
  subItem.addEventListener('mouseenter', () => setSub(true));
  subItem.addEventListener('mouseleave', () => { closeTimer = setTimeout(() => setSub(false), 280); });
  subItem.addEventListener('focusin', () => setSub(true));
  subItem.addEventListener('focusout', (e) => { if (!subItem.contains(e.relatedTarget)) setSub(false); });
  caret.addEventListener('click', () => setSub(!subItem.classList.contains('is-open')));
  document.addEventListener('click', (e) => { if (!subItem.contains(e.target)) setSub(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && subItem.classList.contains('is-open')) { setSub(false); caret.focus(); }
  });
  desktop.addEventListener('change', () => setSub(false));
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

// Video de fondo del hero: solo si hay archivo, sin movimiento reducido, sin ahorro de datos y en pantallas >= 768px
const heroVideo = document.querySelector('.hero__video');
if (heroVideo) {
  const hero = heroVideo.closest('.hero');
  const saveData = navigator.connection && navigator.connection.saveData;
  const allowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && window.matchMedia('(min-width: 768px)').matches && !saveData;
  if (allowed) {
    heroVideo.addEventListener('loadeddata', () => {
      heroVideo.play().then(() => hero.classList.add('has-video')).catch(() => {});
    }, { once: true });
    heroVideo.src = heroVideo.dataset.src;
    heroVideo.load();
  }
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

// Formulario de contacto: correo directo. Arma un mailto con los datos y abre el correo del usuario.
// (En producción se puede reemplazar por un endpoint PHP en el servidor sin tocar el HTML.)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const status = contactForm.querySelector('.contact__status');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = contactForm.elements;
    const required = [f.first, f.email, f.message];
    let firstBad = null;
    required.forEach((el) => {
      const bad = !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value.trim()));
      el.setAttribute('aria-invalid', String(bad));
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      status.textContent = contactForm.dataset.err; status.classList.add('is-error'); firstBad.focus();
      return;
    }
    const name = `${f.first.value.trim()} ${f.last.value.trim()}`.trim();
    const lines = [
      `${f.first.labels[0].textContent}: ${name}`,
      `${f.company.labels[0].textContent}: ${f.company.value.trim()}`,
      `${f.phone.labels[0].textContent}: ${f.phone.value.trim()}`,
      `${f.email.labels[0].textContent}: ${f.email.value.trim()}`,
      `${f.by.labels[0].textContent}: ${f.by.value}`,
      `${f.service.labels[0].textContent}: ${f.service.value}`,
      '', f.message.value.trim(),
    ];
    const subject = `${contactForm.dataset.subject} - ${name}`;
    const href = `mailto:${contactForm.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    status.textContent = contactForm.dataset.ok; status.classList.remove('is-error');
    window.location.href = href;
  });
  contactForm.addEventListener('input', (e) => { if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false'); });
}
