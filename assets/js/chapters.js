/* chapters.js · índice de capítulos con el activo marcado ([data-chapters]).
   Marcado: un contenedor [data-chapters] con enlaces `.chapters__nav a[href="#id"]` y artículos `.chapter` con esos ids.
   Al bajar, el enlace del capítulo que ocupa la franja central de la pantalla recibe .is-active y aria-current="true".
   Sin JS el índice sigue funcionando como enlaces de ancla. No anima nada, así que no depende de prefers-reduced-motion. */

const root = document.querySelector('[data-chapters]');
if (root && 'IntersectionObserver' in window) {
  const links = new Map();
  root.querySelectorAll('.chapters__nav a[href^="#"]').forEach((a) => {
    const target = document.getElementById(a.getAttribute('href').slice(1));
    if (target) links.set(target, a);
  });

  const setActive = (target) => {
    links.forEach((a, t) => {
      const on = t === target;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  };

  // franja central: un capítulo se activa cuando cruza el 40 % superior-medio de la pantalla
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setActive(e.target); });
  }, { rootMargin: '-35% 0px -55% 0px' });
  links.forEach((_, t) => io.observe(t));
}
