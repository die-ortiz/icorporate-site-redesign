/* backgrounds.js · fondos opcionales de las cabeceras. Cargar solo donde haya [data-*] o .hero__video.
   - Video de fondo del hero (.hero__video con data-src): solo si hay archivo, sin movimiento reducido,
     sin ahorro de datos y en pantallas >= 768 px.
   - [data-siderays]: rayos WebGL (importa ./siderays.js); si falla queda el degradado CSS.
   - [data-orb]: orbe WebGL (importa ./orb.js); si falla queda el fondo oscuro.
   - [data-grid]: malla de señales WebGL de Tech Solutions (importa ./grid.js); si falla queda el fondo oscuro. */

// Video de fondo del hero: solo si hay archivo, sin movimiento reducido, sin ahorro de datos y en pantallas >= 768px
const heroVideo = document.querySelector('.hero__video');
if (heroVideo) {
  const hero = heroVideo.closest('.hero, .page-hero');
  const saveData = navigator.connection && navigator.connection.saveData;
  const allowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && window.matchMedia('(min-width: 768px)').matches && !saveData;
  if (allowed) {
    heroVideo.addEventListener('loadeddata', () => {
      heroVideo.play().then(() => hero.classList.add('has-video')).catch(() => {});
    }, { once: true });
    heroVideo.src = heroVideo.dataset.src;
    heroVideo.load();
  }
}

// Fondos de rayos (WebGL). Si falla, queda el degradado CSS.
const rayEls = document.querySelectorAll('[data-siderays]');
if (rayEls.length) {
  import('./siderays.js')
    .then(({ initSideRays }) => {
      rayEls.forEach((el) => initSideRays(el, { origin: el.dataset.origin || 'top-right', intensity: Number(el.dataset.intensity || 2) }));
    })
    .catch(() => {});
}

// Orbe de fondo (WebGL) en la cabecera de Tech Solutions. Si falla, queda el fondo oscuro.
const orbEls = document.querySelectorAll('[data-orb]');
if (orbEls.length) {
  import('./orb.js')
    .then(({ initOrb }) => orbEls.forEach((el) => initOrb(el)))
    .catch(() => {});
}

// Malla de señales (WebGL) en la cabecera de Tech Solutions. Si falla, queda el fondo oscuro.
const gridEls = document.querySelectorAll('[data-grid]');
if (gridEls.length) {
  import('./grid.js')
    .then(({ initGrid }) => gridEls.forEach((el) => initGrid(el)))
    .catch(() => {});
}
