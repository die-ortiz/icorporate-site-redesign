/* showcase.js · vitrina de Tech Solutions ([data-showcase]): parallax suave con el scroll.
   Cada elemento con data-depth se desplaza en vertical según su profundidad (negativa = en sentido contrario);
   entra desplazado hacia abajo y sube hasta su posición de reposo, así nunca se recorta contra el borde superior;
   con data-axis="x" se desplaza en horizontal (palabra fantasma). Se escribe en --py / --px y el CSS aplica
   `translate`, así no pisa el `rotate` de cada dispositivo. Solo corre mientras la sección está en pantalla.
   Sin movimiento (prefers-reduced-motion) los elementos quedan en su posición de reposo. */

const sections = document.querySelectorAll('[data-showcase]');
if (sections.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  sections.forEach((section) => {
    const items = [...section.querySelectorAll('[data-depth]')].map((el) => ({
      el,
      depth: Number(el.dataset.depth) || 0,
      prop: el.dataset.axis === 'x' ? '--px' : '--py',
    }));
    let raf = null;
    let visible = false;
    let center = 0; // posición del centro de la sección en la página (se mide al cargar y al cambiar de tamaño, no por fotograma)
    const measure = () => { center = section.getBoundingClientRect().top + window.scrollY + section.offsetHeight / 2; };

    const update = () => {
      raf = null;
      // 1 con la sección entrando por abajo, 0 centrada, -1 saliendo por arriba
      const p = Math.max(-1, Math.min(1, (center - window.scrollY - window.innerHeight / 2) / window.innerHeight));
      const amp = window.innerWidth < 900 ? 50 : 110; // menos recorrido en pantallas chicas
      items.forEach(({ el, depth, prop }) => el.style.setProperty(prop, `${(p * depth * amp).toFixed(1)}px`));
    };
    const request = () => { if (visible && raf === null) raf = requestAnimationFrame(update); };

    measure();
    window.addEventListener('load', () => { measure(); request(); }, { once: true });
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', () => { measure(); request(); });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) request();
    }, { rootMargin: '10% 0px' }).observe(section);
  });
}
