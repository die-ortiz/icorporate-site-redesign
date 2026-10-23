// Port vanilla de reference/SideRays.tsx (WebGL con ogl).
// Diferencias con el original: el contexto WebGL se crea una sola vez (no se
// reinicia al cambiar opciones) y el IntersectionObserver solo pausa el loop.
// Rendimiento: los rayos son suaves, así que se dibujan a 1x (0.6x en pantallas chicas, a 30 fps) en vez de hasta 2x;
// backgrounds.js crea el contexto solo cuando la sección está por entrar en pantalla.
import { Renderer, Program, Triangle, Mesh } from './vendor/ogl.js';

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const originToFlip = (origin) => ({
  'top-left': [1, 0],
  'bottom-right': [0, 1],
  'bottom-left': [1, 1],
}[origin] || [0, 0]);

const VERT = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}`;

export function initSideRays(container, opts = {}) {
  const o = {
    speed: 2.5, rayColor1: '#06BDE7', rayColor2: '#037FD9', intensity: 2, spread: 2,
    origin: 'top-right', tilt: 0, saturation: 1.5, blend: 0.75, falloff: 1.6, opacity: 1,
    ...opts,
  };

  let renderer;
  try {
    renderer = new Renderer({ dpr: 1, alpha: true });
  } catch (e) {
    return null; // sin WebGL: queda el fondo CSS
  }
  const gl = renderer.gl;
  if (!gl) return null;
  gl.canvas.style.width = '100%';
  gl.canvas.style.height = '100%';
  gl.canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(gl.canvas);

  const [flipX, flipY] = originToFlip(o.origin);
  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: [1, 1] },
    iSpeed: { value: o.speed },
    iRayColor1: { value: hexToRgb(o.rayColor1) },
    iRayColor2: { value: hexToRgb(o.rayColor2) },
    iIntensity: { value: o.intensity },
    iSpread: { value: o.spread },
    iFlipX: { value: flipX },
    iFlipY: { value: flipY },
    iTilt: { value: o.tilt },
    iSaturation: { value: o.saturation },
    iBlend: { value: o.blend },
    iFalloff: { value: o.falloff },
    iOpacity: { value: o.opacity },
  };

  const mesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, { vertex: VERT, fragment: FRAG, uniforms }),
  });

  const small = () => window.innerWidth < 768;
  const updateSize = () => {
    renderer.dpr = small() ? 0.6 : 1;
    const { clientWidth: w, clientHeight: h } = container;
    renderer.setSize(w, h);
    uniforms.iResolution.value = [w * renderer.dpr, h * renderer.dpr];
  };
  window.addEventListener('resize', updateSize);
  updateSize();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = null;
  let last = 0;
  const FRAME = small() ? 1000 / 30 : 0; // en móvil, 30 fps
  const loop = (t) => {
    if (t - last < FRAME) { raf = requestAnimationFrame(loop); return; }
    last = t;
    uniforms.iTime.value = t * 0.001;
    renderer.render({ scene: mesh });
    raf = requestAnimationFrame(loop);
  };

  if (reduceMotion) {
    uniforms.iTime.value = 4; // un cuadro estático
    renderer.render({ scene: mesh });
    return { renderer, uniforms };
  }

  // Pausa el loop fuera de pantalla sin destruir el contexto.
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && raf === null) raf = requestAnimationFrame(loop);
    else if (!entry.isIntersecting && raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.05 }).observe(container);

  return { renderer, uniforms };
}
