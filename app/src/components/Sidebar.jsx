import React from "react";
import { SHOP_LABELS } from "../data.js";

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 48 48" width="26" height="26" aria-hidden="true">
      <g transform="skewX(-14)">
        <rect x="8" y="16" width="12" height="22" rx="4.5" fill="#00A3FF" />
        <rect x="26" y="8" width="12" height="30" rx="4.5" fill="#FF6B00" />
      </g>
    </svg>
  );
}

export default function Sidebar({
  groups = [],
  counts = {},
  active,
  onSelect = () => {},
  collapsed = false,
  onToggle = () => {},
  mobileOpen = false,
  onClose = () => {},
}) {
  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="Shop Navigation"
      >
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => onSelect("featured")}>
            <BrandMark />
            <span className="brand-name">RL Companion</span>
          </div>
          <button
            className="collapse-toggle"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points={collapsed ? "13 17 18 12 13 7" : "11 17 6 12 11 7"} />
              <polyline points={collapsed ? "6 17 11 12 6 7" : "18 17 13 12 18 7"} />
            </svg>
          </button>
          {mobileOpen && (
            <button className="mobile-close" onClick={onClose} aria-label="Close menu">
              ✕
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {groups.map((group) => {
            const groupShops = (group.shops || []).filter((s) => (counts[s] || 0) >= 0);
            if (groupShops.length === 0) return null;
            return (
              <div key={group.id} className="nav-group">
                <div className="group-label">{group.label}</div>
                {groupShops.map((shopKey) => {
                  const isActive = active === shopKey;
                  const count = counts[shopKey] || 0;
                  const label = SHOP_LABELS[shopKey] || shopKey;
                  return (
                    <button
                      key={shopKey}
                      className={`nav-item ${isActive ? "active" : ""}`}
                      onClick={() => {
                        onSelect(shopKey);
                        if (mobileOpen && onClose) onClose();
                      }}
                      aria-current={isActive ? "page" : undefined}
                      title={label}
                    >
                      <span className="nav-item-indicator" aria-hidden="true" />
                      <span className="nav-item-label">{label}</span>
                      {count > 0 && <span className="nav-item-count">{count}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
