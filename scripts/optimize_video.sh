#!/usr/bin/env bash
# Comprime un video para usarlo de fondo del hero.
# Uso:  scripts/optimize_video.sh ruta/al/video-original.mp4 [nombre]
#       nombre = hero (por defecto, la home), events o tech (cabeceras de página)
# Salida: assets/video/hero.mp4  (H.264, 1280px de ancho máx., sin audio, 24 fps, faststart)
#         assets/img/hero-poster.webp  (primer cuadro, para móvil y como póster)
# Recomendado: clip de 8 a 15 s en bucle, sin texto, planos lentos. Objetivo: < 4 MB.
set -euo pipefail
in="${1:?Falta el archivo de entrada. Uso: scripts/optimize_video.sh video.mp4}"
root="$(cd "$(dirname "$0")/.." && pwd)"
name="${2:-hero}"
out="$root/assets/video/$name.mp4"
mkdir -p "$root/assets/video"
ffmpeg -y -i "$in" -t 15 -an \
  -vf "scale='min(1280,iw)':-2,fps=24" \
  -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart "$out"
# Póster: primer cuadro, para móviles / movimiento reducido y como imagen mientras carga el video
poster="$root/assets/img/$name-poster.webp"
tmp="$(mktemp -t hero-poster).png"
ffmpeg -y -loglevel error -ss 0 -i "$in" -frames:v 1 -vf "scale='min(1280,iw)':-2" "$tmp"
if command -v cwebp >/dev/null 2>&1; then
  cwebp -quiet -q 68 "$tmp" -o "$poster"
else
  echo "Aviso: no está 'cwebp' (brew install webp); el póster no se generó." >&2
fi
rm -f "$tmp"
echo "Listo: $out ($(du -h "$out" | cut -f1))"
[ -f "$poster" ] && echo "Póster: $poster ($(du -h "$poster" | cut -f1))"
