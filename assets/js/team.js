/* team.js · About. Equipo en "spotlight" ([data-team]): una persona por vez, elegida con las miniaturas
   (.team-spot__thumb, patrón de pestañas: flechas del teclado, Inicio y Fin) o con las flechas del escenario.
   - Avanza solo cada 7 s mientras se ve en pantalla; se pausa con el mouse o el foco encima y se detiene al primer
     uso manual. Sin avance automático con prefers-reduced-motion.
   - Sin JS (o si este módulo falla) se ven todas las personas una debajo de otra.
   Sin dependencias de otros archivos de JS. */

const spot = document.querySelector('[data-team]');
if (spot) {
  const slides = [...spot.querySelectorAll('.team-spot__slide')];
  const thumbs = [...spot.querySelectorAll('.team-spot__thumb')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = Math.max(0, slides.findIndex((s) => s.classList.contains('is-active')));
  let timer = null, auto = !reduced, visible = false, hovered = false;

  const show = (i, focus) => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === current));
    thumbs.forEach((t, k) => {
      const on = k === current;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    const t = thumbs[current];
    if (focus) t.focus();
    // la miniatura activa queda a la vista cuando la tira se desliza (móvil)
    const strip = t.parentElement;
    strip.scrollTo({ left: t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  };

  const stop = () => { clearInterval(timer); timer = null; };
  const play = () => { stop(); if (auto && visible && !hovered) timer = setInterval(() => show(current + 1), 7000); };
  const manual = (i, focus) => { auto = false; stop(); show(i, focus); };

  thumbs.forEach((t, k) => {
    t.addEventListener('click', () => manual(k));
    t.addEventListener('keydown', (e) => {
      const to = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: slides.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault(); manual(to, true);
    });
  });
  spot.querySelector('.team-spot__nav--prev').addEventListener('click', () => manual(current - 1));
  spot.querySelector('.team-spot__nav--next').addEventListener('click', () => manual(current + 1));

  spot.addEventListener('pointerenter', () => { hovered = true; stop(); });
  spot.addEventListener('pointerleave', () => { hovered = false; play(); });
  spot.addEventListener('focusin', () => { hovered = true; stop(); });
  spot.addEventListener('focusout', (e) => { if (!spot.contains(e.relatedTarget)) { hovered = false; play(); } });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) play(); else stop(); }, { threshold: 0.35 }).observe(spot);

  spot.classList.add('is-ready');
}
