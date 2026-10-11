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

// Desplegables de servicio (escritorio): abren con hover, foco o clic en la flecha; cierran con Esc o clic fuera
const subItems = document.querySelectorAll('.nav__item.has-sub');
if (subItems.length) {
  const desktop = window.matchMedia('(min-width: 1200px)');
  const syncHeader = () => {
    if (header) header.classList.toggle('is-mega', [...subItems].some((el) => el.classList.contains('is-open')));
  };
  const closeAll = (except) => subItems.forEach((el) => { if (el !== except) setSub(el, false); });
  const timers = new Map();
  function setSub(item, open) {
    clearTimeout(timers.get(item));
    const on = open && desktop.matches;
    if (on) closeAll(item);
    item.classList.toggle('is-open', on);
    item.querySelector('.nav__caret').setAttribute('aria-expanded', String(on));
    syncHeader();
  }
  subItems.forEach((item) => {
    const caret = item.querySelector('.nav__caret');
    item.addEventListener('mouseenter', () => setSub(item, true));
    item.addEventListener('mouseleave', () => timers.set(item, setTimeout(() => setSub(item, false), 200)));
    item.addEventListener('focusin', () => setSub(item, true));
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

// Video de fondo del hero: solo si hay archivo, sin movimiento reducido, sin ahorro de datos y en pantallas >= 768px
const heroVideo = document.querySelector('.hero__video');
if (heroVideo) {
  const hero = heroVideo.closest('.hero, .page-hero');
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

// Orbe de fondo (WebGL) en la cabecera de Tech Solutions. Si falla, queda el fondo oscuro.
const orbEls = document.querySelectorAll('[data-orb]');
if (orbEls.length) {
  import('./orb.js')
    .then(({ initOrb }) => orbEls.forEach((el) => initOrb(el)))
    .catch(() => {});
}

// Diagrama de integraciones: líneas desde cada herramienta hasta el borde del iBot y destellos con cola degradada
document.querySelectorAll('.flow').forEach((flow) => {
  const mid = flow.querySelector('.flow__mid');
  const svg = mid && mid.querySelector('svg');
  const hub = flow.querySelector('.flow__tile--hub');
  if (!svg || !hub) return;
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAIL = 84; // largo del destello en px (un solo trazo con degradado, para que los colores viajen juntos)
  let routes = [];

  const mk = (cls) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('class', cls); svg.appendChild(p); return p; };
  const build = () => {
    const fr = flow.getBoundingClientRect();
    const mr = mid.getBoundingClientRect();
    const hr = hub.getBoundingClientRect();
    svg.style.cssText = `position:absolute;left:${fr.left - mr.left}px;top:${fr.top - mr.top}px;width:${fr.width}px;height:${fr.height}px;overflow:visible`;
    svg.setAttribute('viewBox', `0 0 ${fr.width} ${fr.height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.querySelectorAll('path, defs').forEach((p) => p.remove());
    const defs = document.createElementNS(NS, 'defs');
    svg.appendChild(defs);
    const hy = hr.top + hr.height / 2 - fr.top;
    routes = [];
    flow.querySelectorAll('.flow__col').forEach((col, ci) => {
      col.querySelectorAll('.flow__tile').forEach((tile, i) => {
        const tr = tile.getBoundingClientRect();
        const left = ci === 0;
        const x0 = (left ? tr.right : tr.left) - fr.left;
        const y0 = tr.top + tr.height / 2 - fr.top;
        const x1 = (left ? hr.left : hr.right) - fr.left + (left ? 2 : -2);
        const dx = (x1 - x0) / 2;
        const d = `M${x0} ${y0} C${x0 + dx} ${y0} ${x1 - dx} ${hy} ${x1} ${hy}`;
        mk('flow__path').setAttribute('d', d);
        const id = `flow-grad-${ci}-${i}`;
        const grad = document.createElementNS(NS, 'linearGradient');
        grad.setAttribute('id', id);
        grad.setAttribute('gradientUnits', 'userSpaceOnUse');
        [['0', '#037FD9', 0], ['0.55', '#06BDE7', 0.75], ['1', '#e6fbff', 1]].forEach(([o, col, op]) => {
          const st = document.createElementNS(NS, 'stop');
          st.setAttribute('offset', o); st.setAttribute('stop-color', col); st.setAttribute('stop-opacity', op);
          grad.appendChild(st);
        });
        defs.appendChild(grad);
        const comet = mk('flow__comet');
        comet.setAttribute('d', d);
        comet.setAttribute('stroke', `url(#${id})`);
        comet.setAttribute('stroke-width', 4.5);
        comet.setAttribute('fill', 'none');
        comet.setAttribute('stroke-dasharray', `${TAIL} 100000`);
        routes.push({ comet, grad, len: comet.getTotalLength(), delay: (ci * 3 + i) * 0.37 });
      });
    });
  };

  // Velocidad constante (px/s) para todas las líneas: sin aceleración ni frenado al salir de la herramienta
  const SPEED = 230;
  const GAP = 140; // espacio muerto entre un destello y el siguiente, en px de recorrido
  const frame = (now) => {
    const t = now / 1000;
    routes.forEach((r) => {
      const cycle = r.len + TAIL + GAP;
      const head = ((((t - r.delay) * SPEED) % cycle) + cycle) % cycle; // la cabeza avanza en línea recta, de 0 a len + cola
      const tip = Math.min(head, r.len);
      const back = Math.max(0, head - TAIL);
      const pt = r.comet.getPointAtLength(tip);
      const pb = r.comet.getPointAtLength(Math.min(back, r.len));
      r.grad.setAttribute('x1', pb.x); r.grad.setAttribute('y1', pb.y);
      r.grad.setAttribute('x2', pt.x); r.grad.setAttribute('y2', pt.y);
      r.comet.setAttribute('stroke-dashoffset', TAIL - head); // tramo visible [head - cola, head], recortado en los extremos
    });
  };

  build();
  if (reduce) return; // sin movimiento: quedan las líneas tenues
  let raf = null;
  const loop = (now) => { frame(now); raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && raf === null) raf = requestAnimationFrame(loop);
    else if (!en.isIntersecting && raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.05 }).observe(flow);
  if ('ResizeObserver' in window) new ResizeObserver(build).observe(flow);
  else window.addEventListener('resize', build);
});

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

// Cifras: cuentan de 0 al valor final al entrar en pantalla (el valor final queda para lectores de pantalla)
const statNumbers = document.querySelectorAll('.stat b');
if (statNumbers.length) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n, sep) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  // El prefijo (+) va en su propio <span> para poder darle color
  const plus = (ch) => { const p = document.createElement('span'); p.className = 'stat__plus'; p.textContent = ch; return p; };
  const paint = (it, text) => {
    it.live.textContent = '';
    if (it.prefix) it.live.appendChild(plus(it.prefix));
    // sufijo: la "K" va con el número y un "+" final (formato inglés: 100+, 25K+) se colorea aparte
    const m = it.suffix.match(/^(.*?)(\+?)$/);
    it.live.appendChild(document.createTextNode(text + m[1]));
    if (m[2]) it.live.appendChild(plus(m[2]));
  };
  const items = [...statNumbers].map((el) => {
    const m = el.textContent.trim().match(/^(\D*)([\d.,]+)(\D*)$/);
    if (!m) return null;
    const sep = (m[2].match(/\D/) || [''])[0];
    const target = parseInt(m[2].replace(/\D/g, ''), 10);
    // Lectores de pantalla leen el valor final; el número que se anima queda oculto para ellos
    const live = document.createElement('span');
    live.setAttribute('aria-hidden', 'true');
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = el.textContent.trim();
    el.textContent = '';
    el.append(live, sr);
    const it = { live, prefix: m[1], suffix: m[3], target, sep };
    paint(it, fmt(target, sep));
    return it;
  }).filter(Boolean);

  const run = (it, delay) => {
    const dur = 1800;
    setTimeout(() => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        paint(it, fmt(Math.round(it.target * eased), it.sep));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
  };

  if (!reduce && 'IntersectionObserver' in window) {
    items.forEach((it) => paint(it, '0'));
    const grid = statNumbers[0].closest('.stats');
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { items.forEach((it, i) => run(it, i * 120)); obs.disconnect(); }
    }, { threshold: 0.35 }).observe(grid);
  }
}


// Formulario de propuesta (páginas de servicio): correo directo con todos los campos etiquetados
const proposalForm = document.getElementById('proposal-form');
if (proposalForm) {
  const status = proposalForm.querySelector('.contact__status');
  proposalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const required = [...proposalForm.querySelectorAll('[required]')];
    let firstBad = null;
    required.forEach((el) => {
      const bad = !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value.trim()));
      el.setAttribute('aria-invalid', String(bad));
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      status.textContent = proposalForm.dataset.err; status.classList.add('is-error'); firstBad.focus();
      return;
    }
    const lines = [...proposalForm.querySelectorAll('input, select, textarea')]
      .filter((el) => el.name && el.value.trim() && el.name !== 'brief')
      .map((el) => `${el.labels[0].textContent}: ${el.value.trim()}`);
    const brief = proposalForm.elements.brief.value.trim();
    const name = proposalForm.elements.name.value.trim();
    const subject = `${proposalForm.dataset.subject} - ${name}`;
    const body = `${lines.join('\n')}\n\n${brief}`;
    status.textContent = proposalForm.dataset.ok; status.classList.remove('is-error');
    window.location.href = `mailto:${proposalForm.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  proposalForm.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false'); });
}
