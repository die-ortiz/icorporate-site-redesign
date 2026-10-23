// Fondo "malla de señales" (WebGL con ogl) para el hero de Tech Solutions: puntos tenues con pulsos
// que recorren filas y columnas al azar (automatización = señales entre nodos) y un halo que sigue al cursor.
// Misma política que orb.js: contexto único, pausa fuera de pantalla, un cuadro estático con movimiento
// reducido y resolución limitada en pantallas chicas. Sin WebGL queda el fondo oscuro.
import { Renderer, Program, Triangle, Mesh } from './vendor/ogl.js';

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
uniform vec2 iResolution;
uniform float cell;
uniform vec2 mouse;
uniform float mouseOn;
uniform vec3 baseColor;
uniform vec3 pulseColor;
uniform vec3 accentColor;
varying vec2 vUv;

float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }

// pulso que avanza por una línea: cola larga detrás de la cabeza, nada delante
float pulse(float pos, float head) {
  float d = head - pos;
  return d < 0.0 ? 0.0 : exp(-d * 0.22) * smoothstep(0.0, 0.6, d + 0.6);
}

void main() {
  vec2 p = vUv * iResolution;
  p.y = iResolution.y - p.y; // y hacia abajo, como el DOM
  vec2 g = p / cell;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  vec2 dims = iResolution / cell;

  // pulsos: ~1 de cada 5 filas/columnas lleva uno, con periodo y fase propios
  float rowSeed = hash(id.y + 11.0);
  float colSeed = hash(id.x + 57.0);
  float rowOn = step(0.8, hash(id.y * 3.7 + 1.3));
  float colOn = step(0.86, hash(id.x * 5.1 + 2.9));
  float rowHead = fract(iTime / (9.0 + rowSeed * 8.0) + rowSeed) * (dims.x + 24.0) - 12.0;
  float colHead = fract(iTime / (11.0 + colSeed * 9.0) + colSeed) * (dims.y + 24.0) - 12.0;
  float pr = rowOn * pulse(id.x, rowHead);
  float pc = colOn * pulse(id.y, colHead);
  float sig = clamp(pr + pc, 0.0, 1.0);

  // punto + tramo de línea fino cuando pasa un pulso
  float dist = length(f);
  float r = 0.1 + 0.1 * sig;
  float dotA = smoothstep(r + 0.04, r - 0.02, dist);
  float lineA = (pr * smoothstep(0.035, 0.0, abs(f.y)) + pc * smoothstep(0.035, 0.0, abs(f.x))) * 0.8;

  // halo del cursor
  float m = mouseOn * exp(-length(p - mouse) / (cell * 5.0));

  // ondulación lenta de brillo (la malla "respira") y viñeta hacia los bordes
  vec2 c = vUv - 0.5;
  float breathe = 0.75 + 0.25 * sin(iTime * 0.4 + id.x * 0.12 + id.y * 0.17);
  float vig = smoothstep(1.0, 0.25, length(c * vec2(1.0, 1.25)));

  float base = dotA * (0.42 + 0.5 * m) * breathe;
  float lit = (dotA + lineA) * sig;
  // lima solo en las cabezas de pulso más intensas
  float accent = smoothstep(0.92, 1.0, sig) * dotA;

  vec3 col = baseColor * base + pulseColor * lit * 0.95 + accentColor * accent * 0.8;
  float a = clamp(base + lit + accent, 0.0, 1.0) * vig;
  gl_FragColor = vec4(col * vig, a);
}`;

export function initGrid(container, opts = {}) {
  const o = { base: '#06BDE7', pulse: '#06BDE7', accent: '#BDCC26', cell: 34, ...opts };

  let renderer;
  try {
    renderer = new Renderer({ alpha: true, dpr: 1 });
  } catch (e) {
    return null; // sin WebGL: queda el fondo oscuro
  }
  const gl = renderer.gl;
  if (!gl) return null;
  gl.clearColor(0, 0, 0, 0);
  gl.disable(gl.BLEND); // el shader ya entrega color premultiplicado
  gl.canvas.setAttribute('aria-hidden', 'true');
  gl.canvas.style.width = '100%';
  gl.canvas.style.height = '100%';
  container.appendChild(gl.canvas);

  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: [1, 1] },
    cell: { value: o.cell },
    mouse: { value: [0, 0] },
    mouseOn: { value: 0 },
    baseColor: { value: hexToRgb(o.base) },
    pulseColor: { value: hexToRgb(o.pulse) },
    accentColor: { value: hexToRgb(o.accent) },
  };
  const mesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, { vertex: VERT, fragment: FRAG, uniforms }),
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dpr = 1;
  const updateSize = () => {
    dpr = window.innerWidth < 768 ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const { clientWidth: w, clientHeight: h } = container;
    renderer.dpr = dpr;
    renderer.setSize(w, h);
    uniforms.iResolution.value = [w * dpr, h * dpr];
    uniforms.cell.value = (window.innerWidth < 768 ? o.cell * 0.8 : o.cell) * dpr;
    if (reduceMotion) renderer.render({ scene: mesh });
  };
  window.addEventListener('resize', updateSize);
  updateSize();

  if (reduceMotion) {
    uniforms.iTime.value = 4; // un cuadro estático
    renderer.render({ scene: mesh });
    return { renderer, uniforms };
  }

  // Cursor: se escucha en el hero (la malla queda detrás del contenido)
  const host = container.parentElement;
  let targetOn = 0;
  host.addEventListener('mousemove', (e) => {
    const r = container.getBoundingClientRect();
    uniforms.mouse.value = [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr];
    targetOn = 1;
  });
  host.addEventListener('mouseleave', () => { targetOn = 0; });

  let raf = null;
  const loop = (t) => {
    uniforms.iTime.value = t * 0.001;
    uniforms.mouseOn.value += (targetOn - uniforms.mouseOn.value) * 0.08;
    renderer.render({ scene: mesh });
    raf = requestAnimationFrame(loop);
  };

  // Pausa el loop fuera de pantalla sin destruir el contexto.
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && raf === null) raf = requestAnimationFrame(loop);
    else if (!entry.isIntersecting && raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.05 }).observe(container);

  return { renderer, uniforms };
}
