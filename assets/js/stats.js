/* stats.js · cifras (.stat b y [data-count]): cuentan de 0 al valor final al entrar en pantalla.
   El valor final queda en un .sr-only para lectores de pantalla; el prefijo/sufijo "+" se colorea aparte
   (.stat__plus). Sin movimiento (prefers-reduced-motion) muestra el valor final directamente. */

// Cifras: cuentan de 0 al valor final al entrar en pantalla (el valor final queda para lectores de pantalla)
const statNumbers = document.querySelectorAll('.stat b, [data-count]');
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
    const grid = statNumbers[0].closest('.stats, .metric-cards');
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { items.forEach((it, i) => run(it, i * 120)); obs.disconnect(); }
    }, { threshold: 0.35 }).observe(grid);
  }
}
