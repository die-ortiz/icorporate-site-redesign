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
- **Identidad visual:** se mantiene la actual (logo, colores, tipografía). Pedir los archivos si no están en `assets/`.
- **Contenido:** se reescriben todos los textos (hoy son genéricos y vagos). Pendiente definir quién valida EN/ES.
- **Plazo:** sin fecha límite; objetivo de tener la primera versión la semana próxima.

## Mapa del sitio
| Página | Función |
|---|---|
| Home | Propuesta, clientes, servicios, casos destacados, CTA |
| Tech Solutions | Bots y automatización, apps, web, event tech |
| Events Management | Servicio, cifras, eventos realizados |
| Corporate Branding | Servicio y ejemplos de materiales |
| Casos | Listado y detalle (WAGA, ALTA, ACI-LAC, etc.) |
| Nosotros | Equipo, enfoque, oficina en Coral Gables |
| Contacto | Formulario (correo directo) y "Book a call" |
| Blog | Fase posterior |

## Requisitos transversales
- Responsive mobile-first, carga rápida, accesibilidad básica.
- SEO por página: title, meta description, schema.org y hreflang EN/ES.
- Un CTA primario consistente ("Book a call"), sin salidas a sitios externos.
- Formulario de contacto funcional por correo directo (definir el método de envío en un sitio estático, por ejemplo `mailto:` o endpoint PHP en el servidor).
- Imágenes optimizadas antes de publicar: originales en `reference/img-originals/` (no se publican), salida WebP en `assets/img/` con `python3 scripts/optimize_images.py`. Siempre con `width`/`height` y `loading="lazy"` bajo el primer pantallazo.

## Estructura de carpetas
```
index.html          Home (EN)
es/index.html       Home (ES)
assets/css|js|img   Estilos, scripts, imágenes y logos
mockup/             Primera versión para presentar a aprobación
reference/          Material de referencia (no se publica)
```
Las demás páginas se agregan en la raíz (EN) y en `es/` (ES) con el mismo nombre de archivo.

## Datos del sitio actual (para reusar)
- Nombre: iCorporate. Dirección: 1313 Ponce de Leon Blvd, Suite 201, Coral Gables, FL 33134. Tel: +1 954 770 1738.
- Redes: LinkedIn `icorporatemarketing`, Instagram `icorporatemarketing`, YouTube `@icorporatemarketingevents4248`.
- Titular actual (a reemplazar): "Innovative Solutions for a New Era".

## Referencia técnica
`reference/SideRays.tsx` es un fondo animado WebGL (librería `ogl`) pensado para React. Si se usa en el hero, portarlo a un `<script type="module">` con `ogl` desde CDN, y corregir que reinicia el contexto WebGL al cambiar props.

## Cómo trabajar
- Ediciones mínimas y dirigidas; no reescribir archivos enteros sin motivo.
- Probar localmente con `python3 -m http.server` antes de entregar.
- Responder y comentar en español; el código y los nombres de archivos en inglés.
- Antes de decidir diseño o textos nuevos, mostrar una propuesta corta.
