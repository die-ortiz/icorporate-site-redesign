#!/usr/bin/env python3
"""Optimiza las imágenes del sitio antes de publicarlas.

Lee los originales de reference/img-originals/ (no se publican) y escribe las
versiones listas para web en assets/img/ (WebP, tamaño acorde al uso real).
Para agregar una imagen nueva: dejar el original en reference/img-originals/,
sumarla a JOBS y volver a correr:  python3 scripts/optimize_images.py
Requiere Pillow con soporte WebP.
"""
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "reference" / "img-originals"
DST = ROOT / "assets" / "img"

# salida -> (original, ancho máximo, calidad, opciones)
JOBS = {
    # Logo de marca, recortado al contenido. "light" = versión oficial para fondos oscuros.
    # (opción {"light": True} recolorea texto oscuro a blanco, solo como respaldo)
    "logo.webp":       ("image001-scaled.png", 480, 90, {"crop": True}),
    "logo-light.webp": ("inverseicorporate-logo-long-tag-color@2x.png", 480, 90, {"crop": True}),
    # Logos de clientes (se muestran a ~150x100; 300x200 cubre pantallas 2x)
    "client-alta.webp":    ("Logo_alta.png",    300, 88, {}),
    "client-aci-lac.webp": ("Logo_Acilac.png",  300, 88, {}),
    "client-iata.webp":    ("Logo_Iata.png",    300, 88, {}),
    "client-sita.webp":    ("Logo_sita.png",    300, 88, {}),
    "client-heico.webp":   ("Logo_Heico.png",   300, 88, {}),
    "client-itaerea.webp": ("Logo_Itaerea.png", 300, 88, {}),
    "client-aviatdo.webp": ("aviatdo.png",       300, 88, {"unmatte": True}),
    # Versiones blancas (carrusel sobre fondo oscuro): la luminosidad pasa a transparencia,
    # así se conservan los detalles internos del logo y el fondo blanco opaco desaparece
    "client-alta-white.webp":    ("Logo_alta.png",    300, 90, {"white": True}),
    "client-aci-lac-white.webp": ("Logo_Acilac.png",  300, 90, {"white": True}),
    "client-iata-white.webp":    ("Logo_Iata.png",    300, 90, {"white": True}),
    "client-sita-white.webp":    ("Logo_sita.png",    300, 90, {"white": True}),
    "client-heico-white.webp":   ("Logo_Heico.png",   300, 90, {"white": True}),
    "client-itaerea-white.webp": ("Logo_Itaerea.png", 300, 90, {"white": True}),
    "client-aviatdo-white.webp": ("aviatdo.png",      300, 90, {"white": True}),
    # Fotografías
    "apps-home.webp":       ("icorporate_apps_home.jpg",               1000, 78, {}),
    "branding-objects.webp": ("Imagen_corporate_branding_objetos.jpg",  800, 78, {}),
    "ibot-icon.webp":       ("icono-ibot.jpg",                          160, 90, {}),
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
    "case-aci-lac.webp":    ("aci-lac-waga-2026.jpg",                   1000, 82, {}),
    "tech-itask.webp":      ("itask-dashboard.png",                     1200, 82, {}),
    "events-hero.webp":     ("alta-agm-opening-ceremony.jpg",           1800, 74, {}),
    "events-card.webp":     ("alta-agm-opening-ceremony.jpg",           800, 76, {}),
    "ibot-icon-clear.webp": ("icono-ibot.jpg",                          300, 92, {"clearbg": True}),
    "events-stage.webp":    ("icorporate_event_tech_home.jpg",         725, 80, {}),
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


def to_white(im):
    """Logo -> blanco sobre transparente. alpha = alpha_original * oscuridad (1 - luminancia)."""
    r, g, b, alpha = im.split()
    lum = Image.merge("RGB", (r, g, b)).convert("L")
    dark = lum.point(lambda v: min(255, int((255 - v) * 1.25)))
    new_alpha = ImageChops.multiply(alpha, dark)
    out = Image.new("RGBA", im.size, (255, 255, 255, 0))
    out.putalpha(new_alpha)
    return out


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
        if opts.get("crop"):
            im = im.crop(im.split()[3].getbbox())
        if opts.get("light"):
            im = to_light(im)
        if opts.get("clearbg"):
            im = clear_background(im)
        if opts.get("unmatte"):
            im = unmatte(im)
        if opts.get("white"):
            im = to_white(im)
        im = resize(im, width)
        has_alpha = src.suffix.lower() == ".png" or opts.get("clearbg", False)
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
