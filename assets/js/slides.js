/* slides.js · carrusel de fotos con fundido ([data-slides]): las <img> hijas directas se alternan con la clase
   .is-active y los botones [data-dot] del mismo contenedor padre las eligen (marcan .is-active y aria-current).
   El valor del atributo es el tiempo por foto en ms (por defecto 4000). Pausa al pasar el mouse, al enfocar, con la
   pestaña oculta y fuera de pantalla; sin avance automático con prefers-reduced-motion (los puntos siguen funcionando).
   Lo usan la tarjeta destacada del Home (.flagship) y el testimonio destacado de Events (.feature-quote). */

const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('[data-slides]').forEach((box) => {
  const slides = [...box.querySelectorAll(':scope > img')];
  const media = box.parentElement;
  const dots = [...media.querySelectorAll('[data-dot]')];
  if (slides.length < 2) return;
  const delay = Number(box.dataset.slides) || 4000;
  let i = 0, timer = null, hover = false, visible = true;

  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => { d.classList.toggle('is-active', k === i); d.setAttribute('aria-current', String(k === i)); });
  };
  const stop = () => { clearInterval(timer); timer = null; };
  const play = () => {
    if (still || timer || hover || !visible || document.hidden) return;
    timer = setInterval(() => show(i + 1), delay);
  };

  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); stop(); }));
  media.addEventListener('mouseenter', () => { hover = true; stop(); });
  media.addEventListener('mouseleave', () => { hover = false; play(); });
  media.addEventListener('focusin', () => { hover = true; stop(); });
  media.addEventListener('focusout', () => { hover = false; play(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : stop(); }).observe(media);
});
