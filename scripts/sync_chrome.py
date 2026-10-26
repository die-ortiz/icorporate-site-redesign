#!/usr/bin/env python3
"""Mantiene cabecera, mega-menú, footer y los <script> de cada página desde UNA fuente.

Fuente:  scripts/partials/header.{en,es}.html  y  scripts/partials/footer.{en,es}.html
Destino: mockup/*.html (EN) y mockup/es/*.html (ES): reemplaza <header class="site-header">…</header>
         y <footer class="site-footer">…</footer>.

Redes sociales: en <head> se escribe el bloque Open Graph / Twitter a partir del <title>, la meta description y el
         canonical de cada página (no hay que mantenerlo a mano). La imagen es OG_IMAGE.

Scripts: al final de <body> se escribe ibot.js + core.js y, además, solo los módulos que la página necesita según
         lo que contiene su HTML (ver FEATURES). Para que una página cargue un módulo nuevo basta con que use su
         marcado; no se editan los <script> a mano.

Variables dentro de las plantillas (lo único que cambia entre páginas):
  {{CTA_HREF}}   destino de los botones "Book a call" (ancla de contacto de la propia página)
  {{LANG_HREF}}  enlace a la misma página en el otro idioma

Uso:  python3 scripts/sync_chrome.py          # escribe los cambios
      python3 scripts/sync_chrome.py --check  # solo verifica; sale con 1 si alguna página difiere
Después de editar una plantilla hay que correrlo; check_site.py lo verifica en --check.
Si se agrega una página, sumarla a PAGES.
"""
import html as htmllib
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# página -> destino de "Book a call" (id de la sección de contacto de esa página)
PAGES = {
    "index.html": "#contact",
    "about.html": "index.html#contact",
    "tech-solutions.html": "#proposal",
    "events-management.html": "#proposal",
    "corporate-branding.html": "#proposal",
    "404.html": "index.html#contact",
}
# módulo -> patrón del marcado que lo hace necesario (core.js e ibot.js van siempre)
FEATURES = {
    "backgrounds.js": r'hero__video|data-siderays|data-tunnel',
    "cycle.js": r'data-cycle',
    "flow.js": r'class="(?:[^"]* )?flow(?: [^"]*)?"',
    "forms.js": r'id="(?:contact|proposal)-form"',
    "pin.js": r'data-pin',
    "splash.js": r'data-splash',
    "magnetic.js": r'data-magnetic',
    "home.js": r'class="(?:[^"]* )?(?:marquee|wall)(?: [^"]*)?"|data-flagship-slides',
    "stats.js": r'class="(?:[^"]* )?stat(?: [^"]*)?"|data-count',
}
SCRIPTS_RE = re.compile(
    r'(?:<!-- scripts:[^>]*-->\n\s*)?<script src="[^"]*ibot\.js" defer></script>\n(?:\s*<script type="module" src="[^"]*"></script>\n?)+',
)
OG_IMAGE = "https://icorporatelab.com/assets/img/hero-poster.webp"
SOCIAL_RE = re.compile(r'<!-- social:[^>]*-->\n(?:\s*<meta (?:property="og:|name="twitter:)[^>]*>\n)+\s*')
NOTE = ("<!-- chrome:{name}: generado desde scripts/partials/{name}.{lang}.html. "
        "No editar aquí: editar la plantilla y correr scripts/sync_chrome.py -->")
BLOCKS = {
    "header": (r'<header class="site-header">.*?</header>', "header"),
    "footer": (r'<footer class="site-footer">.*?</footer>', "footer"),
}


def load(name, lang):
    with open(os.path.join(ROOT, "scripts", "partials", f"{name}.{lang}.html"), encoding="utf-8") as fh:
        return fh.read().rstrip("\n")


def render(html, lang, page):
    cta = PAGES[page]
    lang_href = f"es/{page}" if lang == "en" else f"../{page}"
    for name, (pattern, _) in BLOCKS.items():
        tpl = load(name, lang).replace("{{CTA_HREF}}", cta).replace("{{LANG_HREF}}", lang_href)
        note = NOTE.format(name=name, lang=lang)
        # quita la nota anterior si existe y la vuelve a escribir sobre el bloque
        html = re.sub(r"<!-- chrome:%s:[^>]*-->\n\s*" % name, "", html)
        html, n = re.subn(pattern, lambda m: note + "\n  " + tpl, html, count=1, flags=re.S)
        if n != 1:
            raise SystemExit(f"no se encontró <{name}> en {page} ({lang})")
    return render_scripts(render_social(html, lang), lang)


def render_social(html, lang):
    """Open Graph y Twitter Card desde title, description y canonical de la propia página."""
    body = SOCIAL_RE.sub("", html)
    title = re.search(r"<title>(.*?)</title>", body, flags=re.S).group(1).strip()
    desc = re.search(r'<meta name="description" content="([^"]*)"', body).group(1)
    url = re.search(r'<link rel="canonical" href="([^"]+)"', body).group(1)
    esc = lambda t: htmllib.escape(htmllib.unescape(t), quote=True)
    title, desc = esc(title), esc(desc)
    other = "es_ES" if lang == "en" else "en_US"
    metas = [
        ("property", "og:type", "website"), ("property", "og:site_name", "iCorporate"),
        ("property", "og:title", title), ("property", "og:description", desc), ("property", "og:url", url),
        ("property", "og:image", OG_IMAGE), ("property", "og:locale", "en_US" if lang == "en" else "es_ES"),
        ("property", "og:locale:alternate", other),
        ("name", "twitter:card", "summary_large_image"), ("name", "twitter:title", title),
        ("name", "twitter:description", desc), ("name", "twitter:image", OG_IMAGE),
    ]
    block = ("<!-- social: generado por scripts/sync_chrome.py desde title, description y canonical -->\n"
             + "".join(f'  <meta {k}="{n}" content="{v}">\n' for k, n, v in metas) + "  ")
    anchor = re.search(r'<link rel="alternate" hreflang="x-default"[^>]*>\n\s*', body)
    if not anchor:
        raise SystemExit("falta hreflang x-default para ubicar el bloque social")
    return body[:anchor.end()] + block + body[anchor.end():]


def render_scripts(html, lang):
    prefix = "../assets/js/" if lang == "en" else "../../assets/js/"
    body = SCRIPTS_RE.sub("", html)  # el marcado a inspeccionar no incluye los propios <script>
    mods = ["core.js"] + [m for m, pat in sorted(FEATURES.items()) if re.search(pat, body)]
    tags = [f'<script src="{prefix}ibot.js" defer></script>'] + \
           [f'<script type="module" src="{prefix}{m}"></script>' for m in mods]
    block = ("<!-- scripts: generado por scripts/sync_chrome.py según el marcado de la página (ver FEATURES) -->\n  "
             + "\n  ".join(tags) + "\n")
    html, n = SCRIPTS_RE.subn(lambda m: block, html, count=1)
    if n != 1:
        raise SystemExit("no se encontró el bloque de <script> al final de la página")
    return html


def main():
    check = "--check" in sys.argv
    stale = []
    for lang, folder in (("en", "mockup"), ("es", os.path.join("mockup", "es"))):
        for page in PAGES:
            path = os.path.join(ROOT, folder, page)
            with open(path, encoding="utf-8") as fh:
                current = fh.read()
            new = render(current, lang, page)
            if new != current:
                stale.append(os.path.join(folder, page))
                if not check:
                    with open(path, "w", encoding="utf-8") as fh:
                        fh.write(new)
    if check:
        for p in stale:
            print(f"{p}: cabecera o footer fuera de sincronía con scripts/partials (correr scripts/sync_chrome.py)")
        sys.exit(1 if stale else 0)
    print(f"{len(stale)} páginas actualizadas" if stale else "todo en sincronía")


if __name__ == "__main__":
    main()
