/* cycle.js · ciclo del evento de Events Management ([data-cycle]).
   Pestañas accesibles (clic y flechas/Home/End) con línea de progreso (--cy) y la figura del logo como marcador. */

// Ciclo del evento (Events Management): pestañas con línea de progreso y la figura del logo como marcador
document.querySelectorAll('[data-cycle]').forEach((cycle) => {
  const tabs = [...cycle.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const last = tabs.length - 1;
  const select = (i, focus) => {
    cycle.style.setProperty('--cy', String(i / last));
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
      t.classList.toggle('is-done', k < i);
      panels[k].hidden = k !== i;
    });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: last }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(Math.min(last, Math.max(0, next)), true);
    });
  });
  cycle.classList.add('is-ready');
  select(0);
});
