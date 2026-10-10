#!/usr/bin/env python3
"""Optimiza las imágenes del sitio antes de publicarlas.

Lee los originales de reference/img-originals/ (no se publican) y escribe las
versiones listas para web en assets/img/ (WebP, tamaño acorde al uso real).
Para agregar una imagen nueva: dejar el original en reference/img-originals/,
sumarla a JOBS y volver a correr:  python3 scripts/optimize_images.py
Requiere Pillow con soporte WebP.
"""
from pathlib import Path
from PIL import Image

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
    "client-aviatdo.webp": ("aviatdo.png",       300, 88, {}),
    # Fotografías
    "apps-home.webp":       ("icorporate_apps_home.jpg",               1000, 78, {}),
    "branding-objects.webp": ("Imagen_corporate_branding_objetos.jpg",  800, 78, {}),
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
        im = resize(im, width)
        has_alpha = src.suffix.lower() == ".png"
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
