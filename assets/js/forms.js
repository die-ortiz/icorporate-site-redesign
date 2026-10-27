/* forms.js · formularios por correo directo (mailto), sin servicios externos. Cargar donde haya formulario.
   - #contact-form (Home) y #proposal-form (páginas de servicio) comparten el esquema: nombre, correo, empresa, píldoras,
     texto largo y pedido de llamada. Asunto, destinatario y mensajes salen de data-* del propio <form>.
   - [data-copy]: botón que copia un texto (el correo en las vías de contacto).
   En producción se puede reemplazar por un endpoint PHP sin tocar el HTML (cambiar solo el submit). */

// Formularios de contacto (#contact-form en el Home, #proposal-form en cada servicio): correo directo con el mismo esquema.
// Campos con nombre: texto (con su <label>), píldoras de radio (con la <legend> de su grupo) y, si se marcó, el pedido de
// llamada (día y franja en hora de Miami, de slots.js). El campo de texto largo (message o brief) va al final del cuerpo.
// Arma un mailto y abre el correo del usuario. (En producción, un endpoint PHP en el servidor sin tocar el HTML.)
const mailForm = (form) => {
  const status = form.querySelector('.contact__status');
  const long = form.querySelector('textarea[name]');
  const legendOf = (el) => el.closest('fieldset')?.querySelector('legend')?.textContent || el.name;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstBad = null;
    form.querySelectorAll('[required]').forEach((el) => {
      const bad = !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value.trim()));
      el.setAttribute('aria-invalid', String(bad));
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      status.textContent = form.dataset.err; status.classList.add('is-error'); firstBad.focus();
      return;
    }
    const lines = [];
    form.querySelectorAll('input[name], select[name]').forEach((el) => {
      if (['day', 'window', 'call'].includes(el.name)) return;
      if (el.type === 'radio') { if (el.checked) lines.push(`${legendOf(el)}: ${el.value}`); return; }
      if (el.value.trim()) lines.push(`${el.labels[0].textContent}: ${el.value.trim()}`);
    });
    const call = form.elements.call;
    if (call && call.checked) {
      const day = form.querySelector('input[name="day"]:checked'); const win = form.querySelector('input[name="window"]:checked');
      lines.push(`${call.labels[0].textContent}: ${day ? day.dataset.label : '-'} · ${win ? win.value : '-'} (Miami, ET)`);
    }
    const name = form.elements.name.value.trim();
    const body = `${lines.join('\n')}\n\n${long ? long.value.trim() : ''}`;
    status.textContent = form.dataset.ok; status.classList.remove('is-error');
    window.location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(`${form.dataset.subject} - ${name}`)}&body=${encodeURIComponent(body)}`;
  });
  form.addEventListener('input', (e) => { if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false'); });
};
['contact-form', 'proposal-form'].forEach((id) => { const form = document.getElementById(id); if (form) mailForm(form); });

// Botón "copiar" de las vías de contacto ([data-copy]): copia el texto y lo confirma un momento en su etiqueta
document.querySelectorAll('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(btn.dataset.copy); } catch { return; }
  const label = btn.getAttribute('aria-label');
  btn.setAttribute('aria-label', btn.dataset.copied); btn.classList.add('is-copied');
  setTimeout(() => { btn.setAttribute('aria-label', label); btn.classList.remove('is-copied'); }, 1600);
}));
