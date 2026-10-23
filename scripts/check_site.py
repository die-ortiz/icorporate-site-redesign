#!/usr/bin/env python3
"""Revisa la integridad del mockup (EN + ES) antes de commitear o publicar.

Uso:   python3 scripts/check_site.py            # errores y avisos
       python3 scripts/check_site.py --strict   # los avisos también fallan

Errores (salida 1): rutas locales rotas, anclas inexistentes, imágenes sin alt/width/height,
enlaces target="_blank" sin noopener, ids duplicados, H1 distinto de 1, páginas EN/ES con ids
distintos, atributo lang incorrecto, falta de canonical/hreflang, cabecera o footer fuera de
sincronía con scripts/partials (ver scripts/sync_chrome.py).
Avisos: clases CSS sin uso, imágenes de assets/img que ninguna página referencia.
Solo usa la librería estándar.
"""
import glob
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

PAGES_EN = sorted(glob.glob("mockup/*.html"))
PAGES_ES = sorted(glob.glob("mockup/es/*.html"))
PAGES = PAGES_EN + PAGES_ES

errors, warnings = [], []


def err(page, msg):
    errors.append(f"{page}: {msg}")


def warn(msg):
    warnings.append(msg)


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


ids_by_page = {}
sources = {p: read(p) for p in PAGES}

for page, html in sources.items():
    name = page.replace("mockup/", "")
    folder = os.path.dirname(page)

    # idioma y metadatos SEO
    expected_lang = "es" if "/es/" in page else "en"
    m = re.search(r'<html lang="([^"]+)"', html)
    if not m or m.group(1) != expected_lang:
        err(name, f'<html lang> debería ser "{expected_lang}"')
    for needle, label in (('rel="canonical"', "canonical"), ('hreflang="en"', "hreflang en"),
                          ('hreflang="es"', "hreflang es"), ('name="description"', "meta description"),
                          ('property="og:title"', "og:title"), ('property="og:image"', "og:image"),
                          ('name="twitter:card"', "twitter:card")):
        if needle not in html:
            err(name, f"falta {label}")
    if len(re.findall(r"<h1[\s>]", html)) != 1:
        err(name, "debe tener exactamente un <h1>")

    # ids duplicados
    ids = re.findall(r'\sid="([^"]+)"', html)
    ids_by_page[page] = set(ids)
    for dup in sorted({i for i in ids if ids.count(i) > 1}):
        err(name, f'id duplicado "{dup}"')

    # imágenes
    for tag in re.findall(r"<img\b[^>]*>", html):
        src = re.search(r'\ssrc="([^"]+)"', tag)
        if " alt=" not in tag:
            err(name, f"<img> sin alt: {src.group(1) if src else tag[:60]}")
        if " width=" not in tag or " height=" not in tag:
            err(name, f"<img> sin width/height: {src.group(1) if src else tag[:60]}")
        if src and not re.match(r"(https?:|data:)", src.group(1)):
            target = os.path.normpath(os.path.join(folder, src.group(1)))
            if not os.path.exists(target):
                err(name, f"imagen inexistente: {src.group(1)}")

    # enlaces externos y hojas/scripts locales
    for tag in re.findall(r"<a\b[^>]*>", html):
        if 'target="_blank"' in tag and "noopener" not in tag:
            err(name, f"target=_blank sin rel=noopener: {tag[:80]}")
    for ref in re.findall(r'(?:src|href)="([^"#?]+\.(?:css|js|ico|png|webp|mp4|svg))"', html):
        if re.match(r"https?:", ref):
            continue
        if not os.path.exists(os.path.normpath(os.path.join(folder, ref))):
            if "assets/video/" in ref:  # el video de fondo es opcional: sin archivo se usa el póster
                warn(f"{name}: video opcional sin archivo: {ref}")
            else:
                err(name, f"archivo inexistente: {ref}")

# marcadores de posición de la raíz (index.html y es/index.html): recursos locales existentes
for ph in ("index.html", "es/index.html"):
    for ref in re.findall(r'(?:src|href)="([^"#?:]+\.(?:css|js|ico|png|webp))"', read(ph)):
        if not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(ph), ref))):
            err(ph, f"archivo inexistente: {ref}")

# anclas internas
for page, html in sources.items():
    name = page.replace("mockup/", "")
    folder = os.path.dirname(page)
    for href in sorted(set(re.findall(r'href="([^"]*#[^"]+)"', html))):
        if re.match(r"https?:|mailto:|tel:", href):
            continue
        path, anchor = href.split("#", 1)
        target = page if path == "" else os.path.normpath(os.path.join(folder, path))
        if target not in ids_by_page:
            err(name, f"enlace a página inexistente: {href}")
        elif anchor not in ids_by_page[target]:
            err(name, f"ancla inexistente: {href}")

# paridad EN/ES
for en in PAGES_EN:
    es = os.path.join("mockup", "es", os.path.basename(en))
    if es not in ids_by_page:
        err(os.path.basename(en), "no tiene versión ES")
        continue
    only_en = ids_by_page[en] - ids_by_page[es]
    only_es = ids_by_page[es] - ids_by_page[en]
    if only_en or only_es:
        err(os.path.basename(en), f"ids distintos EN/ES (solo EN: {sorted(only_en)}, solo ES: {sorted(only_es)})")

# cabecera y footer sincronizados con scripts/partials
chrome = subprocess.run([sys.executable, os.path.join("scripts", "sync_chrome.py"), "--check"],
                        capture_output=True, text=True) if os.path.exists("scripts/sync_chrome.py") else None
if chrome is not None and chrome.returncode != 0:
    for line in (chrome.stdout + chrome.stderr).strip().splitlines():
        err("chrome", line)

# avisos: CSS sin uso e imágenes huérfanas
css = re.sub(r"/\*.*?\*/", "", read("assets/css/styles.css"), flags=re.S)
all_html = "".join(sources.values()) + read("index.html") + read("es/index.html")
js = "".join(read(f) for f in glob.glob("assets/js/*.js"))
used = {c for cls in re.findall(r'class="([^"]+)"', all_html) for c in cls.split()}
# clases que arma el JS por concatenación (p. ej. 'ibot__msg--' + who)
dynamic_prefixes = ("ibot__msg--",)
for c in sorted(set(re.findall(r"\.([a-zA-Z][\w-]*)", css))):
    if re.match(r"\d", c) or c in used or c in js or c.startswith(dynamic_prefixes):
        continue
    warn(f"clase CSS sin uso: .{c}")
refs = all_html + css + js
# módulos de JS que ninguna página carga (siderays.js, orb.js y tunnel.js se importan desde backgrounds.js)
for js_file in sorted(os.listdir("assets/js")):
    if js_file.endswith(".js") and js_file not in ("siderays.js", "orb.js", "tunnel.js") and js_file not in all_html:
        warn(f"módulo JS sin cargar en ninguna página: assets/js/{js_file}")
for img in sorted(os.listdir("assets/img")):
    if not img.startswith(".") and img not in refs:
        warn(f"imagen sin referencia: assets/img/{img}")

for w in warnings:
    print("AVISO ", w)
for e in errors:
    print("ERROR ", e)
print(f"\n{len(PAGES)} páginas revisadas: {len(errors)} errores, {len(warnings)} avisos")
sys.exit(1 if errors or (warnings and "--strict" in sys.argv) else 0)
