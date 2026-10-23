#!/usr/bin/env python3
"""Genera la carpeta lista para subir al servidor (por SSH/rsync) a partir del mockup.

    python3 scripts/publish.py            # escribe dist/
    python3 scripts/publish.py --out /ruta

Qué hace:
  mockup/*.html        -> <out>/            (rutas ../assets/ pasan a assets/)
  mockup/es/*.html     -> <out>/es/         (rutas ../../assets/ pasan a ../assets/)
  assets/              -> <out>/assets/     (sin .gitkeep ni archivos ocultos)
  favicon.ico          -> <out>/favicon.ico
  sitemap.xml, robots.txt generados desde las páginas (con hreflang EN/ES; la 404 no entra)
  404.html y es/404.html salen con rutas desde la raíz (/assets/…, /es/…), porque el servidor las muestra
  bajo cualquier URL. Apache: `ErrorDocument 404 /404.html` en la raíz y `ErrorDocument 404 /es/404.html`
  en es/.htaccess; nginx: `error_page 404 /404.html;` y `location /es/ { error_page 404 /es/404.html; }`.
Qué NO publica: reference/ (originales y material de trabajo), scripts/, CLAUDE.md, los marcadores de
posición de la raíz (index.html y es/) y los comentarios internos de generación.
Antes de escribir corre check_site.py; después comprueba que cada recurso local y cada ancla existan en
la carpeta resultante. Sale con 1 si algo falla. No sube nada: ese paso lo hace una persona.
"""
import glob
import os
import posixpath
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAIN = "https://icorporatelab.com"


def absolutize(html, folder):
    """La 404 se sirve bajo cualquier URL: las rutas relativas pasan a ser desde la raíz del sitio."""
    def fix(m):
        ref = m.group(2)
        if re.match(r"(https?:|mailto:|tel:|data:|#|/)", ref):
            return m.group(0)
        path = posixpath.normpath(posixpath.join(folder, ref.split("#")[0].split("?")[0]))
        suffix = ref[len(ref.split("#")[0].split("?")[0]):]
        return f'{m.group(1)}="/{path}{suffix}"'
    return re.sub(r'\b(src|href)="([^"]*)"', fix, html)


def main():
    out = os.path.join(ROOT, "dist")
    if "--out" in sys.argv:
        out = os.path.abspath(sys.argv[sys.argv.index("--out") + 1])
    if subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "check_site.py")]).returncode != 0:
        sys.exit("check_site.py tiene errores: corregirlos antes de publicar")

    if os.path.exists(out):
        shutil.rmtree(out)
    os.makedirs(os.path.join(out, "es"))
    ignore = shutil.ignore_patterns(".*", "__pycache__")
    shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(out, "assets"), ignore=ignore)
    shutil.copy(os.path.join(ROOT, "favicon.ico"), os.path.join(out, "favicon.ico"))

    pages = []
    for lang, folder, old, new in (("en", "mockup", "../assets/", "assets/"),
                                   ("es", os.path.join("mockup", "es"), "../../assets/", "../assets/")):
        for src in sorted(glob.glob(os.path.join(ROOT, folder, "*.html"))):
            with open(src, encoding="utf-8") as fh:
                html = fh.read()
            html = html.replace(old, new)
            html = re.sub(r"<!-- (?:chrome|social|scripts):[^>]*-->\n\s*", "", html)  # comentarios internos
            name = os.path.basename(src)
            if name == "404.html":
                html = absolutize(html, "es/" if lang == "es" else "")
            dest = os.path.join(out, "es" if lang == "es" else "", name)
            with open(dest, "w", encoding="utf-8") as fh:
                fh.write(html)
            pages.append((lang, name))

    # sitemap.xml con alternates EN/ES y robots.txt
    names = sorted({n for _, n in pages if n != "404.html"})
    def loc(lang, n):
        path = "" if n == "index.html" and lang == "en" else n
        return f"{DOMAIN}/{'es/' if lang == 'es' else ''}{path}"
    rows = []
    for n in names:
        for lang in ("en", "es"):
            rows.append("  <url>\n    <loc>%s</loc>\n    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"%s\"/>\n"
                        "    <xhtml:link rel=\"alternate\" hreflang=\"es\" href=\"%s\"/>\n  </url>"
                        % (loc(lang, n), loc("en", n), loc("es", n)))
    with open(os.path.join(out, "sitemap.xml"), "w", encoding="utf-8") as fh:
        fh.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
                 + "\n".join(rows) + "\n</urlset>\n")
    with open(os.path.join(out, "robots.txt"), "w", encoding="utf-8") as fh:
        fh.write(f"User-agent: *\nAllow: /\n\nSitemap: {DOMAIN}/sitemap.xml\n")

    # verificación sobre la carpeta resultante
    problems = []
    ids = {}
    html_files = glob.glob(os.path.join(out, "*.html")) + glob.glob(os.path.join(out, "es", "*.html"))
    for f in html_files:
        with open(f, encoding="utf-8") as fh:
            ids[f] = (fh.read(),)
    for f, (html,) in ids.items():
        rel = os.path.relpath(f, out)
        found = set(re.findall(r'\sid="([^"]+)"', html))
        ids[f] = (html, found)
    for f, (html, _) in ids.items():
        rel = os.path.relpath(f, out)
        for ref in re.findall(r'(?:src|href)="([^"#?]+)(?:#[^"]*)?"', html):
            if re.match(r"(https?:|mailto:|tel:|data:)", ref):
                continue
            base = out if ref.startswith("/") else os.path.dirname(f)
            if not os.path.exists(os.path.normpath(os.path.join(base, ref.lstrip("/") if ref.startswith("/") else ref))):
                problems.append(f"{rel}: recurso inexistente {ref}")
        for href in re.findall(r'href="([^"]*#[^"]+)"', html):
            if re.match(r"(https?:|mailto:|tel:)", href):
                continue
            path, anchor = href.split("#", 1)
            if path.startswith("/"):
                target = os.path.normpath(os.path.join(out, path.lstrip("/")))
            else:
                target = f if path == "" else os.path.normpath(os.path.join(os.path.dirname(f), path))
            if target in ids and anchor not in ids[target][1]:
                problems.append(f"{rel}: ancla inexistente {href}")
    # los videos de fondo son opcionales
    problems = [p for p in problems if "assets/video/" not in p]
    for p in problems:
        print("ERROR", p)
    n_files = sum(len(fs) for _, _, fs in os.walk(out))
    print(f"{out}: {len(pages)} páginas, {n_files} archivos, {len(problems)} problemas")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
