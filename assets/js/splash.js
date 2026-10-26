/* splash.js · Home. Splash de entrada ([data-splash]): logo y línea de carga cian que suben como telón.
   - Lo activa el script del <head> (clase .has-splash en <html>): una vez por sesión (sessionStorage 'icorp-splash')
     y nunca con prefers-reduced-motion. La animación es solo CSS (sección 05) y termina antes de 1,5 s.
   - Este módulo quita el nodo al terminar, o enseguida si no se mostró.
   Sin dependencias de otros archivos de JS. */

const splash = document.querySelector('[data-splash]');
if (splash) {
  const root = document.documentElement;
  const done = () => { splash.remove(); root.classList.remove('has-splash'); };
  if (!root.classList.contains('has-splash')) done();
  else {
    splash.addEventListener('animationend', (e) => { if (e.target === splash) done(); });
    setTimeout(done, 1600); // por si el módulo carga cuando la animación ya terminó
  }
}
