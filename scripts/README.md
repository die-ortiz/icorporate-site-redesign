# scripts/

Herramientas de desarrollo. Ninguna se sube al servidor y ninguna es necesaria para que el sitio funcione:
el sitio publicado es HTML/CSS/JS estático.

| Script | Para qué | Cuándo correrlo |
|---|---|---|
| `serve.py` | Servidor local (puerto 8000, sin caché, `/` va a `/mockup/`). | Para ver el sitio mientras se edita. Reiniciar si se cambia `serve.py`. |
| `check_site.py` | Revisa enlaces, anclas, imágenes, `alt`, `noopener`, ids, H1, paridad EN/ES, SEO básico, cabecera/footer sincronizados y clases CSS sin uso. | **Antes de cada commit** y antes de publicar. Sale con 1 si hay errores. |
| `sync_chrome.py` | Cabecera, mega-menú y footer (fuente única en `partials/`) y los `<script>` de cada página (según el marcado, ver `FEATURES`). | Después de editar `partials/` o de agregar a una página un componente con JS. Con `--check` solo verifica. |
| `style_snapshot.js` | Captura estilos computados de todas las páginas a 3 anchos, para comprobar que un refactor no cambia nada visible. | Antes y después de refactorizar CSS/HTML. Ver instrucciones en el archivo. |
| `optimize_images.py` | Genera WebP en `assets/img/` desde los originales de `reference/img-originals/`. | Al agregar o cambiar una imagen. Revisar con `git status` que no se modifique `favicon-32.png` sin motivo. |
| `optimize_video.sh` | Genera `assets/video/<nombre>.mp4` y su póster. | Al agregar un video de fondo. |

## Flujo recomendado para un cambio

1. Rama por tema (`git checkout -b nombre-del-tema`).
2. Editar. Si el cambio toca cabecera, mega-menú o footer: editar **solo** `scripts/partials/` y correr
   `python3 scripts/sync_chrome.py`.
3. `python3 scripts/check_site.py` (debe terminar sin errores).
4. Si el cambio es un refactor y no debería verse distinto: comparar con `style_snapshot.js`.
5. Commit y merge a `main` con `--no-ff` cuando se apruebe.
