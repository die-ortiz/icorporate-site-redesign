// Port vanilla de un fondo "Orb" (WebGL con ogl) para el hero de Tech Solutions.
// Cambios respecto al original React: colores de marca por uniform (en vez de rotar el tono),
// contexto WebGL creado una sola vez, pausa fuera de pantalla, un solo cuadro con movimiento reducido
// y resolución limitada en pantallas chicas.
import { Renderer, Program, Triangle, Mesh } from 'https://cdn.jsdelivr.net/npm/ogl@1.0.11/src/index.js';

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [0, 0, 0];
};

const VERT = `
precision highp float;
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform float hover;
uniform float rot;
uniform float hoverIntensity;
uniform vec3 backgroundColor;
uniform vec3 color1u;
uniform vec3 color2u;
uniform vec3 color3u;
varying vec2 vUv;

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
  p3 += dot(p3, p3.yxz + 19.19);
  return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
}

float snoise3(vec3 p) {
  const float K1 = 0.333333333;
  const float K2 = 0.166666667;
  vec3 i = floor(p + (p.x + p.y + p.z) * K1);
  vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
  vec3 e = step(vec3(0.0), d0 - d0.yzx);
  vec3 i1 = e * (1.0 - e.zxy);
  vec3 i2 = 1.0 - e.zxy * (1.0 - e);
  vec3 d1 = d0 - (i1 - K2);
  vec3 d2 = d0 - (i2 - K1);
  vec3 d3 = d0 - 0.5;
  vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
  vec4 n = h * h * h * h * vec4(
    dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
  return dot(vec4(31.316), n);
}

vec4 extractAlpha(vec3 colorIn) {
  float a = max(max(colorIn.r, colorIn.g), colorIn.b);
  return vec4(colorIn.rgb / (a + 1e-5), a);
}

const float innerRadius = 0.6;
const float noiseScale = 0.65;

float light1(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * attenuation); }
float light2(float intensity, float attenuation, float dist) { return intensity / (1.0 + dist * dist * attenuation); }

vec4 draw(vec2 uv) {
  float ang = atan(uv.y, uv.x);
  float len = length(uv);
  float invLen = len > 0.0 ? 1.0 / len : 0.0;
  float bgLuminance = dot(backgroundColor, vec3(0.299, 0.587, 0.114));

  float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
  float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
  float d0 = distance(uv, (r0 * invLen) * uv);
  float v0 = light1(1.0, 16.0, d0);
  v0 *= smoothstep(r0 * 1.05, r0, len);
  float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
  v0 *= mix(innerFade, 1.0, bgLuminance * 0.7);
  float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;

  float a = iTime * -1.0;
  vec2 pos = vec2(cos(a), sin(a)) * r0;
  float d = distance(uv, pos);
  float v1 = light2(1.5, 5.0, d);
  v1 *= light1(1.0, 50.0, d0);

  float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
  float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);

  vec3 colBase = mix(color1u, color2u, cl);
  float fadeAmount = mix(1.0, 0.1, bgLuminance);

  vec3 darkCol = mix(color3u, colBase, v0);
  darkCol = clamp((darkCol + v1) * v2 * v3, 0.0, 1.0);

  vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
  lightCol = clamp(mix(backgroundColor, lightCol, v0), 0.0, 1.0);

  return extractAlpha(mix(darkCol, lightCol, bgLuminance));
}

void main() {
  vec2 fragCoord = vUv * iResolution.xy;
  vec2 center = iResolution.xy * 0.5;
  float size = min(iResolution.x, iResolution.y);
  vec2 uv = (fragCoord - center) / size * 2.0;

  float s = sin(rot);
  float c = cos(rot);
  uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
  uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
  uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);

  vec4 col = draw(uv);
  gl_FragColor = vec4(col.rgb * col.a, col.a);
}`;

export function initOrb(container, opts = {}) {
  const o = {
    color1: '#037FD9', color2: '#06BDE7', color3: '#0266B0', background: '#101010',
    hoverIntensity: 1.2, rotateOnHover: true, ...opts,
  };

  let renderer;
  try {
    renderer = new Renderer({ alpha: true, premultipliedAlpha: false, dpr: 1 });
  } catch (e) {
    return null; // sin WebGL: queda el fondo CSS
  }
  const gl = renderer.gl;
  if (!gl) return null;
  gl.clearColor(0, 0, 0, 0);
  gl.canvas.setAttribute('aria-hidden', 'true');
  gl.canvas.style.width = '100%';
  gl.canvas.style.height = '100%';
  container.appendChild(gl.canvas);

  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: [1, 1, 1] },
    hover: { value: 0 },
    rot: { value: 0 },
    hoverIntensity: { value: o.hoverIntensity },
    backgroundColor: { value: hexToRgb(o.background) },
    color1u: { value: hexToRgb(o.color1) },
    color2u: { value: hexToRgb(o.color2) },
    color3u: { value: hexToRgb(o.color3) },
  };
  const mesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, { vertex: VERT, fragment: FRAG, uniforms }),
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const updateSize = () => {
    // el shader es pesado (ruido por píxel): 1x en pantallas chicas, hasta 2x en el resto (nitidez en pantallas retina)
    const dpr = window.innerWidth < 768 ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const { clientWidth: w, clientHeight: h } = container;
    renderer.dpr = dpr;
    renderer.setSize(w, h);
    uniforms.iResolution.value = [w * dpr, h * dpr, w / h];
    if (reduceMotion) renderer.render({ scene: mesh });
  };
  window.addEventListener('resize', updateSize);
  updateSize();

  if (reduceMotion) {
    uniforms.iTime.value = 3; // un cuadro estático
    renderer.render({ scene: mesh });
    return { renderer, uniforms };
  }

  // Hover: el pointer se escucha en el hero (el orbe queda detrás del contenido)
  const host = container.parentElement;
  let targetHover = 0;
  host.addEventListener('mousemove', (e) => {
    const r = container.getBoundingClientRect();
    const size = Math.min(r.width, r.height);
    const x = ((e.clientX - r.left - r.width / 2) / size) * 2;
    const y = ((e.clientY - r.top - r.height / 2) / size) * 2;
    targetHover = Math.hypot(x, y) < 0.8 ? 1 : 0;
  });
  host.addEventListener('mouseleave', () => { targetHover = 0; });

  let raf = null;
  let last = 0;
  let rot = 0;
  const loop = (t) => {
    const dt = (t - last) * 0.001;
    last = t;
    uniforms.iTime.value = t * 0.001;
    uniforms.hover.value += (targetHover - uniforms.hover.value) * 0.1;
    if (o.rotateOnHover && targetHover > 0.5) rot += Math.min(dt, 0.1) * 0.3;
    uniforms.rot.value = rot;
    renderer.render({ scene: mesh });
    raf = requestAnimationFrame(loop);
  };

  // Pausa el loop fuera de pantalla sin destruir el contexto.
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && raf === null) { last = performance.now(); raf = requestAnimationFrame(loop); }
    else if (!entry.isIntersecting && raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.05 }).observe(container);

  return { renderer, uniforms };
}
