import React from "react";
import { SHOP_LABELS } from "../data.js";

export default function BottomBar({ tabs = [], active, onSelect = () => {}, counts = {} }) {
  return (
    <nav className="bottom-bar" aria-label="Mobile Navigation">
      {tabs.map((tab) => {
        const isActive = active === tab.shop;
        const count = counts[tab.shop] || 0;
        const label = tab.label || SHOP_LABELS[tab.shop] || tab.shop;

        return (
          <button
            key={tab.shop}
            className={`tab-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(tab.shop)}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="tab-glyph" aria-hidden="true">{tab.glyph}</span>
            <span className="tab-label">{label}</span>
            {count > 0 && <span className="tab-badge">{count}</span>}
          </button>
        );
      })}
    </nav>
  );
}
