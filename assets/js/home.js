/* home.js · comportamientos exclusivos del Home. Cargar solo en index.html (EN y ES).
   - .marquee: carrusel de logos de clientes en bucle continuo.
   - .wall: muro de testimonios en columnas verticales en bucle.
   - [data-flagship-slides]: carrusel de fotos de la tarjeta destacada (fundido, puntos, 4 s por foto, pausa al
     pasar el mouse o enfocar; sin avance automático con movimiento reducido). */

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

// Tarjeta destacada del Home: carrusel de fotos con fundido, puntos y avance automático (pausa al pasar el mouse o enfocar)
document.querySelectorAll('[data-flagship-slides]').forEach((box) => {
  const slides = [...box.querySelectorAll('.flagship__photo')];
  const dots = [...box.parentElement.querySelectorAll('.flagship__dot')];
  if (slides.length < 2) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0, timer = null;
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => { d.classList.toggle('is-active', k === i); d.setAttribute('aria-current', String(k === i)); });
  };
  const stop = () => { clearInterval(timer); timer = null; };
  const play = () => { if (!still && !timer) timer = setInterval(() => show(i + 1), 4000); };
  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); stop(); }));
  const media = box.parentElement;
  media.addEventListener('mouseenter', stop);
  media.addEventListener('mouseleave', play);
  media.addEventListener('focusin', stop);
  media.addEventListener('focusout', play);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
  play();
});
