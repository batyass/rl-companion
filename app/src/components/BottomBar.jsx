import React from "react";
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
  return <Icon size={20} strokeWidth={1.75} aria-hidden="true" />;
}

export default function BottomBar({ tabs = [], active, onSelect = () => {}, counts = {} }) {
  return (
    <nav className="bottom-bar" aria-label="Mobile Navigation">
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
  );
}
