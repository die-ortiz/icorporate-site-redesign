# iCorporate: rediseño de icorporatelab.com

Contexto para Claude Code. Leer completo antes de tocar nada.

## Qué es
Rediseño completo del sitio corporativo de iCorporate (agencia: Tech Solutions, Events Management, Corporate Branding). El sitio actual es WordPress + Elementor y se ve anticuado. **Este rediseño se arma por fuera del sitio actual**: se construye, se presenta para aprobación y, si se aprueba, se publica. No tocar el WordPress ni el servidor hasta tener aprobación.

## Decisiones tomadas
- **Objetivo:** generar reuniones/leads y demostrar credibilidad (casos y clientes reales), con el mismo peso.
- **Posicionamiento:** tecnología, eventos y marca, con la aviación como caso estrella (ALTA, ACI-LAC, IATA, SITA, HEICO) y apertura a otros sectores.
- **Base técnica:** HTML/CSS/JS estático, sin framework ni build en el sitio. Debe poder subirse al servidor por SSH. Los scripts de `scripts/` son herramientas de desarrollo; nada de ellos se ejecuta en el servidor.
- **Alcance:** sitio completo, bilingüe EN/ES.
- **Formulario y reservas:** correo directo (sin Calendly ni servicios externos por ahora).
- **Blog:** fase posterior. No construirlo en esta etapa.
- **Casos de éxito:** hay material suficiente (se entrega en `assets/img` y se redacta con el usuario).
- **Identidad visual:** se mantienen logo y paleta (azul `#037FD9`, cian `#06BDE7`, lima `#BDCC26` y el casi negro del logo `#101010` como fondo oscuro, `--dark`; el antiguo navy `#05142B` no era de marca y se retiró). La tipografía **cambió** a Sora (títulos) + Inter (texto) + JetBrains Mono (etiquetas), activa con `body.theme-a`; H1, H2 y H3 van en peso 400 (regular). Comparativa en `reference/fonts-preview.html`.
- **Menú:** los 3 servicios son ítems propios (Tech Solutions, Events Management, Corporate Branding); en escritorio (≥ 1200 px) cada uno abre un mega-menú **solo con clic** de borde a borde: 3 columnas de enlaces a anclas de su página, un caso destacado y una barra con "Ver todo" + "Book a call". Debajo, About us y Contact. "Our team" solo en footer y About. En móvil, lista plana a ancho completo. El contenido del mega-menú sale de los h3 de cada página de servicio; si se renombran secciones o anclas (`#process`, `#formats`, `#numbers`, `#materials`…), actualizarlo en `scripts/partials/header.*.html`.
- **Contenido:** se reescriben todos los textos (hoy son genéricos y vagos). Pendiente definir quién valida EN/ES.
- **Mockup = solo muestra visual:** el texto, las fotos, el equipo, los testimonios y los logos de integraciones son de ejemplo y deben llevar la etiqueta visible `.sample-tag` ("Example content" / "Contenido de ejemplo"). Reemplazar por datos reales antes de publicar.
- **Plazo:** sin fecha límite; objetivo de tener la primera versión la semana próxima.

## Mapa del sitio
| Página | Función | Estado |
|---|---|---|
| Home | Propuesta, clientes, servicios, casos destacados, contacto, CTA | Hecha (EN/ES) |
| Tech Solutions | Bots y automatización, apps, web, event tech | Hecha (EN/ES) |
| Events Management | Servicio, cifras, ciclo del evento, eventos realizados | Hecha (EN/ES) |
| Corporate Branding | Servicio, ejemplos de materiales y tienda de merchandising | Hecha (EN/ES) |
| Nosotros | Equipo, enfoque, oficina en Coral Gables | Hecha (EN/ES) |
| Casos | Listado y detalle (WAGA, ALTA, ACI-LAC, etc.) | **Pendiente** |
| Contacto | Formulario (correo directo) y "Book a call" | Es una sección del Home (`#contact`) y de cada servicio (`#proposal`) |
| 404 | Error con el túnel de Tech de fondo y enlaces a las páginas principales (`noindex`, fuera del sitemap) | Hecha (EN/ES); falta configurar `ErrorDocument` al publicar |
| Blog | Fase posterior | No iniciar |

## Requisitos transversales
- Responsive mobile-first, carga rápida, accesibilidad básica.
- SEO por página: title, meta description, schema.org, hreflang EN/ES, canonical y Open Graph/Twitter (este último lo escribe `sync_chrome.py`; la imagen es `hero-poster.webp`, 1280×732: conviene una de 1200×630 para redes). `sitemap.xml` y `robots.txt` los genera `publish.py`. La 404 sale de `publish.py` con rutas desde la raíz (`/assets/…`) y solo funciona al configurar `ErrorDocument 404 /404.html` (y `/es/404.html` en `es/`; ver docstring de `publish.py`).
- Un CTA primario consistente ("Book a call"), sin salidas a sitios externos. Excepciones acordadas: (1) el botón "Learn more about iBot" de Tech Solutions abre `https://icorporatelab.com/service-ibot-2/` (WordPress actual) en pestaña nueva; pasar a ruta interna cuando esa página se migre. (2) La tienda de merchandising (iCorporate Events Store, PromoPlace: `https://www.promoplace.com/icorporate-events`) se enlaza desde la sección `#materials` de Corporate Branding, el mega-menú de Corporate Branding y el footer, siempre en pestaña nueva con `rel="noopener"`. Pendiente: URLs por categoría y confirmar "1,000s" y "desde $0.53" antes de publicar. (3) Las tarjetas de casos del Home enlazan al sitio de cada evento (ALTA AGM, WAGA, ITAérea) en pestaña nueva.
- Formulario de contacto funcional por correo directo (hoy `mailto:` desde `forms.js`; en producción se puede cambiar por un endpoint PHP sin tocar el HTML).
- Imágenes optimizadas antes de publicar: originales en `reference/img-originals/` (no se publican), salida WebP en `assets/img/` con `python3 scripts/optimize_images.py`. Siempre con `width`/`height` y `loading="lazy"` bajo el primer pantallazo.
- Video de fondo (opcional): dejar el original y correr `scripts/optimize_video.sh original.mp4 [hero|events|tech]`; genera `assets/video/<nombre>.mp4` (H.264, 1280 px, ≤ 4 MB, 8-15 s en bucle, sin audio ni texto) y su póster `<nombre>-poster.webp`. Hoy solo existe `hero.mp4` (Home). Si el archivo no existe, la cabecera usa el póster o el fondo oscuro (--dark) y el navegador registra un 404 inofensivo. No se carga con movimiento reducido, ahorro de datos ni pantallas < 768px.
- Efectos WebGL (`ogl` alojado en `assets/js/vendor/ogl.js`, con respaldo si falla): rayos en la sección de contacto del Home (`siderays.js`) y túnel de datos en la cabecera de Tech Solutions (`tunnel.js`: entrada con salto de velocidad, acelera sobre los botones, se apaga con el scroll; la cabecera queda fija a pantalla completa y "What we build" sube como bloque que la tapa, con `pin.js`). Ambos se pausan fuera de pantalla y respetan movimiento reducido. Rendimiento (medido con Lighthouse): se dibujan a 1x (0.6x en móvil, a 30 fps); los rayos crean el contexto solo cuando la sección está por entrar en pantalla y el túnel arranca tras la carga y se detiene cuando lo tapa la vitrina. Cualquier efecto WebGL nuevo debe seguir esa receta. Un efecto visual se aplica a una sección que ya existe por su contenido; no se crean secciones solo para lucirlo.

## Estructura y fuentes únicas
```
mockup/             Sitio de muestra para aprobación (EN)
mockup/es/          Versión en español, mismos nombres de archivo
assets/css/         styles.css (hoja única, con índice de 12 secciones al inicio)
assets/js/          un archivo por función (ver tabla abajo)
assets/img|video    Imágenes WebP y video
scripts/            Herramientas de desarrollo (ver scripts/README.md)
scripts/partials/   Plantillas de cabecera, mega-menú y footer (EN/ES)
reference/          Material de referencia y originales (no se publica)
index.html, es/     Marcadores de posición ("new site in progress"); la raíz redirige a /mockup/
dist/               Salida de publish.py (ignorada por git)
```
**Fuentes únicas (no editar la copia generada):**

| Qué | Dónde se edita | Cómo se propaga |
|---|---|---|
| Cabecera, mega-menú, footer | `scripts/partials/{header,footer}.{en,es}.html` | `python3 scripts/sync_chrome.py` |
| `<script>` de cada página | Se deducen del marcado (tabla `FEATURES` en `sync_chrome.py`) | `python3 scripts/sync_chrome.py` |
| Open Graph / Twitter | Salen de `<title>`, description y canonical de cada página | `python3 scripts/sync_chrome.py` |
| Imágenes WebP | Originales en `reference/img-originals/` + `JOBS` en `optimize_images.py` | `python3 scripts/optimize_images.py` |
| Colores, radios, degradados | Variables en `:root` de `styles.css` | Automático |
| `sitemap.xml`, `robots.txt` | Se generan al publicar | `python3 scripts/publish.py` |

**JavaScript (`assets/js/`)**: cada página carga solo lo que usa.

| Archivo | Función | Páginas |
|---|---|---|
| `core.js` | Cabecera con scroll, mega-menú, menú móvil, entrada de secciones | Todas |
| `stats.js` | Contadores de cifras (`.stat b`) | Home, About, Events |
| `forms.js` | Formularios por correo (`#contact-form`, `#proposal-form`) | Home y servicios |
| `home.js` | Carrusel de logos, muro de testimonios, carrusel del destacado | Home |
| `cycle.js` | Ciclo del evento (`[data-cycle]`) | Events |
| `flow.js` | Diagrama de integraciones (`.flow`) | Tech |
| `backgrounds.js` | Video de fondo, rayos y túnel (importa `siderays.js` y `tunnel.js`) | Home, Tech, Events |
| `splash.js` | Splash de entrada (`[data-splash]`): telón con logo y línea de carga, una vez por sesión; lo activa el script del `<head>` (`.has-splash`) | Home |
| `pin.js` | Cabecera fija a pantalla completa (`[data-pin]`): atenúa su contenido mientras la sección siguiente la tapa | Tech |
| `ibot.js` | Asistente de demostración (flotante) | Todas |

## Convenciones de código
- **CSS**: una hoja con secciones numeradas. Colores, radios y degradados salen de variables (`--blue`, `--cyan`, `--on-dark`, `--radius`, `--grad-btn`…); no pegar hex sueltos. Nombres tipo BEM (`.bloque__elemento--modificador`). Un solo botón primario (`.btn--primary`, cian de marca sólido con texto oscuro); las variantes por sección no deben redefinirlo. Las reglas de un componente van juntas bajo el comentario de su sección.
- **Radios**: cajas `--radius` (12 px), elementos pequeños 8-10 px, píldoras 999 px.
- **Tipografía**: H1-H3 en peso 400; etiquetas en JetBrains Mono; texto en Inter.
- **HTML**: un `<h1>` por página; todo `<img>` con `alt`, `width` y `height`; los `target="_blank"` con `rel="noopener"`; los ids deben ser idénticos en EN y ES.
- **JS**: módulos ES independientes, sin variables globales, con guarda (no hacen nada si el elemento no existe) y respetando `prefers-reduced-motion`. Se activan por atributos `data-*` o clases del marcado, documentados en el encabezado de cada archivo.
- **Dos idiomas**: cualquier cambio de estructura se hace en `mockup/` y `mockup/es/`; `check_site.py` falla si los ids difieren.

## Si cambias X, toca Y
| Cambias… | Actualiza también… |
|---|---|
| Un ítem del menú o del footer | Solo la plantilla en `scripts/partials/` (EN y ES) y `sync_chrome.py` |
| El nombre o ancla de una sección de servicio (`#phases`, `#formats`, `#process`…) | El mega-menú en `scripts/partials/header.*.html` y el footer; luego `sync_chrome.py` |
| Agregas una página | `PAGES` en `sync_chrome.py` y `loc()`/sitemap en `publish.py` se alimentan solos; crear también la versión ES |
| Agregas un componente con JS | Su módulo en `assets/js/`, la expresión en `FEATURES` y correr `sync_chrome.py` |
| Cambias un color o radio | La variable en `:root`, no el valor en cada regla |
| Agregas una imagen | Original en `reference/img-originals/`, entrada en `JOBS`, correr `optimize_images.py`; `width`/`height` en el HTML |
| Cambias título o descripción de una página | Correr `sync_chrome.py` (regenera Open Graph) y revisar el `<title>` ES |

## Cómo trabajar
- Ediciones mínimas y dirigidas; no reescribir archivos enteros sin motivo.
- Probar localmente con `python3 scripts/serve.py` (puerto 8000, sin caché, `/` → `/mockup/`) antes de entregar; hay que reiniciarlo si se cambia `serve.py`.
- Antes de cada commit: `python3 scripts/check_site.py` (debe terminar sin errores). Para refactors que no deben cambiar nada visible, comparar con `scripts/style_snapshot.js` (instrucciones en `scripts/README.md`).
- Trabajar en una rama por tema, commitear y mergear a `main` con `--no-ff` cuando el usuario lo apruebe; borrar la rama al mergear. Sin push hasta que se pida.
- Las páginas de servicio son HTML editado a mano, salvo las partes generadas (cabecera, footer, `<script>`, Open Graph) que se marcan con un comentario `<!-- chrome|social|scripts: … -->`.
- Responder y comentar en español; el código y los nombres de archivos en inglés.
- Antes de decidir diseño o textos nuevos, mostrar una propuesta corta.

## Publicación
1. `python3 scripts/publish.py` → genera `dist/` (páginas con rutas ajustadas, `assets/`, `favicon.ico`, `sitemap.xml` y `robots.txt`) y verifica que cada recurso y ancla exista.
2. Revisar `dist/` en local (`python3 -m http.server --directory dist 8765`).
3. Reemplazar antes los contenidos de ejemplo (`.sample-tag`), validar EN/ES y confirmar los datos pendientes (tienda, cifras).
4. Subir `dist/` al servidor por SSH/rsync **solo con aprobación**. El WordPress actual no se toca hasta entonces.

## Datos del sitio actual (para reusar)
- Nombre: iCorporate. Dirección: 1313 Ponce de Leon Blvd, Suite 201, Coral Gables, FL 33134 (solo en schema.org y About; no aparece en el footer). Tel: +1 954 770 1738.
- Redes: LinkedIn `icorporatemarketing`, Instagram `icorporatemarketing`, YouTube `@icorporatemarketingevents4248`.
- Titular actual (a reemplazar): "Innovative Solutions for a New Era".

## Referencia técnica
`reference/SideRays.tsx` es un fondo animado WebGL (librería `ogl`) pensado para React. Ya está portado a `assets/js/siderays.js` (módulo con `ogl` de `assets/js/vendor/`); el original queda solo como referencia.
