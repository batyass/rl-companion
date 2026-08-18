/* Draggable chat bubble — same real-page WebGL glass as the cursor lens.
   A full-viewport Canvas renders the `GlassLens` at the bubble position; a
   transparent DOM button on top carries the chat icon + green LED and handles
   drag (1:1) and click-to-toggle. The lens and the button read the same
   `posRef`, so they never split into two parts. */
import { useRef, useEffect, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { usePageCapture, GlassLens, CAMERA_Z, CAMERA_FOV } from "./GlassLens.jsx";
import "./FluidGlass.css";

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function defaultFabPos(sizePx) {
  const mobile = window.innerWidth <= 720;
  const right = mobile ? 14 : 22;
  // Mobile clearance accounts for the floating glass bottom bar.
  const bottom = mobile ? 86 : 86;
  return {
    x: window.innerWidth - right - sizePx / 2,
    y: window.innerHeight - bottom - sizePx / 2,
  };
}

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

export default function FluidGlass({
  sizePx = 54,
  open = false,
  onToggle,
  onPosChange,
  children,
  lensProps = {},
  zIndex = 60,
  initialPosition,
}) {
  const hidden = usePageVisibility();
  const overlayRef = useRef(null);
  const posRef = useRef(initialPosition || defaultFabPos(sizePx));
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const downInfoRef = useRef(null);
  const stateRef = useRef(null);
  const { canvasRef, version } = usePageCapture(true);

  const applyPos = (x, y) => {
    posRef.current = { x, y };
    if (overlayRef.current) {
      overlayRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }
  };

  const reportPos = () => onPosChange?.({ ...posRef.current, r: sizePx / 2 });

  useEffect(() => {
    applyPos(posRef.current.x, posRef.current.y);
    reportPos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // frameloop="demand" only renders on explicit invalidate(), so re-render the
  // lens whenever the shared page snapshot refreshes (new texture).
  useEffect(() => {
    stateRef.current?.invalidate();
  }, [version]);

  // Scrolling shifts the visible viewport window of the snapshot, so invalidate
  // on scroll too (the lens has no pointer events, so nothing else would).
  useEffect(() => {
    const onScroll = () => stateRef.current?.invalidate();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handlePointerDown = (e) => {
    draggingRef.current = true;
    movedRef.current = false;
    downInfoRef.current = { x: e.clientX, y: e.clientY, tx: posRef.current.x, ty: posRef.current.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current || !downInfoRef.current) return;
    const dx = e.clientX - downInfoRef.current.x;
    const dy = e.clientY - downInfoRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) movedRef.current = true;
    applyPos(
      clamp(downInfoRef.current.tx + dx, sizePx / 2, window.innerWidth - sizePx / 2),
      clamp(downInfoRef.current.ty + dy, sizePx / 2, window.innerHeight - sizePx / 2)
    );
    stateRef.current?.invalidate();
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    downInfoRef.current = null;
    reportPos();
    if (!movedRef.current) onToggle?.();
  };

  return (
    <div className="fluid-glass" style={{ zIndex }} aria-hidden={false}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={hidden ? "never" : "demand"}
        gl={{ alpha: true, powerPreference: "high-performance", antialias: true, premultipliedAlpha: false }}
        camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
        style={{ pointerEvents: "none" }}
        onCreated={(state) => {
          stateRef.current = state;
          state.invalidate();
        }}
      >
        <Suspense fallback={null}>
          <GlassLens sizePx={sizePx} lensProps={lensProps} posRef={posRef} canvasRef={canvasRef} version={version} />
        </Suspense>
      </Canvas>
      <button
        ref={overlayRef}
        type="button"
        className="fluid-glass-lens"
        aria-label={open ? "Close companion chat" : "Open companion chat"}
        aria-expanded={open}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ width: sizePx, height: sizePx }}
      >
        <span className="fluid-glass-lens__icon">{children}</span>
        <span className="fluid-glass-dot" aria-hidden="true" />
      </button>
    </div>
  );
}
