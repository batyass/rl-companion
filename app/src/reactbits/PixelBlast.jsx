// PixelBlast — React Bits "Pixel Blast" background (reactbits.dev),
// vendored for RL Companion: a fullscreen three.js quad rendering a
// pixel grid that blasts outward on click (ripples) and warps like
// liquid under the pointer (trail). It sits behind the app with
// pointer-events: none, so all pointer input is read from `window`.
import { useEffect, useRef } from "react";
import * as THREE from "three";

import "./PixelBlast.css";

const MAX_CLICKS = 4;
const TRAIL_SIZE = 256;
const TRAIL_DECAY = 0.94;

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const FRAG = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec3 uColor;
uniform float uPixelSize;
uniform float uPatternScale;
uniform float uPatternDensity;
uniform float uPixelSizeJitter;
uniform float uEdgeFade;
uniform int uVariant; // 0 = square, 1 = circle
uniform bool uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensityScale;
uniform vec2 uResolution;
uniform vec2 uClickPos[4];
uniform float uClickTimes[4];
uniform sampler2D uTrail;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;

  // Liquid trail: R/G carry pointer velocity (displacement), B the glow.
  vec3 trail = texture2D(uTrail, uv).rgb;
  vec2 warped = uv + (trail.rg - 0.5) * 0.1;
  float glow = trail.b;

  // Pixel grid in screen space so cells are perfectly square.
  vec2 sp = warped * uResolution;
  float cell = uPixelSize * uPatternScale;
  vec2 gv = fract(sp / cell) - 0.5;
  vec2 id = floor(sp / cell);

  float jit = (hash(id + 13.7) - 0.5) * uPixelSizeJitter;

  float mask = 0.0;
  if (uVariant == 0) {
    float hs = 0.46 - jit * 0.3;
    float d = max(abs(gv.x), abs(gv.y));
    mask = 1.0 - smoothstep(hs - 0.06, hs + 0.02, d);
  } else {
    float r = length(gv - vec2(0.0, jit * 0.4));
    mask = 1.0 - smoothstep(0.34, 0.46, r);
  }
  // patternDensity (0..1) controls how many cells are populated.
  mask *= step(hash(id + 31.7), uPatternDensity);

  vec3 col = uColor * mask * 0.5;
  col += uColor * glow * mask * 1.5;       // trail brightens the pixels it touches
  col += uColor * glow * glow * 0.55;      // soft ambient haze around the trail

  // Click ripples: expanding rings that ignite the grid.
  if (uEnableRipples) {
    for (int i = 0; i < 4; i++) {
      float age = uTime - uClickTimes[i];
      if (age < 0.0 || age > 2.8) continue;
      vec2 dp = (warped - uClickPos[i]) * vec2(uResolution.x / uResolution.y, 1.0);
      float dist = length(dp);
      float ring = exp(-age * 2.2) * (1.0 - smoothstep(uRippleThickness, uRippleThickness * 3.5, abs(dist - age * 0.5 * uRippleSpeed)));
      float wave = 0.6 + 0.4 * sin(dist * 90.0 - age * 16.0 * uRippleSpeed);
      float blast = ring * wave;
      col += uColor * blast * uRippleIntensityScale * (mask * 1.6 + 0.35);
    }
  }

  // Fade toward the edges so the pattern melts into the aurora.
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float fade = mix(0.4, 1.0, 1.0 - smoothstep(0.0, max(uEdgeFade, 0.05), edge));
  col *= fade;

  gl_FragColor = vec4(col, 1.0);
}
`;

function mapToPixels(e) {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  return { fx: e.clientX / w, fy: 1 - e.clientY / h, w, h };
}

export default function PixelBlast(props) {
  const containerRef = useRef(null);
  const threeRef = useRef(null);
  const pointerRef = useRef({ active: false, x: 0, y: 0, vx: 0, vy: 0, lastX: 0, lastY: 0, lastTime: 0 });
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ---- pointer input (read from window; the layer is pointer-events: none)
    const onPointerDown = (e) => {
      const { fx, fy } = mapToPixels(e);
      const three = threeRef.current;
      if (!three) return;
      const ix = three.clickIx ?? 0;
      three.uniforms.uClickPos.value[ix].set(fx, fy);
      three.uniforms.uClickTimes.value[ix] = three.uniforms.uTime.value;
      three.clickIx = (ix + 1) % MAX_CLICKS;
    };
    const onPointerMove = (e) => {
      const { fx, fy } = mapToPixels(e);
      const p = pointerRef.current;
      const now = performance.now();
      const dt = Math.max(now - p.lastTime, 1);
      p.vx = (fx - p.lastX) / dt * 16;
      p.vy = (fy - p.lastY) / dt * 16;
      p.x = fx;
      p.y = fy;
      p.lastX = fx;
      p.lastY = fy;
      p.lastTime = now;
      p.active = true;
    };
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // ---- renderer + scene
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    const gl = renderer.gl;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#00A3FF") },
      uPixelSize: { value: 3.5 },
      uPatternScale: { value: 3 },
      uPatternDensity: { value: 0.8 },
      uPixelSizeJitter: { value: 0.25 },
      uEdgeFade: { value: 0.35 },
      uVariant: { value: 0 },
      uEnableRipples: { value: true },
      uRippleSpeed: { value: 0.35 },
      uRippleThickness: { value: 0.09 },
      uRippleIntensityScale: { value: 1.4 },
      uResolution: { value: [window.innerWidth, window.innerHeight] },
      uClickPos: { value: Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-2, -2)) },
      uClickTimes: { value: new Float32Array(MAX_CLICKS).fill(-10) },
      uTrail: { value: null },
    };

    const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ---- liquid trail texture (pointer velocity + glow, decayed each frame)
    const trailCanvas = document.createElement("canvas");
    trailCanvas.width = TRAIL_SIZE;
    trailCanvas.height = TRAIL_SIZE;
    const trailCtx = trailCanvas.getContext("2d");
    trailCtx.fillStyle = "rgb(0,0,0)";
    trailCtx.fillRect(0, 0, TRAIL_SIZE, TRAIL_SIZE);
    const trailTex = new THREE.CanvasTexture(trailCanvas);
    trailTex.minFilter = THREE.LinearFilter;
    trailTex.magFilter = THREE.LinearFilter;
    uniforms.uTrail.value = trailTex;

    const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));

    const resize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      uniforms.uResolution.value = [w, h];
    };
    window.addEventListener("resize", resize);
    resize();

    let raf = 0;
    const update = (t) => {
      raf = requestAnimationFrame(update);
      const p = propsRef.current;
      const time = t * 0.001 * (p.speed ?? 0.5) + (p.timeOffset ?? 0);

      // decay the trail, then stamp the pointer blob
      trailCtx.globalCompositeOperation = "destination-in";
      trailCtx.fillStyle = `rgba(0,0,0,${TRAIL_DECAY})`;
      trailCtx.fillRect(0, 0, TRAIL_SIZE, TRAIL_SIZE);
      const ptr = pointerRef.current;
      if (ptr.active) {
        trailCtx.globalCompositeOperation = "lighter";
        const cx = ptr.x * TRAIL_SIZE;
        const cy = ptr.y * TRAIL_SIZE;
        const r = 13;
        const grad = trailCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${clamp255((0.5 + ptr.vx * 3) * 255)},${clamp255((0.5 + ptr.vy * 3) * 255)},255,1)`);
        grad.addColorStop(0.45, `rgba(${clamp255((0.5 + ptr.vx * 3) * 255)},${clamp255((0.5 + ptr.vy * 3) * 255)},255,0.55)`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        trailCtx.fillStyle = grad;
        trailCtx.beginPath();
        trailCtx.arc(cx, cy, r, 0, Math.PI * 2);
        trailCtx.fill();
      }
      trailTex.needsUpdate = true;

      uniforms.uTime.value = time;
      uniforms.uColor.value.set(p.color ?? "#00A3FF");
      uniforms.uPixelSize.value = p.pixelSize ?? 3.5;
      uniforms.uPatternScale.value = p.patternScale ?? 3;
      uniforms.uPatternDensity.value = p.patternDensity ?? 0.8;
      uniforms.uPixelSizeJitter.value = p.pixelSizeJitter ?? 0.25;
      uniforms.uEdgeFade.value = p.edgeFade ?? 0.35;
      uniforms.uVariant.value = p.variant === "circle" ? 1 : 0;
      uniforms.uEnableRipples.value = !!p.enableRipples;
      uniforms.uRippleSpeed.value = p.rippleSpeed ?? 0.35;
      uniforms.uRippleThickness.value = p.rippleThickness ?? 0.09;
      uniforms.uRippleIntensityScale.value = p.rippleIntensityScale ?? 1.4;

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(update);

    threeRef.current = { uniforms, clickIx: 0, raf, onPointerDown, onPointerMove };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      trailTex.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      threeRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="pixel-blast-container" />;
}
