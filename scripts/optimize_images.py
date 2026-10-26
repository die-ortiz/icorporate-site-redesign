#!/usr/bin/env python3
"""Optimiza las imágenes del sitio antes de publicarlas.

Lee los originales de reference/img-originals/ (no se publican) y escribe las
versiones listas para web en assets/img/ (WebP, tamaño acorde al uso real).
Para agregar una imagen nueva: dejar el original en reference/img-originals/,
sumarla a JOBS y volver a correr:  python3 scripts/optimize_images.py
Requiere Pillow con soporte WebP.
"""
from pathlib import Path
from collections import deque

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "reference" / "img-originals"
DST = ROOT / "assets" / "img"

# Zonas desenfocadas de alta-agm-opening-ceremony.jpg (coordenadas del original de 2000x1333):
# nombre y cargo del orador en la pantalla y los textos de Amadeus del cartel de la derecha
EVENTS_BLUR = [(328, 518, 488, 595), (1830, 515, 1905, 570), (1832, 660, 1905, 720), (1845, 730, 1895, 758)]

# salida -> (original, ancho máximo, calidad, opciones)
JOBS = {
    # Logo de marca, recortado al contenido. "light" = versión oficial para fondos oscuros.
    # (opción {"light": True} recolorea texto oscuro a blanco, solo como respaldo)
    "logo.webp":       ("image001-scaled.png", 480, 90, {"crop": True}),
    "logo-light.webp": ("inverseicorporate-logo-long-tag-color@2x.png", 480, 90, {"crop": True}),
    # Logos de clientes (se muestran a ~150x100; 300x200 cubre pantallas 2x)
    "client-alta.webp":    ("Logo_alta.png",    300, 88, {}),
    "client-aci-lac.webp": ("Logo_Acilac.png",  300, 88, {}),
    "client-aci-world.webp": ("Logo_AciWorld.png", 300, 88, {"trim": True}),
    "client-iata.webp":    ("Logo_Iata.png",    300, 88, {}),
    "client-sita.webp":    ("Logo_sita.png",    300, 88, {}),
    "client-heico.webp":   ("Logo_Heico.png",   300, 88, {}),
    "client-itaerea.webp": ("Logo_Itaerea.png", 300, 88, {}),
    "client-aviatdo.webp": ("aviatdo.png",       300, 88, {"unmatte": True}),
    "client-exolum.webp":  ("Logo_Exolum.jpg",  300, 88, {"box": (40, 60, 460, 190), "unmatte": True}),
    # Versiones blancas (carrusel sobre fondo oscuro): la luminosidad pasa a transparencia,
    # así se conservan los detalles internos del logo y el fondo blanco opaco desaparece
    "client-alta-white.webp":    ("Logo_alta.png",    300, 90, {"white": True}),
    "client-aci-lac-white.webp": ("Logo_Acilac.png",  300, 90, {"white": True}),
    "client-aci-world-white.webp": ("Logo_AciWorld.png", 300, 90, {"white": True, "trim": True}),
    "client-iata-white.webp":    ("Logo_Iata.png",    300, 90, {"white": True}),
    "client-sita-white.webp":    ("Logo_sita.png",    300, 90, {"white": True}),
    "client-heico-white.webp":   ("Logo_Heico.png",   300, 90, {"white": True}),
    "client-itaerea-white.webp": ("Logo_Itaerea.png", 300, 90, {"white": True}),
    "client-aviatdo-white.webp": ("aviatdo.png",      300, 90, {"white": True}),
    "client-exolum-white.webp":  ("Logo_Exolum.jpg",  300, 90, {"box": (40, 60, 460, 190), "solid": True}),
    # Fotografías
    "apps-home.webp":       ("icorporate_apps_home.jpg",               1000, 78, {}),
    "branding-objects.webp": ("Imagen_corporate_branding_objetos.jpg",  800, 78, {}),
    "integration-drive.webp": ("logo-drive.png", 128, 90, {}),
    "integration-docs.webp": ("logo-docs.png", 128, 90, {}),
    "integration-gmail.webp": ("logo-gmail.png", 128, 90, {}),
    "integration-notion.webp": ("logo-notion.png", 128, 90, {}),
    "integration-zapier.webp": ("logo-zapier.png", 128, 90, {}),
    "case-itaerea.webp":    ("itaerea-graduacion-2025.webp",            900, 80, {}),
    "case-alta-ccma.webp":  ("alta-ccma-2026-minimeetings.jpg",        1000, 82, {}),
    "case-alta-ccma-registration.webp": ("alta-ccma-2025-registration.jpg", 1000, 82, {}),
    "case-alta-ccma-plenary.webp":      ("alta-ccma-2025-plenary.jpg",      1000, 82, {}),
    "case-alta-ccma-gala.webp":         ("alta-ccma-2025-gala.jpg",         1000, 82, {}),
    # Logo de la conferencia en blanco para la tarjeta destacada (sin caja, sobre la foto)
    "logo-alta-ccma-white.webp": ("logo-alta-ccma.png", 400, 92, {"white": 2.6}),
    # Marcas en blanco recortadas, sin caja, para las tarjetas de casos del Home
    "case-mark-itaerea.webp": ("Logo_Itaerea.png", 300, 90, {"white": True, "trim": True}),
    "logo-alta-agm-white.webp": ("logo-alta-agm.png", 600, 92, {"white": 2.6, "trim": True}),
    # Pie de página: wordmark y figura del logo largo por separado (se componen a gran tamaño en CSS)
    "footer-wordmark.webp": ("inverseicorporate-logo-long-tag-color@2x.png", 1400, 90, {"box": (150, 135, 2040, 495), "trim": True}),
    "footer-star.webp":     ("inverseicorporate-logo-long-tag-color@2x.png", 520, 90, {"box": (2140, 95, 2635, 620), "trim": True}),
    "logo-waga-2026-white.webp": ("logo-waga-2026.png", 285, 92, {"white": 2.6}),
    "case-aci-lac.webp":    ("aci-lac-waga-2026.jpg",                   1000, 82, {}),
    "tech-itask.webp":      ("itask-dashboard.png",                     1200, 82, {}),
    # Tech Solutions, cajas de servicios: foto de la sala del ALTA AGM (Event Tech) y captura de la web del foro (Web Solutions)
    "svc-event-conference.webp": ("event-solution.jpeg",                    640, 80, {}),
    "svc-web-alta.webp":        ("screencapture-forum-alta-aero-2026-10-22-21_08_03.jpg", 720, 80, {}),
    # captura de la app de WAGA 2026 en un iPhone, recortada al teléfono y sin el fondo blanco (celular del frente en Tech Solutions)
    "svc-app-waga.webp":    ("waga-app.jpg",                            520, 84, {"box": (380, 0, 1700, 2490), "clearbg": True, "trim": True, "cutbottom": 11}),
    # el mismo iPhone con la pantalla vaciada (transparente, conserva la isla): detrás se pone un degradado en CSS.
    # coordenadas sobre la salida de 520 px: (izq, arriba, der, abajo, radio) de la pantalla y de la isla
    # capturas reales de la app de ALTA para las pantallas de los teléfonos de atrás (Tech Solutions)
    "svc-app-alta-home.webp":   ("agenda-forum-app.jpeg",               360, 82, {}),
    "svc-app-alta-agenda.webp": ("alta-app.jpeg",                       360, 82, {}),
    "svc-phone-frame.webp": ("waga-app.jpg",                            520, 84, {"box": (380, 0, 1700, 2490), "clearbg": True, "trim": True, "cutbottom": 11,
                                                                                 "screenhole": {"screen": (26, 24, 494, 1062, 64), "island": (189, 37, 331, 77, 20)}}),
    "events-hero.webp":     ("alta-agm-opening-ceremony.jpg",           1800, 74, {"blur": EVENTS_BLUR}),
    # blur: logo de un tercero en la mochila (coordenadas del original de 2000x1333)
    # Retratos del equipo (avatar de 92 px) con el fondo reemplazado por el azul de marca (ver make_portrait).
    # Alberto y Maria salen de la foto del equipo (about-hero-team.jpg, box = recorte en píxeles); Alejandro y Alexandra,
    # de los recortes entregados (de la misma foto ya reencuadrados), que dieron un contorno más limpio.
    "team-alberto-cortes.webp":  ("about-hero-team.jpg", 240, 88, {"box": (710, 430, 890, 640),  "portrait": {"rx": 0.34}}),
    "team-maria-piegari.webp":   ("about-hero-team.jpg", 240, 88, {"box": (325, 430, 505, 640),  "portrait": {"rx": 0.36}}),
    "team-alejandro-ortiz.webp": ("team-alejandro-ortiz.png", 240, 88, {"portrait": {"rx": 0.39, "cuts": [(0.62, 0.16, 0.82, 0.34)]}}),
    "team-alexandra-ortiz.webp": ("team-alexandra-ortiz.png", 240, 88, {"portrait": {"cx": 0.62, "rx": 0.30, "cuts": [(0.30, 0.0, 0.85, 0.285), (0.745, 0.55, 1.0, 1.0)]}}),
    "about-hero.webp":      ("alta-agm-opening-ceremony.jpg",           1800, 74, {"blur": EVENTS_BLUR}),
    "branding-hero.webp":   ("branding-hero.jpg",                       1800, 72, {"blur": [(925, 812, 1110, 884)]}),
    "events-card.webp":     ("alta-agm-opening-ceremony.jpg",           800, 76, {"blur": EVENTS_BLUR}),
    "ibot-icon-clear.webp": ("icono-ibot.jpg",                          300, 92, {"clearbg": True}),
}
# Íconos PNG (los navegadores los piden en PNG): salida -> (original, lado)
ICONS = {
    "favicon-32.png": ("icon_icorporate_300x300.png", 32),
    "apple-touch-icon.png": ("icon_icorporate_300x300.png", 180),
}


def to_light(im):
    """Texto oscuro/gris del logo -> blanco, conserva el isotipo de color."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and max(r, g, b) < 170 and max(r, g, b) - min(r, g, b) < 50:
                px[x, y] = (255, 255, 255, a)
    return im


def to_white(im, gain=1.25):
    """Logo -> blanco sobre transparente. alpha = alpha_original * oscuridad (1 - luminancia).
    gain mayor opaca más los tonos medios (logos con color, como el de ALTA CCMA)."""
    r, g, b, alpha = im.split()
    lum = Image.merge("RGB", (r, g, b)).convert("L")
    dark = lum.point(lambda v: min(255, int((255 - v) * gain)))
    new_alpha = ImageChops.multiply(alpha, dark)
    out = Image.new("RGBA", im.size, (255, 255, 255, 0))
    out.putalpha(new_alpha)
    return out


def to_white_solid(im):
    """Logo a color sobre fondo blanco -> blanco sólido sobre transparente: alpha según cuánto se
    aleja cada píxel del blanco (canal mínimo), así los tonos claros y saturados (cian, verde) no quedan huecos."""
    r, g, b, alpha = im.split()
    low = ImageChops.darker(ImageChops.darker(r, g), b)
    new_alpha = ImageChops.multiply(alpha, low.point(lambda v: min(255, int((255 - v) * 2.2))))
    out = Image.new("RGBA", im.size, (255, 255, 255, 0))
    out.putalpha(new_alpha)
    return out


def blur_boxes(im, boxes, radius=4, feather=8):
    """Desenfoca zonas (x0, y0, x1, y1 en píxeles del original), p. ej. logos de terceros, con borde suave."""
    for x0, y0, x1, y1 in boxes:
        region = im.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(radius))
        mask = Image.new("L", region.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((feather // 2, feather // 2, region.width - feather // 2,
                                                region.height - feather // 2), radius=feather, fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(feather / 2))
        im.paste(region, (x0, y0), mask)
    return im


PORTRAIT_BG = (3, 127, 217)  # azul de marca (#037FD9)


def _hsv(a):
    mx = a.max(axis=2) / 255.0
    mn = a.min(axis=2) / 255.0
    r, g, b = (a[..., i] / 255.0 for i in range(3))
    d = mx - mn + 1e-9
    h = np.zeros_like(mx)
    m = mx == r
    h[m] = ((g - b)[m] / d[m]) % 6
    m = (mx == g) & ~(mx == r)
    h[m] = ((b - r)[m] / d[m]) + 2
    m = (mx == b) & ~(mx == r) & ~(mx == g)
    h[m] = ((r - g)[m] / d[m]) + 4
    return h * 60, d / (mx + 1e-9), mx


def _dilate(m, it=1):
    for _ in range(it):
        p = np.pad(m, 1)
        m = m | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    return m


def make_portrait(im, cx=0.5, rx=0.46, cuts=(), size=240):
    """Retrato sobre azul de marca a partir de un fotograma con pantalla azul de fondo.

    Sin librerías de IA: se separa el fondo por color (azul saturado + letras blancas pegadas a él), se
    conserva la persona (componente conexa en una elipse centrada en cx) y se compone sobre PORTRAIT_BG.
    cx/rx: centro y semiancho (fracción del ancho) de la persona; cuts: rectángulos (x0,y0,x1,y1 en
    fracciones) que se fuerzan a fondo (restos de letras u otras personas). Sube x3 con suavizado y
    una máscara de enfoque ligera; la fuente es pequeña, así que no inventa detalle."""
    im = im.convert("RGB")
    a = np.asarray(im).astype(float)
    H, W = a.shape[:2]
    h, s, v = _hsv(a)
    blue = (h > 195) & (h < 258) & (s > 0.55) & (v > 0.42)
    yy, xx = np.mgrid[0:H, 0:W]
    face = ((xx - W * cx) / (W * 0.19)) ** 2 + ((yy - H * 0.40) / (H * 0.28)) ** 2 < 1
    torso = (yy > H * 0.62) & (np.abs(xx - W * cx) < W * 0.24)
    prot = face | torso
    white = (s < 0.30) & (v > 0.72)
    grow = blue.copy()
    for _ in range(16):
        grow = (_dilate(grow) & white & ~prot) | grow
    fg = ~grow
    person = ((xx - W * cx) / (W * rx)) ** 2 + ((yy - H * 0.78) / (H * 0.62)) ** 2 < 1
    fg &= person

    def cut(m):
        for x0, y0, x1, y1 in cuts:
            m[int(H * y0):int(H * y1), int(W * x0):int(W * x1)] = False
        return m
    fg = cut(fg)
    for _ in range(2):
        fg = ~_dilate(~fg)
    for _ in range(2):
        fg = _dilate(fg)
    fg = cut(fg & person)
    for _ in range(2):
        p = np.pad(fg.astype(int), 1)
        fg = sum(p[i:i + H, j:j + W] for i in range(3) for j in range(3)) >= 5
    cy, cxp = int(H * 0.45), int(W * cx)
    seed = (cy, cxp)
    if not fg[seed]:
        ys, xs = np.nonzero(fg)
        k = np.argmin((ys - cy) ** 2 + (xs - cxp) ** 2)
        seed = (ys[k], xs[k])
    lab = np.zeros((H, W), bool)
    q = deque([seed])
    lab[seed] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and fg[ny, nx] and not lab[ny, nx]:
                lab[ny, nx] = True
                q.append((ny, nx))
    scale = 3
    big = im.resize((W * scale, H * scale), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
    alpha = Image.fromarray((lab * 255).astype("uint8")).resize(big.size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(scale * 0.7))
    out = Image.composite(big, Image.new("RGB", big.size, PORTRAIT_BG), alpha)
    side = min(out.size)
    left = int(min(max(out.width * cx - side / 2, 0), out.width - side))
    sq = out.crop((left, 0, left + side, side))
    # encuadre más cerrado (cara y hombros): 78 % del cuadro, anclado arriba y centrado en la persona
    inner = int(side * 0.78)
    ix = (side - inner) // 2
    return sq.crop((ix, int(side * 0.02), ix + inner, int(side * 0.02) + inner)).resize((size, size), Image.LANCZOS).convert("RGBA")


def unmatte(im):
    """Quita el fondo blanco de un logo sin transparencia: alpha = 1 - mínimo canal, color recalculado."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            al = 255 - min(r, g, b)
            if al == 0:
                px[x, y] = (255, 255, 255, 0)
            else:
                f = lambda c: max(0, min(255, round(255 - (255 - c) * 255 / al)))
                px[x, y] = (f(r), f(g), f(b), min(a, al))
    return im


def clear_background(im):
    """Quita solo el fondo blanco exterior (conectado a las esquinas); el blanco interior del dibujo se conserva.
    Los píxeles del borde se desmatizan para evitar el halo blanco."""
    from PIL import ImageDraw, ImageFilter
    rgb = im.convert("RGB")
    r, g, b = rgb.split()
    mn = ImageChops.darker(ImageChops.darker(r, g), b)
    flood = mn.point(lambda v: 255 if v >= 225 else 0)
    w, h = flood.size
    for xy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if flood.getpixel(xy) == 255:
            ImageDraw.floodfill(flood, xy, 128)
    outer = flood.point(lambda v: 255 if v == 128 else 0)
    zone = outer.filter(ImageFilter.MaxFilter(7))          # franja de borde alrededor del fondo
    out = Image.new("RGBA", im.size)
    px, po, pz, pm = out.load(), outer.load(), zone.load(), mn.load()
    src = rgb.load()
    for y in range(h):
        for x in range(w):
            if po[x, y]:
                continue                                    # fondo exterior: transparente
            cr, cg, cb = src[x, y]
            if pz[x, y]:
                al = max(1, 255 - pm[x, y])
                f = lambda c: max(0, min(255, round(255 - (255 - c) * 255 / al)))
                px[x, y] = (f(cr), f(cg), f(cb), al if pm[x, y] > 40 else 255)
            else:
                px[x, y] = (cr, cg, cb, 255)
    return out


def punch_screen(im, screen, island):
    """Vacía la pantalla de un teléfono (alpha 0 dentro del rectángulo redondeado), conservando la isla.
    El borde se suaviza con una máscara a 4x para que no se vea dentado."""
    from PIL import ImageDraw
    k = 4
    mask = Image.new("L", (im.width * k, im.height * k), 0)
    d = ImageDraw.Draw(mask)
    l, t, r, b, rad = (v * k for v in screen)
    d.rounded_rectangle((l, t, r, b), radius=rad, fill=255)
    il, it, ir, ib, irad = (v * k for v in island)
    d.rounded_rectangle((il, it, ir, ib), radius=irad, fill=0)
    mask = mask.resize(im.size, Image.LANCZOS)
    alpha = ImageChops.multiply(im.split()[3], mask.point(lambda v: 255 - v))
    im = im.copy()
    im.putalpha(alpha)
    return im


def resize(im, width):
    if im.width <= width:
        return im
    h = round(im.height * width / im.width)
    # RGBa = premultiplicado: evita halos oscuros en los bordes translúcidos
    return im.convert("RGBa").resize((width, h), Image.LANCZOS).convert("RGBA")


def main():
    DST.mkdir(parents=True, exist_ok=True)
    total_in = total_out = 0
    for out, (name, width, quality, opts) in JOBS.items():
        src = SRC / name
        im = Image.open(src).convert("RGBA")
        if opts.get("box"):
            im = im.crop(opts["box"])
        if opts.get("portrait") is not None:
            im = make_portrait(im, **opts["portrait"])
        if opts.get("blur"):
            im = blur_boxes(im, opts["blur"])
        if opts.get("square"):  # recorte cuadrado (retratos): "top" conserva la parte alta, "center" el centro
            side = min(im.size); left = (im.width - side) // 2
            top = 0 if opts["square"] == "top" else (im.height - side) // 2
            im = im.crop((left, top, left + side, top + side))
        if opts.get("crop"):
            im = im.crop(im.split()[3].getbbox())
        if opts.get("light"):
            im = to_light(im)
        if opts.get("clearbg"):
            im = clear_background(im)
        if opts.get("unmatte"):
            im = unmatte(im)
        if opts.get("solid"):
            im = to_white_solid(im)
        if opts.get("white"):
            im = to_white(im) if opts["white"] is True else to_white(im, opts["white"])
        if opts.get("trim"):
            im = im.crop(im.split()[3].getbbox())
        im = resize(im, width)
        if opts.get("cutbottom"):  # filas finales (px de salida) con restos de sombra/reflejo del original
            im = im.crop((0, 0, im.width, im.height - opts["cutbottom"]))
        if opts.get("screenhole"):
            im = punch_screen(im, **opts["screenhole"])
        has_alpha = src.suffix.lower() == ".png" or opts.get("clearbg", False) or opts.get("solid", False) or opts.get("unmatte", False)
        if not has_alpha:
            im = im.convert("RGB")
        im.save(DST / out, "WEBP", quality=quality, method=6)
        a, b = src.stat().st_size, (DST / out).stat().st_size
        total_in += a; total_out += b
        print(f"{out:26} {im.width:>4}x{im.height:<4} {a/1024:7.1f} KB -> {b/1024:6.1f} KB")
    for out, (name, side) in ICONS.items():
        im = Image.open(SRC / name).convert("RGBA").resize((side, side), Image.LANCZOS)
        im.save(DST / out, "PNG", optimize=True)
        print(f"{out:26} {side:>4}x{side:<4} {'':>10}    {(DST / out).stat().st_size/1024:6.1f} KB")
    print(f"\nTotal imágenes del sitio: {total_in/1024:.0f} KB -> {total_out/1024:.0f} KB "
          f"({100 - 100*total_out/total_in:.0f}% menos)")


if __name__ == "__main__":
    main()
