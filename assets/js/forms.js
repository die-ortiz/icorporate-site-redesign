/* forms.js · formularios por correo directo (mailto), sin servicios externos. Cargar donde haya formulario.
   - #contact-form (Home): el asunto, destinatario y mensajes salen de data-* del propio <form>.
   - #proposal-form (páginas de servicio): arma el cuerpo con todos los campos etiquetados.
   En producción se puede reemplazar por un endpoint PHP sin tocar el HTML (cambiar solo el submit). */

// Formulario de contacto: correo directo. Arma un mailto con los datos y abre el correo del usuario.
// (En producción se puede reemplazar por un endpoint PHP en el servidor sin tocar el HTML.)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const status = contactForm.querySelector('.contact__status');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = contactForm.elements;
    const required = [f.first, f.email, f.message];
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
    const name = `${f.first.value.trim()} ${f.last.value.trim()}`.trim();
    const lines = [
      `${f.first.labels[0].textContent}: ${name}`,
      `${f.company.labels[0].textContent}: ${f.company.value.trim()}`,
      `${f.phone.labels[0].textContent}: ${f.phone.value.trim()}`,
      `${f.email.labels[0].textContent}: ${f.email.value.trim()}`,
      `${f.by.labels[0].textContent}: ${f.by.value}`,
      `${f.service.labels[0].textContent}: ${f.service.value}`,
      '', f.message.value.trim(),
    ];
    const subject = `${contactForm.dataset.subject} - ${name}`;
    const href = `mailto:${contactForm.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    status.textContent = contactForm.dataset.ok; status.classList.remove('is-error');
    window.location.href = href;
  });
  contactForm.addEventListener('input', (e) => { if (e.target.getAttribute && e.target.getAttribute('aria-invalid') === 'true') e.target.setAttribute('aria-invalid', 'false'); });
}

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
