/* formats.js · formatos de evento ([data-formats], Events): cada fila [data-format] elige la foto .formats__slide del
   mismo índice al pasar el mouse (marca .is-active en ambas). Mientras nadie interactúa avanza sola cada 5 s, solo en
   pantalla y con la pestaña visible (.is-auto en el contenedor dibuja la barra de tiempo); el primer hover la detiene.
   Sin avance automático con prefers-reduced-motion. En móvil (< 900 px) no hace nada visible: cada fila tiene su foto. */

const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DELAY = 5000;

document.querySelectorAll('[data-formats]').forEach((box) => {
  const items = [...box.querySelectorAll('[data-format]')];
  const slides = [...box.querySelectorAll('.formats__slide')];
  if (items.length < 2 || items.length !== slides.length) return;
  let i = 0, timer = null, visible = false, auto = !still;

  box.style.setProperty('--formats-delay', `${DELAY}ms`);
  const show = (n) => {
    i = (n + items.length) % items.length;
    items.forEach((el, k) => el.classList.toggle('is-active', k === i));
    slides.forEach((el, k) => el.classList.toggle('is-active', k === i));
  };
  const stop = () => { clearInterval(timer); timer = null; box.classList.remove('is-auto'); };
  const play = () => {
    if (!auto || timer || !visible || document.hidden) return;
    show(i); // reinicia la barra de tiempo de la fila activa
    box.classList.add('is-auto');
    timer = setInterval(() => show(i + 1), DELAY);
  };

  items.forEach((el, k) => el.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    auto = false; stop(); show(k);
  }));
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? play() : stop(); }, { threshold: .35 }).observe(box);
});
