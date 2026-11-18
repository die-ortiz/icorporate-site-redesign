# iCorporate: rediseño de icorporatelab.com

Contexto para Claude Code. El detalle técnico (tabla de JS, enlaces externos permitidos, SEO, video, WebGL, publicación) está en `docs/notas-tecnicas.md`: leer solo la sección que toque la tarea.

## Qué es
Rediseño del sitio corporativo de iCorporate (Tech Solutions, Events Management, Corporate Branding). El actual es WordPress + Elementor. **Se arma por fuera**: se construye, se aprueba y recién ahí se publica. No tocar el WordPress ni el servidor sin aprobación.

## Decisiones tomadas
- **Objetivo:** reuniones/leads y credibilidad (casos y clientes reales), con el mismo peso. Aviación como caso estrella (ALTA, ACI-LAC, IATA, SITA, HEICO), abierto a otros sectores.
- **Base técnica:** HTML/CSS/JS estático, sin framework ni build; se sube por SSH. `scripts/` son herramientas de desarrollo, nada corre en el servidor.
- **Alcance:** sitio completo bilingüe EN/ES. Blog: fase posterior, no construirlo.
- **Contacto:** sin formularios por correo ni servicios externos (sin Calendly). Home (`#contact`) y cada servicio (`#proposal`) ofrecen tres vías (agendar llamada, WhatsApp, correo) y la tarjeta del iBot (`[data-bot-contact]`, necesidades por página con `data-bot-needs`). "Agendar" es un pedido de día y franja que el equipo confirma; hoy el iBot es una demo que no envía nada. Respuesta publicada: menos de 2 días hábiles. Antes de publicar hay que conectarlo al bot del proveedor o a un endpoint propio.
- **Identidad:** logo y paleta (azul `#037FD9`, cian `#06BDE7`, lima `#BDCC26`, casi negro `#101010` = `--dark`; el navy `#05142B` se retiró). Tipografía Sora (títulos) + Inter (texto) + JetBrains Mono (etiquetas), con `body.theme-a`; H1-H3 en peso 400. Fuentes alojadas en `assets/fonts/` (sección 11 de `styles.css`, preload de Inter y Sora), no Google Fonts.
- **Menú:** solo enlaces a páginas, sin desplegables ni secciones (pedido del jefe, 2026-11-11): Tech Solutions, Events Management, Corporate Branding, About us y "Book a call". "Our team" solo en footer y About. En móvil, una línea de detalle por ítem (`.nav__hint`). Footer: Servicios, Empresa (About us, Our team, tienda) y Contacto.
- **Enlaces externos:** un CTA primario ("Book a call") y nada que salga del sitio, salvo las 6 excepciones de `docs/notas-tecnicas.md` (siempre en pestaña nueva con `rel="noopener"`).
- **Contenido:** se reescriben todos los textos. Pendiente quién valida EN/ES.
- **Mockup = muestra visual:** textos, fotos, equipo, testimonios y logos de integraciones de ejemplo llevan `.sample-tag` ("Example content" / "Contenido de ejemplo"). Reemplazar antes de publicar.

## Mapa del sitio
| Página | Estado |
|---|---|
| Home, Tech Solutions, Events Management, Corporate Branding, About | Hechas (EN/ES) |
| Casos (listado y detalle: WAGA, ALTA, ACI-LAC…) | **Pendiente** |
| Contacto | Sección del Home (`#contact`) y de cada servicio (`#proposal`) |
| 404 | Hecha (EN/ES, `noindex`); falta `ErrorDocument` al publicar |
| Blog | No iniciar |

## Requisitos transversales
- Mobile-first, carga rápida, accesibilidad básica, SEO completo por página (ver notas).
- Imágenes: originales en `reference/img-originals/` (no se publican) → WebP en `assets/img/` con `python3 scripts/optimize_images.py`. Siempre `width`/`height`, y `loading="lazy"` bajo el primer pantallazo.
- Efectos (video, WebGL): se pausan fuera de pantalla, respetan movimiento reducido y siguen la receta de rendimiento de las notas. Un efecto va sobre una sección que ya existe por su contenido; no se crean secciones para lucirlo.

## Estructura y fuentes únicas
```
mockup/, mockup/es/  Sitio de muestra EN y ES (mismos nombres de archivo)
assets/css/          styles.css: hoja única, 12 secciones marcadas con "═══ NN ·"
assets/js/           un módulo por función (tabla en docs/notas-tecnicas.md)
assets/img|video|fonts
scripts/             herramientas (scripts/README.md); scripts/partials/ = cabecera y footer
docs/                notas de consulta (no se publican)
reference/           originales y referencia (no se publica)
index.html, es/      marcadores de posición; la raíz redirige a /mockup/
dist/                salida de publish.py (ignorada)
```
**No editar la copia generada:**

| Qué | Se edita en | Se propaga con |
|---|---|---|
| Cabecera, footer | `scripts/partials/{header,footer}.{en,es}.html` | `sync_chrome.py` |
| `<script>` de cada página | Se deducen del marcado (`FEATURES` en `sync_chrome.py`) | `sync_chrome.py` |
| Open Graph / Twitter | `<title>`, description y canonical | `sync_chrome.py` |
| Imágenes WebP | `reference/img-originals/` + `JOBS` en `optimize_images.py` | `optimize_images.py` |
| Colores, radios, degradados | Variables en `:root` de `styles.css` | Automático |
| `sitemap.xml`, `robots.txt` | Se generan | `publish.py` |

## Leer con economía
- `styles.css` (~180 KB) y las páginas HTML (~30-47 KB) **nunca se leen enteros**. Ubicar primero con `grep -n` (la clase, el id o `═══` para el mapa de secciones) y leer solo ese tramo con `offset`/`limit`.
- Para cambios EN/ES, hacer el cambio en EN y replicarlo en ES buscando el mismo id, sin releer la página ES completa.
- No abrir `assets/js/vendor/`, `dist/` ni `reference/img-originals/`.
- Verificar en el navegador con `read_page`/`get_page_text`; capturas solo para revisar algo visual.

## Convenciones de código
- **CSS**: colores, radios y degradados por variable (`--blue`, `--cyan`, `--on-dark`, `--radius`, `--grad-btn`…), sin hex sueltos. BEM. Un solo botón primario (`.btn--primary`, cian sólido con texto oscuro) que nadie redefine. Las reglas de un componente van juntas bajo su sección.
- **Radios**: cajas `--radius` (12 px), elementos pequeños 8-10 px, píldoras 999 px.
- **HTML**: un `<h1>` por página; `<img>` con `alt`, `width` y `height`; `target="_blank"` con `rel="noopener"`; ids idénticos en EN y ES (`check_site.py` falla si difieren).
- **JS**: módulos ES sin globales, con guarda si falta el elemento, respetando `prefers-reduced-motion`; se activan por `data-*` o clases documentadas en el encabezado del archivo.

## Si cambias X, toca Y
| Cambias… | Actualiza también… |
|---|---|
| Menú o footer | Solo `scripts/partials/` (EN y ES) y corre `sync_chrome.py` |
| El ancla `#team` de About | `scripts/partials/footer.*.html`; luego `sync_chrome.py` |
| Agregas una página | Versión ES también; `PAGES` y el sitemap se alimentan solos |
| Agregas un componente con JS | Su módulo, la expresión en `FEATURES`, `sync_chrome.py` y la tabla de `docs/notas-tecnicas.md` |
| Un color o radio | La variable en `:root` |
| Agregas una imagen | Original, entrada en `JOBS`, `optimize_images.py`, `width`/`height` |
| Título o descripción | `sync_chrome.py` y revisar el `<title>` ES |

## Cómo trabajar
- Ediciones mínimas y dirigidas; no reescribir archivos enteros sin motivo.
- Probar con `python3 scripts/serve.py` (puerto 8000, sin caché; reiniciar si cambia `serve.py`).
- Antes de cada commit: `python3 scripts/check_site.py` sin errores. Refactors invisibles: comparar con `scripts/style_snapshot.js` (ver `scripts/README.md`).
- Una rama por tema; merge a `main` con `--no-ff` cuando el usuario lo apruebe y borrar la rama. Sin push hasta que se pida.
- Partes generadas del HTML marcadas con `<!-- chrome|social|scripts: … -->`.
- Responder y comentar en español; código y nombres de archivo en inglés.
- Antes de decidir diseño o textos nuevos, mostrar una propuesta corta.
- Publicar: `publish.py` → revisar `dist/` → subir por SSH **solo con aprobación** (pasos en las notas).

## Datos del sitio actual
- iCorporate, 1313 Ponce de Leon Blvd, Suite 201, Coral Gables, FL 33134 (solo en schema.org y About). Tel: +1 954 770 1738.
- LinkedIn e Instagram `icorporatemarketing`, YouTube `@icorporatemarketingevents4248`.
- Titular actual (a reemplazar): "Innovative Solutions for a New Era".
