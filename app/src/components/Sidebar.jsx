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
import { SHOP_LABELS } from "../data.js";
import {
  Sidebar as SidebarPanel,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarTrigger,
} from "./ui/sidebar.jsx";

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

// Minimalist SF-Symbol-style icons (thin-stroke, monochrome), one per shop.
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

function ShopIcon({ shopKey }) {
  const Icon = SHOP_ICONS[shopKey] || Sparkles;
  return <Icon size={16} strokeWidth={1.75} aria-hidden="true" />;
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
    <SidebarProvider
      open={!collapsed}
      onOpenChange={() => onToggle()}
      openMobile={mobileOpen}
      onOpenMobileChange={(open) => {
        if (!open) onClose();
      }}
    >
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}
      <SidebarPanel collapsible="icon" ariaLabel="Shop Navigation">
        <SidebarHeader>
          <div className="sidebar-brand" onClick={() => onSelect("featured")}>
            <BrandMark />
            <span className="brand-name">RL Companion</span>
          </div>
          <SidebarTrigger
            className="collapse-toggle"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points={collapsed ? "13 17 18 12 13 7" : "11 17 6 12 11 7"} />
              <polyline points={collapsed ? "6 17 11 12 6 7" : "18 17 13 12 18 7"} />
            </svg>
          </SidebarTrigger>
          {mobileOpen && (
            <button className="mobile-close" onClick={onClose} aria-label="Close menu">
              ✕
            </button>
          )}
        </SidebarHeader>

        <SidebarContent className="sidebar-nav">
          {groups.map((group) => {
            const groupShops = (group.shops || []).filter((s) => (counts[s] || 0) >= 0);
            if (groupShops.length === 0) return null;
            return (
              <SidebarGroup key={group.id} className="nav-group">
                <SidebarGroupLabel className="group-label">{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupShops.map((shopKey) => {
                      const isActive = active === shopKey;
                      const count = counts[shopKey] || 0;
                      const label = SHOP_LABELS[shopKey] || shopKey;
                      return (
                        <SidebarMenuItem key={shopKey}>
                          <SidebarMenuButton
                            className="nav-item"
                            isActive={isActive}
                            onClick={() => {
                              onSelect(shopKey);
                              if (mobileOpen && onClose) onClose();
                            }}
                            aria-current={isActive ? "page" : undefined}
                            title={label}
                          >
                            <span className="nav-item-icon" aria-hidden="true">
                              <ShopIcon shopKey={shopKey} />
                            </span>
                            <span className="nav-item-label">{label}</span>
                            {count > 0 && (
                              <SidebarMenuBadge className="nav-item-count">{count}</SidebarMenuBadge>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
      </SidebarPanel>
    </SidebarProvider>
  );
}
