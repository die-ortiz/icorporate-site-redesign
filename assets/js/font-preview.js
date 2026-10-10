// SOLO PRUEBA: permite ver la home con cada dirección tipográfica con ?font=a|b|c|d (y ?font=0 para la actual).
// Se elimina cuando se elija una opción. No forma parte del sitio final.
const FONT = 'https://fonts.googleapis.com/css2?';
const OPTIONS = {
  a: {
    name: 'A · Torre de control', desc: 'Sora + Inter + JetBrains Mono',
    families: 'family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700',
    vars: { '--font': "'Inter', system-ui, sans-serif", '--font-head': "'Sora', sans-serif", '--font-mono': "'JetBrains Mono', monospace" },
    css: 'h1,h2,.stat b{letter-spacing:-0.035em}h1{font-weight:600}h2.title{font-weight:700}.eyebrow,.stat>span,.field label{letter-spacing:.06em}',
  },
  b: {
    name: 'B · Editorial premium', desc: 'Bricolage Grotesque + Instrument Serif + Instrument Sans',
    families: 'family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@500',
    vars: { '--font': "'Instrument Sans', system-ui, sans-serif", '--font-head': "'Bricolage Grotesque', sans-serif", '--font-mono': "'DM Mono', monospace", '--font-accent': "'Instrument Serif', serif", '--accent-style': 'italic' },
    css: 'h1,h2,.stat b{letter-spacing:-0.03em}.grad-text{font-weight:400;font-size:1.1em;letter-spacing:-0.01em}.eyebrow,.stat>span,.field label{letter-spacing:.05em}',
  },
  c: {
    name: 'C · Señalética aeroportuaria', desc: 'Barlow Semi Condensed + Barlow',
    families: 'family=Barlow+Semi+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600',
    vars: { '--font': "'Barlow', system-ui, sans-serif", '--font-head': "'Barlow Semi Condensed', sans-serif", '--font-mono': "'Barlow Semi Condensed', sans-serif" },
    css: 'h1,h2.title,.contact__info h2,.cases h2,.stat b{text-transform:uppercase;letter-spacing:.005em;font-weight:700}h1{line-height:1}.eyebrow,.stat>span,.field label{letter-spacing:.12em}',
  },
  d: {
    name: 'D · Tech startup', desc: 'Space Grotesk + DM Sans + DM Mono',
    families: 'family=Space+Grotesk:wght@500;700&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@500',
    vars: { '--font': "'DM Sans', system-ui, sans-serif", '--font-head': "'Space Grotesk', sans-serif", '--font-mono': "'DM Mono', monospace" },
    css: 'h1,h2,.stat b{letter-spacing:-0.03em}.eyebrow,.stat>span,.field label{letter-spacing:.06em}',
  },
};
const key = (new URLSearchParams(location.search).get('font') || '').toLowerCase();
const opt = OPTIONS[key];

if (opt) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${FONT}${opt.families}&display=swap`;
  document.head.appendChild(link);
  const root = document.documentElement.style;
  Object.entries(opt.vars).forEach(([k, v]) => root.setProperty(k, v));
  const st = document.createElement('style');
  st.textContent = opt.css;
  document.head.appendChild(st);
  const hw = new URLSearchParams(location.search).get('h1w');
  if (hw && /^[1-9]00$/.test(hw)) {
    const hs = document.createElement('style');
    hs.textContent = `h1{font-weight:${hw} !important}`;
    document.head.appendChild(hs);
  }
}

// Variante del hero: ?hero=center
const heroCenter = new URLSearchParams(location.search).get('hero') === 'center';
if (heroCenter) document.querySelector('.hero')?.classList.add('hero--center');

// Selector flotante para pasar de una opción a otra
const bar = document.createElement('div');
bar.setAttribute('role', 'navigation');
bar.setAttribute('aria-label', 'Selector de tipografía de prueba');
bar.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:14px;background:#fff;color:#1d1d1b;font:600 12px/1.3 system-ui,sans-serif;box-shadow:0 12px 30px -10px rgba(0,0,0,.5);max-width:calc(100vw - 24px);flex-wrap:wrap';
const label = document.createElement('span');
label.textContent = opt ? `${opt.name} — ${opt.desc}` : 'Tipografía actual (Montserrat)';
label.style.marginRight = '6px';
bar.appendChild(label);
[['0', 'Actual'], ['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D']].forEach(([k, t]) => {
  const a = document.createElement('a');
  const u = new URL(location.href); u.searchParams.set('font', k);
  a.href = u.toString(); a.textContent = t;
  const active = (k === '0' && !opt) || k === key;
  a.style.cssText = `padding:5px 9px;border-radius:8px;text-decoration:none;font-weight:700;${active ? 'background:#037fd9;color:#fff' : 'background:#eef1f5;color:#1d1d1b'}`;
  bar.appendChild(a);
});
const sep = document.createElement('span'); sep.textContent = '|'; sep.style.cssText = 'opacity:.35;margin:0 2px'; bar.appendChild(sep);
[['', 'Hero izq.'], ['center', 'Hero centro']].forEach(([v, t]) => {
  const a = document.createElement('a');
  const u = new URL(location.href);
  if (v) u.searchParams.set('hero', v); else u.searchParams.delete('hero');
  a.href = u.toString(); a.textContent = t;
  const active = (v === 'center') === heroCenter;
  a.style.cssText = `padding:5px 9px;border-radius:8px;text-decoration:none;font-weight:700;${active ? 'background:#037fd9;color:#fff' : 'background:#eef1f5;color:#1d1d1b'}`;
  bar.appendChild(a);
});
document.body.appendChild(bar);
