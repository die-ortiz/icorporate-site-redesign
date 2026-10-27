/* forms.js · formularios por correo directo (mailto), sin servicios externos. Cargar donde haya formulario.
   - #contact-form (Home): el asunto, destinatario y mensajes salen de data-* del propio <form>.
   - #proposal-form (páginas de servicio): arma el cuerpo con todos los campos etiquetados.
   En producción se puede reemplazar por un endpoint PHP sin tocar el HTML (cambiar solo el submit). */

// Formulario de contacto (Home): correo directo. Campos: nombre, correo, empresa, servicio (píldoras), mensaje y, si se
// marcó, el pedido de llamada (día y franja en hora de Miami, de slots.js). Arma un mailto y abre el correo del usuario.
// (En producción se puede reemplazar por un endpoint PHP en el servidor sin tocar el HTML.)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const status = contactForm.querySelector('.contact__status');
  const labelOf = (name) => {
    const el = contactForm.elements[name];
    const node = el && (el.labels ? el.labels[0] : null);
    return node ? node.textContent : (contactForm.querySelector(`[name="${name}"]`)?.closest('fieldset')?.querySelector('legend')?.textContent || name);
  };
  const checked = (name) => contactForm.querySelector(`input[name="${name}"]:checked`);
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = contactForm.elements;
    const required = [f.name, f.email, f.message];
    let firstBad = null;
    required.forEach((el) => {
      const bad = !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value.trim()));
      el.setAttribute('aria-invalid', String(bad));
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      status.textContent = contactForm.dataset.err; status.classList.add('is-error'); firstBad.focus();
      return;
    }
    const name = f.name.value.trim();
    const service = checked('service');
    const lines = [
      `${labelOf('name')}: ${name}`,
      `${labelOf('company')}: ${f.company.value.trim()}`,
      `${labelOf('email')}: ${f.email.value.trim()}`,
      `${labelOf('service')}: ${service ? service.value : ''}`,
    ];
    if (f.call && f.call.checked) {
      const day = checked('day'); const win = checked('window');
      lines.push(`${f.call.labels[0].textContent}: ${day ? day.dataset.label : '-'} · ${win ? win.value : '-'} (Miami, ET)`);
    }
    lines.push('', f.message.value.trim());
    const subject = `${contactForm.dataset.subject} - ${name}`;
    const href = `mailto:${contactForm.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    status.textContent = contactForm.dataset.ok; status.classList.remove('is-error');
    window.location.href = href;
  });
  contactForm.addEventListener('input', (e) => { if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false'); });
}

// Botón "copiar" de las vías de contacto ([data-copy]): copia el texto y lo confirma un momento en su etiqueta
document.querySelectorAll('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(btn.dataset.copy); } catch { return; }
  const label = btn.getAttribute('aria-label');
  btn.setAttribute('aria-label', btn.dataset.copied); btn.classList.add('is-copied');
  setTimeout(() => { btn.setAttribute('aria-label', label); btn.classList.remove('is-copied'); }, 1600);
}));

// Formulario de propuesta (páginas de servicio): correo directo con todos los campos etiquetados
const proposalForm = document.getElementById('proposal-form');
if (proposalForm) {
  const status = proposalForm.querySelector('.contact__status');
  proposalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const required = [...proposalForm.querySelectorAll('[required]')];
    let firstBad = null;
    required.forEach((el) => {
      const bad = !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value.trim()));
      el.setAttribute('aria-invalid', String(bad));
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      status.textContent = proposalForm.dataset.err; status.classList.add('is-error'); firstBad.focus();
      return;
    }
    const lines = [...proposalForm.querySelectorAll('input, select, textarea')]
      .filter((el) => el.name && el.value.trim() && el.name !== 'brief')
      .map((el) => `${el.labels[0].textContent}: ${el.value.trim()}`);
    const brief = proposalForm.elements.brief.value.trim();
    const name = proposalForm.elements.name.value.trim();
    const subject = `${proposalForm.dataset.subject} - ${name}`;
    const body = `${lines.join('\n')}\n\n${brief}`;
    status.textContent = proposalForm.dataset.ok; status.classList.remove('is-error');
    window.location.href = `mailto:${proposalForm.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  proposalForm.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false'); });
}
