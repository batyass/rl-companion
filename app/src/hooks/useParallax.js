import { useEffect } from "react";

export function useParallax(refs, range, k = 0.06) {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduced.matches) return;
    const state = { tx: 0, ty: 0, cx: 0, cy: 0, raf: 0 };
    const apply = () => refs.forEach((r, i) => {
      const el = r ? r.current : null;
      const factor = (range && range[i] !== undefined) ? range[i] : 0;
      if (el) el.style.transform = `translate3d(${state.cx * factor}px, ${state.cy * factor}px, 0)`;
    });
    const loop = () => {
      state.cx += (state.tx - state.cx) * k;
      state.cy += (state.ty - state.cy) * k;
      apply();
      if (Math.abs(state.tx - state.cx) < 0.001 && Math.abs(state.ty - state.cy) < 0.001) { state.raf = 0; return; }
      state.raf = requestAnimationFrame(loop);
    };
    const onMove = (e) => {
      state.tx = (e.clientX / window.innerWidth) * 2 - 1;
      state.ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!state.raf) state.raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(state.raf); };
  }, [refs, range, k]);
}
