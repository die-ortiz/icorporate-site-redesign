/* stats.js · cifras con rodillos (.stat b y [data-count]): cada dígito gira como el rodillo de una tragamonedas y
   frena en su valor al entrar en pantalla, de izquierda a derecha, con un rebote corto. Separadores, "K", "%" y "+"
   quedan fijos; el "+" se colorea aparte (.stat__plus). El valor final queda en un .sr-only para lectores de pantalla.
   Estilos en "Cifras: rodillos" (styles.css). Sin movimiento (prefers-reduced-motion) el número queda fijo como está. */

const statNumbers = document.querySelectorAll('.stat b, [data-count]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (statNumbers.length && !reduce && 'IntersectionObserver' in window) {
  const span = (cls, text) => { const s = document.createElement('span'); s.className = cls; if (text != null) s.textContent = text; return s; };

  // Arma la cifra: prefijo/sufijo fijos y un rodillo por dígito. Devuelve los rodillos con su posición final.
  const build = (el) => {
    const text = el.textContent.trim();
    const m = text.match(/^(\D*)([\d.,]+)(\D*)$/);
    if (!m) return null;
    const live = span('reels');
    live.setAttribute('aria-hidden', 'true');
    const reels = [];
    if (m[1]) live.appendChild(span(m[1] === '+' ? 'stat__plus' : 'reel__fix', m[1]));
    [...m[2]].forEach((c) => {
      if (!/\d/.test(c)) { live.appendChild(span('reel__fix', c)); return; }
      const d = +c;
      const i = reels.length;
      const turns = 1 + i; // los de la derecha dan más vueltas y frenan después
      const strip = span('reel__strip');
      // 0-9 por cada vuelta, luego 0..d, y un dígito más para que el rebote no muestre un hueco
      for (let k = 0; k < turns * 10 + d + 2; k++) strip.appendChild(span('', String(k % 10)));
      const reel = span('reel');
      reel.appendChild(strip);
      live.appendChild(reel);
      reels.push({ strip, stop: turns * 10 + d, i });
    });
    const tail = m[3].match(/^(.*?)(\+?)$/);
    if (tail[1]) live.appendChild(span('reel__fix', tail[1]));
    if (tail[2]) live.appendChild(span('stat__plus', tail[2]));
    el.textContent = '';
    el.append(live, span('sr-only', text));
    return reels;
  };

  // Cifras con texto en degradado (background-clip: text): el navegador no pinta el degradado sobre las tiras que se
  // mueven (y al pasar el mouse por la tarjeta deja restos de las tiras), así que cada dígito y cada signo fijo llevan
  // su tramo del degradado de la cifra, y la cifra deja de usar el suyo.
  const tint = (el, reels) => {
    const cs = getComputedStyle(el);
    if (!/text/.test(cs.backgroundClip + cs.webkitBackgroundClip) || cs.backgroundImage === 'none') return;
    const box = el.getBoundingClientRect();
    const paint = (d, x) => Object.assign(d.style, {
      backgroundImage: cs.backgroundImage, backgroundSize: `${box.width}px ${box.height}px`,
      backgroundPosition: `${-x}px 0`, webkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
    });
    reels.forEach((r) => {
      const x = r.strip.getBoundingClientRect().left - box.left;
      r.strip.querySelectorAll('span').forEach((d) => paint(d, x));
    });
    el.querySelectorAll('.reels > .reel__fix').forEach((d) => paint(d, d.getBoundingClientRect().left - box.left));
    Object.assign(el.style, { backgroundImage: 'none', webkitBackgroundClip: 'border-box', backgroundClip: 'border-box' });
  };

  const spin = (el, reels, delay) => {
    tint(el, reels);
    reels.forEach((r) => {
      r.strip.style.transitionDuration = `${2000 + r.i * 400}ms`;
      r.strip.style.transitionDelay = `${delay}ms`;
      r.strip.style.setProperty('--stop', r.stop);
    });
  };

  // Cada grupo (.stats o .metric-cards) arranca al entrar en pantalla; sin umbral de área para que un grupo
  // más alto que la ventana (móvil, tarjetas apiladas) no se quede quieto.
  const groups = new Map();
  statNumbers.forEach((el) => {
    const reels = build(el);
    if (!reels) return;
    const g = el.closest('.stats, .metric-cards') || el;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push([el, reels]);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      groups.get(e.target).forEach(([el, reels], n) => spin(el, reels, n * 250));
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  groups.forEach((_, g) => io.observe(g));
}
