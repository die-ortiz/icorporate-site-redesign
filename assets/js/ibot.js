// iBot: widget de chat flotante (EN/ES).
// MOCKUP: la conversación es una demostración local con respuestas fijas. En producción, este bloque
// se reemplaza por el snippet del proveedor del iBot (el widget real es un servicio alojado externo).
(() => {
  const lang = (document.documentElement.lang || 'en').slice(0, 2) === 'es' ? 'es' : 'en';

  const T = {
    en: {
      launcher: 'Open iBot chat', close: 'Close chat', title: 'iBot', status: 'Online',
      greeting: 'Hi! How can I help you?', placeholder: 'Type your question...', send: 'Send',
      typing: 'iBot is typing', log: 'Conversation with iBot', welcome: 'Your iCorporate assistant', read: 'Read',
      chips: ['What services do you offer?', 'I want to book a call', 'Tell me about event tech'],
      cta: 'Book a call',
      replies: {
        services: 'We work across three areas: Tech Solutions (bots, apps and web platforms), Events Management (summits and conferences, end to end) and Corporate Branding (identity and materials).',
        call: 'Happy to help. Use the button below and we will get back to you to find a time.',
        events: 'We build the technology around events: registration, agenda, event apps and live data for organizers.',
        fallback: 'Thanks for your message! If you book a call, the team will follow up with you directly.',
      },
    },
    es: {
      launcher: 'Abrir el chat de iBot', close: 'Cerrar el chat', title: 'iBot', status: 'En línea',
      greeting: '¡Hola! ¿En qué puedo ayudarte?', placeholder: 'Escribí tu consulta...', send: 'Enviar',
      typing: 'iBot está escribiendo', log: 'Conversación con iBot', welcome: 'Tu asistente de iCorporate', read: 'Leído',
      chips: ['¿Qué servicios ofrecen?', 'Quiero agendar una llamada', 'Contame sobre tecnología para eventos'],
      cta: 'Agendá una llamada',
      replies: {
        services: 'Trabajamos en tres áreas: Tech Solutions (bots, apps y plataformas web), Events Management (cumbres y conferencias, de punta a punta) y Corporate Branding (identidad y materiales).',
        call: 'Con gusto. Usá el botón de abajo y te contactamos para coordinar un horario.',
        events: 'Construimos la tecnología alrededor de los eventos: registro, agenda, apps del evento y datos en vivo para los organizadores.',
        fallback: '¡Gracias por tu mensaje! Si agendás una llamada, el equipo te contactará directamente.',
      },
    },
  }[lang];

  // Ícono oficial del iBot, versión sin fondo (transparente): se usa en el lanzador y en la cabecera del panel.
  // Se resuelve relativo a este script para servir en EN y ES.
  const base = document.currentScript && document.currentScript.src ? document.currentScript.src : '';
  const CLEAR_SRC = base ? new URL('../img/ibot-icon-clear.webp', base).href : '';
  const ICON_CLEAR = `<img src="${CLEAR_SRC}" alt="" width="300" height="300" decoding="async">`;
  const TICK = '<svg viewBox="0 0 18 12" width="14" height="10" aria-hidden="true" focusable="false"><path d="M1 6.5l3 3L10.5 2M7 9.5l1 1L16.5 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SEND = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M21.5 3.5L10 14M21.5 3.5l-6.5 17-3.5-7.5L4 9.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CLOSE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  const root = document.createElement('div');
  root.className = 'ibot';
  root.innerHTML = `
    <section class="ibot__panel" id="ibot-panel" role="dialog" aria-label="${T.title}" inert>
      <header class="ibot__head">
        <span class="ibot__avatar">${ICON_CLEAR}</span>
        <span class="ibot__who"><strong>${T.title}</strong><span><i aria-hidden="true"></i>${T.status}</span></span>
        <button class="ibot__close" type="button" aria-label="${T.close}">${CLOSE}</button>
      </header>
      <div class="ibot__log" role="log" aria-live="polite" aria-label="${T.log}"></div>
      <div class="ibot__chips"></div>
      <form class="ibot__form" autocomplete="off">
        <input class="ibot__input" type="text" name="q" placeholder="${T.placeholder}" aria-label="${T.placeholder}">
        <button class="ibot__send" type="submit" aria-label="${T.send}">${SEND}</button>
      </form>
    </section>
    <button class="ibot__launcher" type="button" aria-expanded="false" aria-controls="ibot-panel" aria-label="${T.launcher}">
      <span class="ibot__launcher-icon">${ICON_CLEAR}</span>
      <span class="ibot__launcher-x">${CLOSE}</span>
    </button>`;
  document.body.appendChild(root);

  const $ = (s) => root.querySelector(s);
  const panel = $('.ibot__panel'), launcher = $('.ibot__launcher'), log = $('.ibot__log');
  const form = $('.ibot__form'), input = $('.ibot__input'), chips = $('.ibot__chips');

  const scroll = () => { log.scrollTop = log.scrollHeight; };
  // Bienvenida: avatar grande en un anillo con el degradado de marca; es parte del registro y sube con la conversación
  log.insertAdjacentHTML('beforeend', `<div class="ibot__welcome"><span class="ibot__halo">${ICON_CLEAR}</span><strong>${T.title}</strong><p>${T.welcome}</p></div>`);
  const clock = () => new Date().toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  // Cada mensaje va en una fila (.ibot__row): las del iBot llevan el avatar chico; todas, la hora (las del usuario, con el tilde de leído)
  const add = (text, who, withCta, withTime = true) => {
    const row = document.createElement('div');
    row.className = 'ibot__row ibot__row--' + who;
    if (who === 'bot') row.insertAdjacentHTML('beforeend', `<span class="ibot__mini">${ICON_CLEAR}</span>`);
    const m = document.createElement('div');
    m.className = 'ibot__msg ibot__msg--' + who;
    m.textContent = text;
    if (withCta) {
      const a = document.createElement('a');
      a.href = '#contact'; a.className = 'ibot__cta'; a.textContent = T.cta;
      a.addEventListener('click', () => setOpen(false));
      m.appendChild(a);
    }
    if (withTime) m.insertAdjacentHTML('beforeend', `<time class="ibot__time">${clock()}${who === 'user' ? `<span class="ibot__read" role="img" aria-label="${T.read}">${TICK}</span>` : ''}</time>`);
    row.appendChild(m);
    log.appendChild(row); scroll();
    return m;
  };

  const intent = (q) => {
    q = q.toLowerCase();
    if (/(call|meeting|book|schedul|llamada|reuni|agend|coordin)/.test(q)) return 'call';
    if (/(service|offer|servicio|ofrec|hacen|que hac)/.test(q)) return 'services';
    if (/(event|app|tech|tecnolog|evento)/.test(q)) return 'events';
    return 'fallback';
  };

  const reply = (q) => {
    const kind = intent(q);
    const typing = add('…', 'bot', false, false); typing.setAttribute('aria-label', T.typing); typing.classList.add('is-typing');
    setTimeout(() => { typing.parentNode.remove(); add(T.replies[kind], 'bot', kind === 'call'); }, 650);
  };

  const send = (text) => {
    text = text.trim();
    if (!text) return;
    chips.hidden = true;
    add(text, 'user'); reply(text);
  };

  T.chips.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ibot__chip'; b.textContent = c;
    b.addEventListener('click', () => send(c));
    chips.appendChild(b);
  });
  add(T.greeting, 'bot');
  log.scrollTop = 0; // al abrir se ve la bienvenida completa; desde el primer mensaje, el registro sigue al último

  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); input.value = ''; });

  function setOpen(open) {
    root.classList.toggle('is-open', open);
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? T.close : T.launcher);
    panel.inert = !open;
    if (open) setTimeout(() => input.focus(), 120); else if (document.activeElement && panel.contains(document.activeElement)) launcher.focus();
  }
  launcher.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
  $('.ibot__close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('is-open')) { setOpen(false); launcher.focus(); }
  });
  // Botones externos (p. ej. "Abrir el asistente" en la página Tech Solutions)
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-ibot]')) { e.preventDefault(); setOpen(true); }
  });
})();
