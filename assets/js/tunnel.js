// Fondo "túnel de datos" (WebGL con ogl) para el hero de Tech Solutions: trazos de luz de marca que
// avanzan en perspectiva desde un punto de fuga detrás del titular. Entra con un salto de velocidad que se
// asienta, acelera al pasar el cursor por un botón de la cabecera, se estira y se apaga con el scroll,
// y el cursor inclina el punto de fuga (parallax).
// Política común de los fondos WebGL: contexto único, pausa fuera de pantalla, un cuadro estático con movimiento
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
uniform float flow;   // tiempo de avance (integrado con la velocidad actual)
uniform float fade;   // 1 = visible, 0 = apagado (scroll)
uniform vec2 iResolution;
uniform vec2 look;
uniform vec3 cyan;
uniform vec3 blue;
uniform vec3 lime;
varying vec2 vUv;

float hash(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }

// una capa de trazos: S sectores angulares, cada uno con su propia velocidad, fase y color
vec3 layer(vec2 q, float S, float seed, float speed, float width) {
  float r = length(q);
  float a = atan(q.y, q.x) / 6.2831853 + 0.5 + iTime * 0.004 * seed;
  float s = a * S;
  float id = floor(s);
  float fx = fract(s) - 0.5;
  float h = hash(id + seed * 100.0);
  float on = step(0.45, hash(id * 1.7 + seed * 13.0));

  float z = 0.22 / max(r, 0.002);
  float p = z * (0.5 + 0.5 * h) + flow * speed * (0.6 + h) + h * 20.0;
  float f = fract(p);
  float head = smoothstep(0.0, 0.015, f);
  float tail = exp(-f * (9.0 + 8.0 * h));
  float line = smoothstep(width, 0.0, abs(fx));

  float k = on * head * tail * line;
  k *= 0.35 + 1.6 * r;                 // más intensos al acercarse a la cámara
  k *= smoothstep(0.02, 0.3, r);       // se apagan en el punto de fuga

  float c = hash(id * 2.3 + seed);
  vec3 col = c < 0.55 ? cyan : (c < 0.93 ? blue : lime);
  return col * k;
}

void main() {
  vec2 q = (vUv - 0.5) * vec2(iResolution.x / iResolution.y, 1.0);
  q -= look * 0.06;
  float r = length(q);

  vec3 col = vec3(0.0);
  col += layer(q, 70.0, 1.0, 0.16, 0.12);
  col += layer(q, 130.0, 2.0, 0.24, 0.16);
  col += layer(q, 220.0, 3.0, 0.34, 0.22);

  // resplandor en el punto de fuga, detrás del titular
  col += blue * exp(-r * 3.2) * 0.22 + cyan * exp(-r * 9.0) * 0.12;
  // zona central más calma para que el texto se lea
  col *= mix(0.55, 1.0, smoothstep(0.05, 0.45, r));

  // cierre: los trazos se apagan hacia el borde inferior de la cabecera; el scroll los apaga del todo
  col *= smoothstep(0.0, 0.3, vUv.y) * fade;

  float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}`;

export function initTunnel(container, opts = {}) {
  const o = { cyan: '#06BDE7', blue: '#037FD9', lime: '#BDCC26', ...opts };

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
    flow: { value: 0 },
    fade: { value: 1 },
    iResolution: { value: [1, 1] },
    look: { value: [0, 0] },
    cyan: { value: hexToRgb(o.cyan) },
    blue: { value: hexToRgb(o.blue) },
    lime: { value: hexToRgb(o.lime) },
  };
  const mesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, { vertex: VERT, fragment: FRAG, uniforms }),
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const updateSize = () => {
    const dpr = window.innerWidth < 768 ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    const { clientWidth: w, clientHeight: h } = container;
    renderer.dpr = dpr;
    renderer.setSize(w, h);
    uniforms.iResolution.value = [w * dpr, h * dpr];
    if (reduceMotion) renderer.render({ scene: mesh });
  };
  window.addEventListener('resize', updateSize);
  updateSize();

  if (reduceMotion) {
    uniforms.flow.value = 6; // un cuadro estático
    renderer.render({ scene: mesh });
    return { renderer, uniforms };
  }

  // Cursor: inclina el punto de fuga (el túnel queda detrás del contenido)
  const host = container.parentElement;
  const target = [0, 0];
  host.addEventListener('mousemove', (e) => {
    const r = container.getBoundingClientRect();
    target[0] = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target[1] = -((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  host.addEventListener('mouseleave', () => { target[0] = 0; target[1] = 0; });

  // Un botón de la cabecera bajo el cursor acelera el túnel
  let hot = 0;
  host.querySelectorAll('.btn').forEach((b) => {
    b.addEventListener('mouseenter', () => { hot = 1; });
    b.addEventListener('mouseleave', () => { hot = 0; });
    b.addEventListener('focus', () => { hot = 1; });
    b.addEventListener('blur', () => { hot = 0; });
  });

  // Scroll: 0 con la cabecera entera a la vista, 1 cuando ya salió
  let scrolled = 0;
  const onScroll = () => {
    scrolled = Math.min(Math.max(window.scrollY / Math.max(container.clientHeight * 0.8, 1), 0), 1); // la cabecera puede quedar fija (sticky): se mide desde el tope de la página
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const ENTRY = 10; // salto inicial de velocidad, se asienta en ~1.5 s
  let raf = null;
  let last = 0;
  let age = 0;
  let boost = 0; // aceleración extra suavizada (cursor sobre botón)
  const loop = (t) => {
    const dt = Math.min((t - last) * 0.001, 0.05);
    last = t;
    age += dt;
    const l = uniforms.look.value;
    l[0] += (target[0] - l[0]) * 0.05;
    l[1] += (target[1] - l[1]) * 0.05;
    boost += (hot - boost) * 0.06;
    const speed = 1 + ENTRY * Math.exp(-age / 0.55) + boost * 2.2 + scrolled * 4;
    uniforms.flow.value += dt * speed;
    uniforms.fade.value = 1 - scrolled * 0.9;
    uniforms.iTime.value = t * 0.001;
    if (scrolled < 1) renderer.render({ scene: mesh }); // tapado por la sección siguiente: no se redibuja
    raf = requestAnimationFrame(loop);
  };

  // Pausa el loop fuera de pantalla sin destruir el contexto.
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && raf === null) { last = performance.now(); raf = requestAnimationFrame(loop); }
    else if (!entry.isIntersecting && raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }, { threshold: 0.05 }).observe(container);

  return { renderer, uniforms };
}
