#!/usr/bin/env python3
"""Genera assets/img/office-map.svg: mapa de puntos estilizado de Florida y el Caribe para la tarjeta de la oficina (About).

Las costas son polígonos aproximados a mano (lon, lat): alcanzan para un mapa de puntos, no para ubicar nada con precisión.
La proyección es equirrectangular con corrección por la latitud media. El pin de Coral Gables no está en el SVG: lo dibuja
el HTML (.office-card__pin) en la posición que imprime este script, para poder animarlo.

Uso: python3 scripts/make_office_map.py
"""
from math import cos, radians
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "img" / "office-map.svg"
LON0, LON1, LAT0, LAT1 = -88.0, -73.5, 20.0, 31.0
W = 600
KX = cos(radians((LAT0 + LAT1) / 2))
H = round(W * (LAT1 - LAT0) / ((LON1 - LON0) * KX))
STEP = 9  # separación de los puntos, en px del SVG
PIN = (-80.27, 25.72)  # Coral Gables

MAINLAND = [(-88, 31.5), (-88, 30.4), (-87.5, 30.3), (-86.5, 30.4), (-85.4, 29.7), (-84.4, 29.9), (-83.7, 29.9),
            (-83.0, 29.1), (-82.8, 28.5), (-82.7, 27.5), (-81.9, 26.5), (-81.8, 26.1), (-81.1, 25.1), (-80.5, 25.3),
            (-80.15, 25.75), (-80.1, 26.1), (-80.03, 26.7), (-80.6, 28.4), (-81.0, 29.2), (-81.4, 30.3), (-81.4, 31.1),
            (-80.9, 31.5)]
CUBA = [(-84.95, 21.87), (-84.0, 22.9), (-83.0, 23.0), (-82.4, 23.15), (-81.5, 23.1), (-80.6, 23.1), (-79.5, 22.6),
        (-78.4, 22.4), (-77.3, 21.8), (-76.3, 21.3), (-75.6, 21.0), (-74.15, 20.25), (-74.5, 20.05), (-75.6, 19.9),
        (-77.0, 19.85), (-77.7, 19.85), (-77.7, 20.6), (-78.6, 21.6), (-79.6, 21.7), (-80.5, 22.0), (-81.4, 22.2),
        (-82.0, 22.35), (-82.9, 22.6), (-83.6, 22.1), (-84.4, 21.8)]
# islas chicas: (lon, lat, radio lon, radio lat); cada una lleva al menos un punto
ISLANDS = [(-82.8, 21.7, .3, .2), (-78.3, 26.65, .45, .12), (-77.2, 26.4, .15, .4), (-78.0, 24.4, .3, .5),
           (-77.4, 25.05, .1, .1), (-76.3, 25.2, .1, .5), (-76.1, 23.7, .1, .4), (-75.5, 24.3, .08, .35),
           (-75.1, 23.2, .08, .35), (-80.4, 25.0, .1, .1), (-80.9, 24.75, .1, .08), (-81.5, 24.62, .1, .08)]


def xy(lon, lat):
    return (lon - LON0) / (LON1 - LON0) * W, (LAT1 - lat) / (LAT1 - LAT0) * H


def inside(poly, lon, lat):
    hit = False
    for (x0, y0), (x1, y1) in zip(poly, poly[1:] + poly[:1]):
        if (y0 > lat) != (y1 > lat) and lon < x0 + (lat - y0) * (x1 - x0) / (y1 - y0):
            hit = not hit
    return hit


def land(lon, lat):
    return (inside(MAINLAND, lon, lat) or inside(CUBA, lon, lat)
            or any(((lon - x) / rx) ** 2 + ((lat - y) / ry) ** 2 <= 1 for x, y, rx, ry in ISLANDS))


def main():
    dots = set()
    for j in range(H // STEP + 1):
        for i in range(W // STEP + 1):
            x, y = i * STEP + STEP / 2, j * STEP + STEP / 2
            lon = LON0 + x / W * (LON1 - LON0)
            lat = LAT1 - y / H * (LAT1 - LAT0)
            if land(lon, lat):
                dots.add((x, y))
    for lon, lat, _, _ in ISLANDS:  # la isla más chica igual se ve: un punto en su centro, alineado a la grilla
        x, y = xy(lon, lat)
        dots.add((round((x - STEP / 2) / STEP) * STEP + STEP / 2, round((y - STEP / 2) / STEP) * STEP + STEP / 2))
    circles = "".join(f'<circle cx="{x:g}" cy="{y:g}" r="1.6"/>' for x, y in sorted(dots))
    OUT.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
                   f'<g fill="#ffffff" fill-opacity=".26">{circles}</g></svg>\n')
    px, py = xy(*PIN)
    print(f"{OUT.name}: {W}x{H}, {len(dots)} puntos, {OUT.stat().st_size / 1024:.1f} KB")
    print(f"pin de Coral Gables: left {px / W * 100:.1f}%  top {py / H * 100:.1f}%")


if __name__ == "__main__":
    main()
