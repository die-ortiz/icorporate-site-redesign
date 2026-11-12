/* forms.js · botón "copiar" de las vías de contacto ([data-copy]): copia el texto (el correo) y lo confirma un momento.
   El contacto ya no usa formulario por correo: el Home y cada servicio llevan la tarjeta del iBot ([data-bot-contact], ibot.js).
   El formulario anterior (mailto con pedido de llamada) quedó en el historial de git si hiciera falta volver a él. */

// Botón "copiar" de las vías de contacto ([data-copy]): copia el texto y lo confirma un momento en su etiqueta
document.querySelectorAll('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(btn.dataset.copy); } catch { return; }
  const label = btn.getAttribute('aria-label');
  btn.setAttribute('aria-label', btn.dataset.copied); btn.classList.add('is-copied');
  setTimeout(() => { btn.setAttribute('aria-label', label); btn.classList.remove('is-copied'); }, 1600);
}));
