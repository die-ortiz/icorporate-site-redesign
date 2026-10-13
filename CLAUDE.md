# iCorporate: rediseño de icorporatelab.com

Contexto para Claude Code. Leer completo antes de tocar nada.

## Qué es
Rediseño completo del sitio corporativo de iCorporate (agencia: Tech Solutions, Events Management, Corporate Branding). El sitio actual es WordPress + Elementor y se ve anticuado. **Este rediseño se arma por fuera del sitio actual**: se construye, se presenta para aprobación y, si se aprueba, se publica. No tocar el WordPress ni el servidor hasta tener aprobación.

## Decisiones tomadas
- **Objetivo:** generar reuniones/leads y demostrar credibilidad (casos y clientes reales), con el mismo peso.
- **Posicionamiento:** tecnología, eventos y marca, con la aviación como caso estrella (ALTA, ACI-LAC, IATA, SITA, HEICO) y apertura a otros sectores.
- **Base técnica:** HTML/CSS/JS estático, sin framework ni build. Debe poder subirse al servidor por SSH.
- **Alcance:** sitio completo, bilingüe EN/ES.
- **Formulario y reservas:** correo directo (sin Calendly ni servicios externos por ahora).
- **Blog:** fase posterior. No construirlo en esta etapa.
- **Casos de éxito:** hay material suficiente (se entrega en `assets/img` y se redacta con el usuario).
- **Identidad visual:** se mantienen logo y paleta (azul `#037FD9`, cian `#06BDE7`, lima `#BDCC26` y el casi negro del logo `#101010` como fondo oscuro, `--dark`; el antiguo navy `#05142B` no era de marca y se retiró). La tipografía **cambió** a Sora (títulos) + Inter (texto) + JetBrains Mono (etiquetas), activa con `body.theme-a`; H1, H2 y H3 van en peso 400 (regular). Comparativa en `reference/fonts-preview.html`.
- **Menú:** los 3 servicios son ítems propios (Tech Solutions, Events Management, Corporate Branding); en escritorio (≥ 1200 px) cada uno abre un mega-menú de borde a borde: 3 columnas de enlaces a anclas de su página, un caso destacado y una barra con "Ver todo" + "Book a call". Debajo, About us y Contact. "Our team" solo en footer y About. En móvil, lista plana. El contenido del mega-menú sale de los h3 de cada página de servicio; si se renombran secciones o anclas (`#process`, `#formats`, `#numbers`, `#materials`…), actualizarlo.
- **Contenido:** se reescriben todos los textos (hoy son genéricos y vagos). Pendiente definir quién valida EN/ES.
- **Mockup = solo muestra visual:** el texto, las fotos, el equipo, los testimonios y los logos de integraciones son de ejemplo y deben llevar la etiqueta visible `.sample-tag` ("Example content" / "Contenido de ejemplo"). Reemplazar por datos reales antes de publicar.
- **Plazo:** sin fecha límite; objetivo de tener la primera versión la semana próxima.

## Mapa del sitio
| Página | Función | Estado |
|---|---|---|
| Home | Propuesta, clientes, servicios, casos destacados, contacto, CTA | Hecha (EN/ES) |
| Tech Solutions | Bots y automatización, apps, web, event tech | Hecha (EN/ES) |
| Events Management | Servicio, cifras, eventos realizados | Hecha (EN/ES) |
| Corporate Branding | Servicio y ejemplos de materiales | Hecha (EN/ES) |
| Nosotros | Equipo, enfoque, oficina en Coral Gables | Hecha (EN/ES) |
| Casos | Listado y detalle (WAGA, ALTA, ACI-LAC, etc.) | **Pendiente** |
| Contacto | Formulario (correo directo) y "Book a call" | Es una sección del Home (`#contact`) y de cada servicio (`#proposal`) |
| Blog | Fase posterior | No iniciar |

## Requisitos transversales
- Responsive mobile-first, carga rápida, accesibilidad básica.
- SEO por página: title, meta description, schema.org y hreflang EN/ES.
- Un CTA primario consistente ("Book a call"), sin salidas a sitios externos. Excepción acordada: el botón "Learn more about iBot" de Tech Solutions abre `https://icorporatelab.com/service-ibot-2/` (WordPress actual) en pestaña nueva; pasar a ruta interna cuando esa página se migre. Segunda excepción: la tienda de merchandising (iCorporate Events Store, PromoPlace: `https://www.promoplace.com/icorporate-events`) se enlaza desde la sección `#materials` de Corporate Branding, el mega-menú de Corporate Branding y el footer, siempre en pestaña nueva con `rel="noopener"`. Pendiente: URLs por categoría y confirmar "1,000s" y "desde $0.53" antes de publicar.
- Formulario de contacto funcional por correo directo (definir el método de envío en un sitio estático, por ejemplo `mailto:` o endpoint PHP en el servidor).
- Imágenes optimizadas antes de publicar: originales en `reference/img-originals/` (no se publican), salida WebP en `assets/img/` con `python3 scripts/optimize_images.py`. Siempre con `width`/`height` y `loading="lazy"` bajo el primer pantallazo.
- Video de fondo (opcional): dejar el original y correr `scripts/optimize_video.sh original.mp4 [hero|events|tech]`; genera `assets/video/<nombre>.mp4` (H.264, 1280 px, ≤ 4 MB, 8-15 s en bucle, sin audio ni texto) y su póster `<nombre>-poster.webp`. Hoy solo existe `hero.mp4` (Home). Si el archivo no existe, la cabecera usa el póster o el fondo oscuro (--dark). No se carga con movimiento reducido, ahorro de datos ni pantallas < 768px.
- Efectos WebGL (`ogl` desde CDN, con respaldo si falla): rayos en la sección de contacto (`assets/js/siderays.js`) y orbe en la cabecera de Tech Solutions (`assets/js/orb.js`). Ambos se pausan fuera de pantalla y respetan movimiento reducido.

## Estructura de carpetas
```
mockup/             Sitio de muestra para aprobación (EN)
mockup/es/          Versión en español, mismos nombres de archivo
assets/css|js|img|video   Estilos, scripts, imágenes (WebP) y video
scripts/            serve.py, check_site.py, sync_chrome.py (+ partials/), style_snapshot.js, optimize_images.py, optimize_video.sh (ver scripts/README.md)
reference/          Material de referencia y originales (no se publica)
index.html, es/     Marcadores de posición ("new site in progress"); la raíz redirige a /mockup/
```
Al publicar, el contenido de `mockup/` pasa a la raíz y `mockup/es/` a `es/` (ajustando las rutas relativas `../assets` → `assets`). Los scripts: `main.js` (menú, contadores, formularios, carrusel, diagrama de integraciones), `ibot.js` (asistente de demostración), `siderays.js`, `orb.js`.

## Datos del sitio actual (para reusar)
- Nombre: iCorporate. Dirección: 1313 Ponce de Leon Blvd, Suite 201, Coral Gables, FL 33134. Tel: +1 954 770 1738.
- Redes: LinkedIn `icorporatemarketing`, Instagram `icorporatemarketing`, YouTube `@icorporatemarketingevents4248`.
- Titular actual (a reemplazar): "Innovative Solutions for a New Era".

## Referencia técnica
`reference/SideRays.tsx` es un fondo animado WebGL (librería `ogl`) pensado para React. Si se usa en el hero, portarlo a un `<script type="module">` con `ogl` desde CDN, y corregir que reinicia el contexto WebGL al cambiar props.

## Cómo trabajar
- Ediciones mínimas y dirigidas; no reescribir archivos enteros sin motivo.
- Probar localmente con `python3 scripts/serve.py` (puerto 8000, sin caché, `/` → `/mockup/`) antes de entregar; hay que reiniciarlo si se cambia `serve.py`.
- Trabajar en una rama por tema, commitear y mergear a `main` con `--no-ff` cuando el usuario lo apruebe; borrar la rama al mergear. Sin push hasta que se pida.
- Las páginas de servicio son HTML editado a mano (los generadores eran temporales): editar los archivos directamente.
- **Cabecera, mega-menú y footer tienen una sola fuente:** `scripts/partials/{header,footer}.{en,es}.html`. No editarlos dentro de las páginas (se sobrescriben). Tras cambiar una plantilla: `python3 scripts/sync_chrome.py`. Lo único que varía entre páginas son `{{CTA_HREF}}` (ancla de "Book a call") y `{{LANG_HREF}}` (cambio de idioma); si se agrega una página, sumarla a `PAGES` en `sync_chrome.py`.
- Antes de cada commit: `python3 scripts/check_site.py` (enlaces, anclas, imágenes, EN/ES, cabecera/footer sincronizados). Para refactors que no deben cambiar nada visible, comparar con `scripts/style_snapshot.js` (instrucciones en `scripts/README.md`).
- Responder y comentar en español; el código y los nombres de archivos en inglés.
- Antes de decidir diseño o textos nuevos, mostrar una propuesta corta.
