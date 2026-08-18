import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Gauge,
  Car,
  Shield,
  Flame,
  Clock,
  Flag,
  Package,
  Trophy,
} from "lucide-react";
import { shopLabel } from "../data.js";
import GlassSurface from "../reactbits/GlassSurface.jsx";

// Minimalist SF-Symbol-style icons (thin-stroke, monochrome), matching the sidebar.
const SHOP_ICONS = {
  featured: Sparkles,
  supersonic: Gauge,
  cybertruck: Car,
  beskar: Shield,
  playingfire: Flame,
  bttf: Clock,
  mclaren: Flag,
  bundles: Package,
  rlcs: Trophy,
};

function TabIcon({ shopKey }) {
  const Icon = SHOP_ICONS[shopKey] || Car;
  return <Icon size={20} strokeWidth={2.25} aria-hidden="true" />;
}

export default function BottomBar({ tabs = [], active, onSelect = () => {}, counts = {} }) {
  const navRef = useRef(null);
  const [indicator, setIndicator] = useState(null);

  // iOS-style active-tab indicator: a small frosted pill that slides to the
  // active tab. Measured from the real button so it tracks any width; the CSS
  // transition on left/width makes it glide between tabs.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const update = () => {
      const btn = nav.querySelector(".tab-item.active");
      // Hidden on desktop (display:none) → no measurable width yet; the
      // ResizeObserver will re-measure once the bar becomes visible.
      if (!btn || btn.offsetWidth === 0) return;
      setIndicator({ left: btn.offsetLeft + 4, width: btn.offsetWidth - 8 });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [active, tabs.length]);

  return (
    <GlassSurface
      className="pill-glass bottom-bar"
      // Same glass recipe as the hero pills, but with the displacement
      // distortion turned way down so the tab labels stay crisp and readable,
      // and a much more opaque frost so labels/icons read clearly over it.
      width="calc(100% - 24px)"
      height="62px"
      borderRadius={999}
      backgroundOpacity={0.55}
      saturation={1.6}
      displace={0}
      distortionScale={-120}
      borderWidth={0.15}
      role="navigation"
      aria-label="Mobile Navigation"
    >
      <nav ref={navRef} className="bottom-bar__content">
        {indicator && (
          <span
            className="tab-indicator"
            style={{ left: indicator.left, width: indicator.width }}
            aria-hidden="true"
          />
        )}
        {tabs.map((tab) => {
          const isActive = active === tab.shop;
          const count = counts[tab.shop] || 0;
          const label = tab.label || shopLabel(tab.shop);

          return (
            <button
              key={tab.shop}
              className={`tab-item ${isActive ? "active" : ""}`}
              onClick={() => onSelect(tab.shop)}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="tab-glyph" aria-hidden="true">
                <TabIcon shopKey={tab.shop} />
              </span>
              <span className="tab-label">{label}</span>
              {count > 0 && <span className="tab-badge">{count}</span>}
            </button>
          );
        })}
      </nav>
    </GlassSurface>
  );
}
