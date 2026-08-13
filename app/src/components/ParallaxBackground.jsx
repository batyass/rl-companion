import { useRef } from "react";
import { useParallax } from "../hooks/useParallax.js";
import Aurora from "../reactbits/Aurora.jsx";
import Particles from "../reactbits/Particles.jsx";

export default function ParallaxBackground() {
  const hex = useRef(null);
  const orbs = useRef(null);
  const dots = useRef(null);
  useParallax([hex, orbs, dots], [12, 24, 6]);

  return (
    <div className="parallax" aria-hidden="true">
      {/* CSS aurora — always visible, even where WebGL is unavailable */}
      <div className="aurora-css one" />
      <div className="aurora-css two" />
      {/* WebGL aurora (React Bits) — noise-wave shimmer on capable GPUs */}
      <Aurora
        colorStops={["#0072CE", "#00A3FF", "#FF6B00"]}
        amplitude={1.2}
        blend={0.7}
        speed={0.6}
      />
      <div className="aurora-flip">
        <Aurora
          colorStops={["#F85A1B", "#FF6B00", "#00A3FF"]}
          amplitude={1.0}
          blend={0.7}
          speed={0.45}
        />
      </div>
      <Particles
        particleCount={160}
        particleSpread={14}
        speed={0.1}
        particleColors={["#FF6B00", "#00A3FF", "#ffffff"]}
        particleBaseSize={110}
        alphaParticles={true}
      />
      <div className="parallax-layer parallax-hex" ref={hex} />
      <div className="parallax-layer parallax-orbs" ref={orbs} />
      <div className="parallax-layer parallax-dots" ref={dots} />
    </div>
  );
}
