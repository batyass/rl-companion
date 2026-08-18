/* Cursor-following fluid glass lens — a thin wrapper around the shared
   GlassLens so you can compare the real-page refraction on the mouse. */
import { useRef, useEffect, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { usePageCapture, GlassLens, CAMERA_Z, CAMERA_FOV } from "./GlassLens.jsx";
import "./FluidGlassCursor.css";

function usePageVisibility() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return hidden;
}

export default function FluidGlassCursor({
  sizePx = 150,
  zIndex = 40,
  lensProps = {},
  enabled = true,
}) {
  const hidden = usePageVisibility();
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const { canvasRef, version } = usePageCapture(enabled);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fluid-glass-cursor" style={{ zIndex }} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        frameloop={hidden ? "never" : "always"}
        gl={{ alpha: true, powerPreference: "high-performance", antialias: true, premultipliedAlpha: false }}
        camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
        style={{ pointerEvents: "none" }}
      >
        <Suspense fallback={null}>
          <GlassLens sizePx={sizePx} lensProps={lensProps} posRef={mouseRef} canvasRef={canvasRef} version={version} />
        </Suspense>
      </Canvas>
    </div>
  );
}
