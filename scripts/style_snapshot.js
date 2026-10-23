/* Captura de estilos computados del mockup, para comprobar que un refactor de CSS/HTML
   no cambia nada visible.

   Cómo usarlo (con `python3 scripts/serve.py` corriendo):
     1. Abrir http://localhost:8000/mockup/index.html y pegar este archivo en la consola
        (o ejecutarlo con la herramienta de JavaScript del navegador integrado).
     2. Llamar:  await styleSnapshot()           -> devuelve un objeto { "pagina@ancho": {...} }
     3. Guardar el resultado ANTES del cambio, repetir DESPUÉS y comparar con
        styleSnapshotDiff(antes, despues)  -> lista de secciones que cambiaron.

   Qué compara: por página y ancho (375, 820, 1440), un hash por bloque de primer nivel
   (header, cada sección de main, footer) con las propiedades visuales de todos sus elementos.
   Se desactivan animaciones y transiciones y se fuerza el estado final de .reveal para que
   el resultado sea determinista. Se ignoran las medidas dentro de elementos que se mueven
   solos (carruseles, muro de testimonios, diagramas, canvas, video).
   Nota: si un bloque aparece distinto sin que hayas tocado nada (ocurre rara vez por recursos que
   cargan tarde), vuelve a correr solo esa página con styleSnapshot({pages:[...], langs:[...], widths:[...]}). */
(function () {
  const PAGES = ['index', 'about', 'tech-solutions', 'events-management', 'corporate-branding'];
  const LANGS = ['', 'es/'];
  const WIDTHS = [375, 820, 1440];
  const PROPS = ['display', 'position', 'color', 'background-color', 'background-image', 'font-family', 'font-size',
    'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'text-align', 'margin-top', 'margin-right',
    'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-top-width', 'border-top-color', 'border-top-left-radius', 'box-shadow', 'opacity', 'gap',
    'grid-template-columns', 'flex-direction', 'justify-content', 'align-items', 'z-index', 'overflow-x', 'filter'];
  const MOVING = '.marquee, .wall, .flow, .hero__video, canvas, [data-siderays], .ibot';
  // elementos que cambian solos de estado (carrusel del destacado): se omiten por completo
  const SKIP = '.flagship__slides, .flagship__dots, .ibot';

  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  function sign(el, win) {
    const cs = win.getComputedStyle(el);
    let out = el.tagName + '.' + (el.className && el.className.baseVal === undefined ? el.className : '') + '|';
    for (const p of PROPS) out += cs.getPropertyValue(p) + ';';
    if (!el.closest(MOVING)) {
      const r = el.getBoundingClientRect();
      out += [r.left, r.top, r.width, r.height].map((n) => Math.round(n)).join(',');
    }
    return out;
  }

  function snapshotDoc(doc, win) {
    const blocks = [...doc.querySelectorAll('body > header, body > main > *, body > footer')];
    const res = {};
    blocks.forEach((b, i) => {
      let acc = '';
      b.querySelectorAll('*').forEach((el) => { if (!el.closest('script, style, svg, ' + SKIP)) acc += sign(el, win) + '\n'; });
      const key = (b.id || b.className || b.tagName).toString().split(' ')[0] || b.tagName;
      res[i + ':' + key] = hash(acc) + '/' + b.querySelectorAll('*').length;
    });
    return res;
  }

  async function styleSnapshot(opts = {}) {
    const pages = opts.pages || PAGES, widths = opts.widths || WIDTHS, langs = opts.langs || LANGS;
    const out = {};
    for (const lang of langs) for (const page of pages) for (const w of widths) {
      const f = document.createElement('iframe');
      f.style.cssText = `position:fixed;left:-99999px;top:0;width:${w}px;height:900px;border:0`;
      f.src = `/mockup/${lang}${page}.html`;
      document.body.appendChild(f);
      await new Promise((r) => { f.onload = r; });
      const d = f.contentDocument, win = f.contentWindow;
      const st = d.createElement('style');
      st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}';
      d.head.appendChild(st);
      d.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'));
      d.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; });
      await d.fonts.ready;
      await new Promise((r) => setTimeout(r, 900));
      // Se toma la muestra hasta que dos consecutivas coincidan (recursos que terminan de cargar tarde)
      let cur = snapshotDoc(d, win);
      for (let i = 0; i < 4; i++) {
        await new Promise((r) => setTimeout(r, 400));
        const next = snapshotDoc(d, win);
        const same = JSON.stringify(next) === JSON.stringify(cur);
        cur = next;
        if (same) break;
      }
      out[`${lang}${page}@${w}`] = cur;
      f.remove();
    }
    return out;
  }

  function styleSnapshotDiff(a, b) {
    const diffs = [];
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      for (const s of new Set([...Object.keys(a[k] || {}), ...Object.keys(b[k] || {})])) {
        if ((a[k] || {})[s] !== (b[k] || {})[s]) diffs.push(`${k}  ${s}`);
      }
    }
    return diffs;
  }

  window.styleSnapshot = styleSnapshot;
  window.styleSnapshotDiff = styleSnapshotDiff;
})();
