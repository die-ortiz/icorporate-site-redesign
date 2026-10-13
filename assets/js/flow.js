/* flow.js · diagrama de integraciones de Tech Solutions (.flow con .flow__mid y su <svg>).
   Dibuja las líneas desde cada herramienta hasta el borde del iBot y anima destellos con cola degradada.
   Respeta prefers-reduced-motion (deja las líneas tenues sin animación). */

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
