# Notas técnicas (consulta)

Detalle que antes estaba en `CLAUDE.md`. Leer la sección que corresponda solo cuando la tarea toque ese tema. No se publica (`publish.py` solo copia `mockup/` y `assets/`).

## JavaScript (`assets/js/`)
Cada página carga solo lo que usa. `sync_chrome.py` deduce los `<script>` del marcado (tabla `FEATURES`).

| Archivo | Función | Páginas |
|---|---|---|
| `core.js` | Cabecera con scroll, menú móvil, entrada de secciones | Todas |
| `stats.js` | Cifras con rodillos tipo tragamonedas (`.stat b`, `[data-count]`): cada dígito gira y frena en su valor al entrar en pantalla | Home, About, Events, Tech |
| `forms.js` | Botón de copiar el correo (`[data-copy]`) en las vías de contacto | Home y servicios |
| `home.js` | Carrusel de logos y muro de testimonios | Home |
| `slides.js` | Carrusel de fotos con fundido y puntos (`[data-slides]`, `[data-dot]`): tarjeta destacada del Home y testimonio destacado de Events | Home, Events |
| `cycle.js` | Ciclo del evento (`[data-cycle]`) | Events |
| `formats.js` | Formatos de evento (`[data-formats]`): lista numerada y foto real que cambia con el mouse o sola cada 5 s, con barra de tiempo | Events |
| `flow.js` | Diagrama de integraciones (`.flow`) | Tech |
| `backgrounds.js` | Video de fondo, rayos y túnel (importa `siderays.js` y `tunnel.js`) | Home, Tech |
| `splash.js` | Splash de entrada (`[data-splash]`): telón con logo y línea de carga, una vez por sesión; lo activa el script del `<head>` (`.has-splash`) | Home |
| `clock.js` | Hora local en vivo (`[data-clock="Zona/IANA"]`): la de Miami en la tarjeta de la oficina | About |
| `team.js` | Equipo en "spotlight" (`[data-team]`): una persona por vez con miniaturas, flechas y avance automático | About |
| `chapters.js` | Índice de capítulos (`[data-chapters]`): en ≥ 1000 px índice fijo con el capítulo activo marcado al bajar; sin JS son anclas | Corporate Branding |
| `stack.js` | Servicios del Home apilados (`[data-stack]`): en ≥ 900 px título, indicador y tarjetas quedan fijos y cada tarjeta entra desde la derecha al bajar, con parallax en la foto (pista alta, `.stack-track--x`); el indicador lleva a cada tarjeta y el foco con teclado salta a la que lo recibe; en móvil suben en columna | Home |
| `parallax.js` | Parallax de cabecera (`[data-parallax]`): escribe `--par-p` (0 a 1) al bajar; la foto baja más lento y el texto se apaga. Nada con movimiento reducido | Corporate Branding |
| `pin.js` | Cabecera fija a pantalla completa (`[data-pin]`): atenúa su contenido mientras la sección siguiente la tapa | Tech |
| `ibot.js` | Asistente de demostración (flotante) y su preview: globo con saludo y dos atajos, una vez por sesión. Con `[data-bot-contact]` agrega el flujo guiado para agendar una llamada (necesidades por página con `data-bot-needs`) | Todas |

## Enlaces externos permitidos
Regla general: un CTA primario ("Book a call") y sin salidas a sitios externos. Excepciones acordadas, todas en pestaña nueva con `rel="noopener"`:
1. "Learn more about iBot" (Tech Solutions) → `https://icorporatelab.com/service-ibot-2/` (WordPress actual). Pasar a ruta interna cuando esa página se migre.
2. Tienda de merchandising (iCorporate Events Store, PromoPlace: `https://www.promoplace.com/icorporate-events`), desde `#materials` de Corporate Branding y el footer. Pendiente: URLs por categoría y confirmar "1,000+" y "desde $0.53" antes de publicar.
3. Tarjetas de casos del Home → sitio de cada evento (ALTA AGM, WAGA, ITAérea).
4. "Get directions" / "Cómo llegar" (tarjeta de la oficina, About) → la dirección en Google Maps. El mapa es una imagen fija de OpenStreetMap (zoom 15, bajada una vez y recoloreada a la paleta oscura por `optimize_images.py`), sin servicios externos al cargar; la atribución "© OpenStreetMap" enlaza a `openstreetmap.org/copyright` y es obligatoria (licencia ODbL).
5. WhatsApp (`https://wa.me/19547701738`, con texto inicial) desde las vías de contacto del Home y de los servicios.
6. Logo de ITAérea del testimonio destacado de Events → `itaerea.com` (EN) / `itaerea.es` (ES).

## SEO
Por página: title, meta description, schema.org, hreflang EN/ES, canonical y Open Graph/Twitter. Open Graph lo escribe `sync_chrome.py`; la imagen es `hero-poster.webp` (1280×732; conviene una de 1200×630 para redes). `sitemap.xml` y `robots.txt` los genera `publish.py`. La 404 sale de `publish.py` con rutas desde la raíz (`/assets/…`) y solo funciona con `ErrorDocument 404 /404.html` (y `/es/404.html` en `es/`; ver docstring de `publish.py`).

## Video de fondo
Dejar el original y correr `scripts/optimize_video.sh original.mp4 [hero|events|tech]`: genera `assets/video/<nombre>.mp4` (H.264, 1280 px, ≤ 4 MB, 8-15 s en bucle, sin audio ni texto) y su póster `<nombre>-poster.webp`. Hoy solo existe `hero.mp4` (Home). Tech y Events no llevan `<video>` hasta tener su archivo; para sumarlo: `<video class="hero__video" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-src="…">` en la cabecera, sin dejar etiquetas que apunten a archivos inexistentes. No se carga con movimiento reducido, ahorro de datos ni pantallas < 768px.

## Efectos WebGL
`ogl` alojado en `assets/js/vendor/ogl.js`, con respaldo si falla. Rayos en la sección de contacto del Home (`siderays.js`) y túnel de datos en la cabecera de Tech Solutions (`tunnel.js`: entrada con salto de velocidad, acelera sobre los botones, se apaga con el scroll; la cabecera queda fija a pantalla completa y "What we build" sube como bloque que la tapa, con `pin.js`). Ambos se pausan fuera de pantalla y respetan movimiento reducido.

Receta de rendimiento (medida con Lighthouse), obligatoria para cualquier efecto nuevo: dibujar a 1x (0.6x en móvil, a 30 fps); crear el contexto solo cuando la sección está por entrar en pantalla (rayos) o arrancar tras la carga y detenerse cuando algo lo tapa (túnel).

`reference/SideRays.tsx` es el original en React del que se portó `siderays.js`; queda solo como referencia.

## Publicación (detalle)
1. `python3 scripts/publish.py` → genera `dist/` (páginas con rutas ajustadas, `assets/`, `favicon.ico`, `sitemap.xml` y `robots.txt`) y verifica que cada recurso y ancla exista.
2. Revisar `dist/` en local (`python3 -m http.server --directory dist 8765`).
3. Reemplazar antes los contenidos de ejemplo (`.sample-tag`), validar EN/ES y confirmar los datos pendientes (tienda, cifras).
4. Subir `dist/` al servidor por SSH/rsync **solo con aprobación**.
