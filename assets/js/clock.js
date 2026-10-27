/* clock.js · Hora local en vivo ([data-clock="Zona/IANA"], p. ej. la hora de Miami en la tarjeta de la oficina de About).
   Muestra hora y minutos en el formato del idioma de la página (EN: 3:42 PM, ES: 15:42) y se actualiza al cambiar el
   minuto. Sin JS queda el texto del marcado (la zona horaria abreviada). Sin dependencias de otros archivos de JS. */

const clocks = document.querySelectorAll('[data-clock]');
if (clocks.length) {
  const lang = (document.documentElement.lang || 'en').slice(0, 2) === 'es' ? 'es' : 'en-US';
  const tick = () => {
    const now = new Date();
    clocks.forEach((el) => {
      const tz = el.dataset.clock;
      el.textContent = now.toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit', timeZone: tz });
      el.dateTime = now.toISOString();
    });
    setTimeout(tick, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
  };
  tick();
}
