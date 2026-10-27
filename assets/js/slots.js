/* slots.js · Pedido de llamada en el formulario de contacto del Home ([data-slot]). No es una reserva: el visitante pide
   un día hábil y una franja (mañana o tarde, en hora de Miami) y el equipo confirma por correo o WhatsApp.
   - Genera los próximos 10 días hábiles como opciones redondas ([data-slot-days]: día de la semana y número; el mes va
     en texto para lectores de pantalla y en el title), en el idioma de la página.
   - Muestra la franja elegida convertida a la zona horaria del visitante ([data-slot-tz]) cuando no es la de Miami.
   - [data-want-call] (la tarjeta "Book a call" del contacto) marca el pedido de llamada y lleva el foco al formulario.
   El panel se abre con CSS (:has(:checked)); sin JS no hay días para elegir y el formulario sigue funcionando.
   Sin dependencias de otros archivos de JS. */

const slot = document.querySelector('[data-slot]');
if (slot) {
  const TZ = 'America/New_York';
  const lang = (document.documentElement.lang || 'en').slice(0, 2) === 'es' ? 'es' : 'en-US';
  const toggle = slot.querySelector('input[name="call"]');
  const days = slot.querySelector('[data-slot-days]');
  const tzNote = slot.querySelector('[data-slot-tz]');
  const baseNote = tzNote.textContent;

  // próximos 10 días hábiles a partir de mañana (fecha de Miami)
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  const fmtDay = new Intl.DateTimeFormat(lang, { weekday: 'short' });
  const fmtNum = new Intl.DateTimeFormat(lang, { day: 'numeric' });
  const fmtMonth = new Intl.DateTimeFormat(lang, { month: 'long' });
  const fmtFull = new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short' });
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let n = 0; n < 10;) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = document.createElement('label');
    label.className = 'slot__day';
    label.innerHTML = '<input type="radio" name="day"><span><small></small><b></b><i class="sr-only"></i></span>';
    const input = label.querySelector('input');
    input.value = iso;
    input.dataset.label = fmtFull.format(d);
    label.title = fmtFull.format(d);
    label.querySelector('small').textContent = fmtDay.format(d);
    label.querySelector('b').textContent = fmtNum.format(d);
    label.querySelector('i').textContent = fmtMonth.format(d);
    days.appendChild(label);
    n++;
  }

  // hora de Miami (día y hora) -> instante UTC, con el desfase real de esa fecha (horario de verano incluido)
  const miamiToDate = (iso, hour) => {
    const [y, m, dd] = iso.split('-').map(Number);
    const guess = new Date(Date.UTC(y, m - 1, dd, hour));
    const asMiami = new Date(guess.toLocaleString('en-US', { timeZone: TZ }));
    const asUtc = new Date(guess.toLocaleString('en-US', { timeZone: 'UTC' }));
    return new Date(guess.getTime() + (asUtc - asMiami));
  };

  const visitorTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const sameZone = new Date().toLocaleString('en-US', { timeZone: visitorTz }) === new Date().toLocaleString('en-US', { timeZone: TZ });
  const fmtTime = new Intl.DateTimeFormat(lang, { hour: 'numeric', minute: '2-digit' });
  const city = visitorTz.split('/').pop().replace(/_/g, ' ');

  const update = () => {
    const day = slot.querySelector('input[name="day"]:checked');
    const win = slot.querySelector('input[name="window"]:checked');
    if (!day || !win || sameZone) { tzNote.textContent = baseNote; return; }
    const [from, to] = win.value.split('-').map((t) => parseInt(t, 10));
    const range = `${fmtTime.format(miamiToDate(day.value, from))}–${fmtTime.format(miamiToDate(day.value, to))}`;
    tzNote.textContent = lang === 'es' ? `${baseNote} En tu zona (${city}): ${range}.` : `${baseNote} In your time zone (${city}): ${range}.`;
  };
  slot.addEventListener('change', update);

  // "Book a call" del lado izquierdo: marca el pedido y lleva al primer día
  document.querySelectorAll('[data-want-call]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    toggle.checked = true;
    slot.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    const first = days.querySelector('input');
    (first || toggle).focus({ preventScroll: true });
  }));
}
