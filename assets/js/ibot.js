// iBot: widget de chat flotante (EN/ES).
// MOCKUP: la conversación es una demostración local con respuestas fijas. En producción, este bloque
// se reemplaza por el snippet del proveedor del iBot (el widget real es un servicio alojado externo).
// Dos estados del panel: bienvenida (aurora, avatar grande, saludo y 4 tarjetas de sugerencia) y conversación
// (.is-chatting: cabecera compacta con identidad, mensajes con hora y aurora atenuada). Estilos en la sección 10.
(() => {
  const lang = (document.documentElement.lang || 'en').slice(0, 2) === 'es' ? 'es' : 'en';

  const T = {
    en: {
      launcher: 'Open iBot chat', close: 'Close chat', title: 'iBot', status: 'Online',
      hello: 'Hi, I’m iBot.', ask: 'What are we building today?', intro: 'Instant answers on events, technology and brand.',
      suggest: 'Suggestions', placeholder: 'Ask me anything…', send: 'Send',
      typing: 'iBot is typing', log: 'Conversation with iBot', read: 'Read',
      // [intención, etiqueta de la tarjeta, texto que se envía]
      chips: [['call', 'Book a call', 'I want to book a call'], ['services', 'What you offer', 'What services do you offer?'],
        ['events', 'Event technology', 'Tell me about event tech'], ['cases', 'Aviation cases', 'What have you done in aviation?']],
      cards: { call: ['Book a call', 'We’ll reach out to find a time'], cases: ['Featured cases', 'ALTA, ACI-LAC, ITAérea and more'] },
      replies: {
        services: 'We work across three areas: Tech Solutions (bots, apps and web platforms), Events Management (summits and conferences, end to end) and Corporate Branding (identity and materials).',
        call: 'Perfect. Here’s the shortcut:',
        events: 'We build the technology around events: registration, agenda, event apps and live data for organizers.',
        cases: 'Aviation is our flagship sector: we work with organizations like ALTA, ACI-LAC, IATA and SITA. Take a look at our featured cases.',
        fallback: 'Thanks for your message! If you book a call, the team will follow up with you directly.',
      },
    },
    es: {
      launcher: 'Abrir el chat de iBot', close: 'Cerrar el chat', title: 'iBot', status: 'En línea',
      hello: 'Hola, soy iBot.', ask: '¿Qué construimos hoy?', intro: 'Respondo al instante sobre eventos, tecnología y marca.',
      suggest: 'Sugerencias', placeholder: 'Preguntá lo que quieras…', send: 'Enviar',
      typing: 'iBot está escribiendo', log: 'Conversación con iBot', read: 'Leído',
      chips: [['call', 'Agendar una llamada', 'Quiero agendar una llamada'], ['services', 'Qué servicios ofrecen', '¿Qué servicios ofrecen?'],
        ['events', 'Tecnología para eventos', 'Contame sobre tecnología para eventos'], ['cases', 'Casos en aviación', '¿Qué hicieron en aviación?']],
      cards: { call: ['Agendá una llamada', 'Te contactamos para coordinar un horario'], cases: ['Casos destacados', 'ALTA, ACI-LAC, ITAérea y más'] },
      replies: {
        services: 'Trabajamos en tres áreas: Tech Solutions (bots, apps y plataformas web), Events Management (cumbres y conferencias, de punta a punta) y Corporate Branding (identidad y materiales).',
        call: 'Perfecto. Te dejo el acceso directo:',
        events: 'Construimos la tecnología alrededor de los eventos: registro, agenda, apps del evento y datos en vivo para los organizadores.',
        cases: 'La aviación es nuestro sector estrella: trabajamos con organizaciones como ALTA, ACI-LAC, IATA y SITA. Mirá nuestros casos destacados.',
        fallback: '¡Gracias por tu mensaje! Si agendás una llamada, el equipo te contactará directamente.',
      },
    },
  }[lang];

  // Destinos de las tarjetas: "Book a call" va a la misma sección que el botón de la cabecera (#contact o #proposal según la página)
  const headerCta = document.querySelector('.header-cta');
  const HREF = { call: headerCta ? headerCta.getAttribute('href') : 'index.html#contact', cases: 'index.html#cases' };

  // Ícono oficial del iBot, versión sin fondo (transparente). Se resuelve relativo a este script para servir en EN y ES.
  const base = document.currentScript && document.currentScript.src ? document.currentScript.src : '';
  const CLEAR_SRC = base ? new URL('../img/ibot-icon-clear.webp', base).href : '';
  const ICON_CLEAR = `<img src="${CLEAR_SRC}" alt="" width="300" height="300" decoding="async">`;
  const svg = (d, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICONS = {
    call: svg('M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM16 3v4M8 3v4M4 11h16M10 15h4'),
    services: svg('M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'),
    events: svg('M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 17h2'),
    cases: svg('M16 10h4a2 2 0 0 1 0 4h-4l-4 7H9l2-7H7l-2 2H2l2-4-2-4h3l2 2h4L9 3h3z'),
  };
  const ARROW = svg('M5 12h14M13 6l6 6-6 6', 16);
  const TICK = '<svg viewBox="0 0 18 12" width="14" height="10" aria-hidden="true" focusable="false"><path d="M1 6.5l3 3L10.5 2M7 9.5l1 1L16.5 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SEND = svg('M12 19V5M6 11l6-6 6 6');
  const CLOSE = svg('M6 6l12 12M18 6L6 18', 18);

  const root = document.createElement('div');
  root.className = 'ibot';
  root.innerHTML = `
    <section class="ibot__panel" id="ibot-panel" role="dialog" aria-label="${T.title}" inert>
      <div class="ibot__aurora" aria-hidden="true"><i></i><i></i><i></i></div>
      <header class="ibot__head">
        <span class="ibot__id"><span class="ibot__avatar">${ICON_CLEAR}</span><strong>${T.title}</strong></span>
        <span class="ibot__status"><i aria-hidden="true"></i>${T.status}</span>
        <button class="ibot__close" type="button" aria-label="${T.close}">${CLOSE}</button>
      </header>
      <div class="ibot__log" role="log" aria-live="polite" aria-label="${T.log}">
        <div class="ibot__welcome">
          <span class="ibot__orb">${ICON_CLEAR}</span>
          <p class="ibot__hello">${T.hello}<br>${T.ask}</p>
          <p class="ibot__intro">${T.intro}</p>
          <div class="ibot__suggest" role="group" aria-label="${T.suggest}"></div>
        </div>
      </div>
      <form class="ibot__composer" autocomplete="off">
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
  const form = $('.ibot__composer'), input = $('.ibot__input'), suggest = $('.ibot__suggest');

  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const clock = () => new Date().toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  // Mensaje con hora (los del usuario, con el tilde de leído); "card" agrega una tarjeta de acceso directo
  const add = (text, who, card) => {
    const m = document.createElement('div');
    m.className = 'ibot__msg ibot__msg--' + who;
    m.textContent = text;
    if (card) {
      const a = document.createElement('a');
      a.className = 'ibot__card'; a.href = HREF[card];
      a.innerHTML = `<span class="ibot__card-icon">${ICONS[card]}</span><span><b></b><small></small></span>${ARROW}`;
      a.querySelector('b').textContent = T.cards[card][0];
      a.querySelector('small').textContent = T.cards[card][1];
      a.addEventListener('click', () => setOpen(false));
      m.appendChild(a);
    }
    m.insertAdjacentHTML('beforeend', `<time class="ibot__time">${clock()}${who === 'user' ? `<span class="ibot__read" role="img" aria-label="${T.read}">${TICK}</span>` : ''}</time>`);
    log.appendChild(m); scroll();
    return m;
  };

  const intent = (q) => {
    q = q.toLowerCase();
    if (/(call|meeting|book|schedul|llamada|reuni|agend|coordin)/.test(q)) return 'call';
    if (/(case|caso|aviat|aviaci|client)/.test(q)) return 'cases';
    if (/(service|offer|servicio|ofrec|hacen|que hac)/.test(q)) return 'services';
    if (/(event|app|tech|tecnolog|evento)/.test(q)) return 'events';
    return 'fallback';
  };

  const reply = (q) => {
    const kind = intent(q);
    const typing = document.createElement('div');
    typing.className = 'ibot__msg ibot__msg--bot ibot__typing';
    typing.setAttribute('role', 'status'); typing.setAttribute('aria-label', T.typing);
    typing.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(typing); scroll();
    setTimeout(() => { typing.remove(); add(T.replies[kind], 'bot', T.cards[kind] ? kind : null); }, 900);
  };

  const send = (text) => {
    text = text.trim();
    if (!text) return;
    panel.classList.add('is-chatting');
    add(text, 'user'); reply(text);
  };

  T.chips.forEach(([kind, label, text]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ibot__tile';
    b.innerHTML = ICONS[kind] + '<span></span>';
    b.querySelector('span').textContent = label;
    b.addEventListener('click', () => send(text));
    suggest.appendChild(b);
  });

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
