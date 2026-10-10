#!/usr/bin/env bash
# Comprime un video para usarlo de fondo del hero.
# Uso:  scripts/optimize_video.sh ruta/al/video-original.mp4
# Salida: assets/video/hero.mp4  (H.264, 1280px de ancho máx., sin audio, 24 fps, faststart)
# Recomendado: clip de 8 a 15 s en bucle, sin texto, planos lentos. Objetivo: < 4 MB.
set -euo pipefail
in="${1:?Falta el archivo de entrada. Uso: scripts/optimize_video.sh video.mp4}"
root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/assets/video/hero.mp4"
mkdir -p "$root/assets/video"
ffmpeg -y -i "$in" -t 15 -an \
  -vf "scale='min(1280,iw)':-2,fps=24" \
  -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart "$out"
echo "Listo: $out ($(du -h "$out" | cut -f1))"
