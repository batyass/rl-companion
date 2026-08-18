/* Shared WebGL "fluid glass" lens that refracts a live snapshot of the real
   page. Used by both the cursor lens and the draggable chat bubble so the two
   behave identically.

   • usePageCapture — DOM hook (runs outside the Canvas): snapshots document.body
     with html-to-image and re-captures on resize + a slow interval.
   • PageBackdrop — inside the Canvas: maps the captured texture so the visible
     viewport window lines up under the lens (handles both scroll axes).
   • GlassLens — inside the Canvas: the real `MeshTransmissionMaterial` lens
     (ior/chromatic aberration/thickness) refracting that backdrop, positioned
     from `posRef` in viewport pixels, 1:1 with no spring lag. */
/* eslint-disable react/no-unknown-property */
import * as THREE from "three";
import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useFBO, useGLTF, MeshTransmissionMaterial } from "@react-three/drei";
import { toCanvas } from "html-to-image";

const CAMERA_Z = 20;
const CAMERA_FOV = 15;
const LENS_Z = 15;
const ORB_GEO_WIDTH = 2; // lens.glb "Cylinder" bounding-box width (X axis)
const CAPTURE_BG = "#05070b"; // matches the site's dark background

export function usePageCapture(enabled) {
  const canvasRef = useRef(null);
  const [version, setVersion] = useState(0);
  const capturingRef = useRef(false);

  const capture = useCallback(async () => {
    if (capturingRef.current) return;
    capturingRef.current = true;
    try {
      const docWidth = document.documentElement.scrollWidth || window.innerWidth;
      const docHeight = document.documentElement.scrollHeight || window.innerHeight;
      const canvas = await toCanvas(document.body, {
        width: docWidth,
        height: docHeight,
        canvasWidth: docWidth,
        canvasHeight: docHeight,
        pixelRatio: 1,
        backgroundColor: CAPTURE_BG,
        filter: (n) => {
          if (n.classList?.contains("fluid-glass-cursor")) return false;
          if (n.classList?.contains("fluid-glass-lens")) return false;
          if (n.classList?.contains("companion-widget")) return false;
          return true;
        },
      });
      canvasRef.current = canvas;
      setVersion((v) => v + 1);
    } catch (err) {
      console.warn("[fluid-glass] page capture failed", err);
    } finally {
      capturingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(capture);
    };
    window.addEventListener("resize", schedule);
    capture();
    const interval = setInterval(() => {
      if (!document.hidden) capture();
    }, 5000);
    return () => {
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [enabled, capture]);

  return { canvasRef, version };
}

export function PageBackdrop({ canvasRef, version }) {
  const meshRef = useRef();
  const texRef = useRef(null);
  const { viewport } = useThree();

  useEffect(() => {
    const img = canvasRef.current;
    if (!img) return;
    if (texRef.current) texRef.current.dispose();
    const tex = new THREE.CanvasTexture(img);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    texRef.current = tex;
    if (meshRef.current) {
      meshRef.current.material.map = tex;
      meshRef.current.material.needsUpdate = true;
    }
    return () => {
      texRef.current?.dispose();
      texRef.current = null;
    };
  }, [version, canvasRef]);

  useFrame(() => {
    const mesh = meshRef.current;
    const tex = texRef.current;
    if (!mesh || !tex?.image) return;
    // Map the visible viewport window of the full-document texture onto the
    // viewport-sized plane (both axes, so horizontal scroll is handled too).
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const docW = tex.image.width || vw;
    const docH = tex.image.height || vh;
    const sx = window.scrollX || 0;
    const sy = window.scrollY || 0;
    const uLeft = sx / docW;
    const uRight = (sx + vw) / docW;
    // Render the backdrop upside-down so the FBO round-trip flips it back
    // upright. flipY=true → canvas top row is texture v=1.
    const vTop = 1 - (sy + vh) / docH;
    const vBottom = 1 - sy / docH;
    const uv = mesh.geometry.attributes.uv;
    uv.setXY(0, uLeft, vBottom); // bottom-left
    uv.setXY(1, uRight, vBottom); // bottom-right
    uv.setXY(2, uLeft, vTop); // top-left
    uv.setXY(3, uRight, vTop); // top-right
    uv.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry />
      <meshBasicMaterial transparent />
    </mesh>
  );
}

export function GlassLens({ sizePx = 150, lensProps = {}, posRef, canvasRef, version }) {
  const ref = useRef();
  const { nodes } = useGLTF("assets/3d/lens.glb");
  const buffer = useFBO();
  const { viewport } = useThree();
  const [scene] = useState(() => new THREE.Scene());
  const geoWidthRef = useRef(ORB_GEO_WIDTH);

  useEffect(() => {
    const geo = nodes?.Cylinder?.geometry;
    if (!geo) return;
    geo.computeBoundingBox();
    geoWidthRef.current = geo.boundingBox.max.x - geo.boundingBox.min.x || ORB_GEO_WIDTH;
  }, [nodes]);

  useFrame((state) => {
    const { gl, camera } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, LENS_Z]);
    const cw = gl.domElement.clientWidth || 1;
    const ch = gl.domElement.clientHeight || 1;
    const p = posRef.current;

    // Pixel → world, 1:1 (no spring lag).
    const worldSize = (sizePx / cw) * v.width;
    ref.current.scale.setScalar(worldSize / geoWidthRef.current);
    ref.current.position.set(
      (p.x / cw - 0.5) * v.width,
      (0.5 - p.y / ch) * v.height,
      LENS_Z
    );

    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.setClearColor(0x000000, 0);
  });

  const { ior, thickness, anisotropy, chromaticAberration, ...extraMat } = lensProps;

  return (
    <>
      {createPortal(<PageBackdrop canvasRef={canvasRef} version={version} />, scene)}
      <mesh ref={ref} rotation-x={Math.PI / 2} geometry={nodes?.Cylinder?.geometry}>
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={ior ?? 1.15}
          thickness={thickness ?? 2}
          anisotropy={anisotropy ?? 0.01}
          chromaticAberration={chromaticAberration ?? 0.05}
          transmission={1}
          roughness={0}
          {...extraMat}
        />
      </mesh>
    </>
  );
}

export { CAMERA_Z, CAMERA_FOV };
