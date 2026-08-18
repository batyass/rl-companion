import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNow } from "./useNow.js";
import {
  demoItems,
  SHOP_ORDER,
  shopLabel,
  navGroupsFor,
  mobileTabsFor,
  rarityKey,
  formatPrice,
  paintClass,
} from "./data.js";
import GlassSurface from "./reactbits/GlassSurface.jsx";
import SpecularButton from "./reactbits/SpecularButton.jsx";
import Counter from "./reactbits/Counter.jsx";

// The three.js beams background is the heaviest dependency (three + fiber + drei).
// Load it lazily so the main bundle stays light and the app paints instantly;
// the fixed black `html` background covers the gap until it mounts.
const Beams = React.lazy(() => import("./reactbits/Beams.jsx"));
// The fluid-glass chat FAB is also three.js-heavy, so it loads lazily too.
const FluidGlass = React.lazy(() => import("./reactbits/FluidGlass.jsx"));
// Cursor-following fluid glass lens (React Bits lens mode) — used to compare
// the real WebGL ior refraction against the chat FAB.
const FluidGlassCursor = React.lazy(() => import("./reactbits/FluidGlassCursor.jsx"));
import { Select, SelectTrigger, SelectValue, SelectPortal, SelectPositioner, SelectPopup, SelectItem } from "./components/ui/select.jsx";
import { Switch } from "./components/ui/switch.jsx";
import { Sparkles } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import BottomBar from "./components/BottomBar.jsx";
import { useInstallPrompt } from "./hooks/useInstallPrompt.js";
import { InstallButton, InstallPill, InstallHelpModal } from "./components/InstallApp.jsx";

const supportsWebGL = (() => {
  if (typeof document === "undefined" || typeof WebGLRenderingContext === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
})();

// Complete Rocket League filter vocabularies. These are the full item-type,
// paint, and rarity sets from the game, not just whatever happens to be in
// today's shop — so the filters stay complete even when a type/paint/rarity
// has zero items in the current rotation.
const ITEM_TYPES = [
  "Body",
  "Decal",
  "Paint Finish",
  "Wheels",
  "Rocket Boost",
  "Topper",
  "Antenna",
  "Goal Explosion",
  "Trail",
  "Player Banner",
  "Avatar Border",
  "Player Anthem",
  "Engine Audio",
];

const PAINT_COLORS = [
  "Black",
  "Titanium White",
  "Grey",
  "Crimson",
  "Pink",
  "Cobalt",
  "Sky Blue",
  "Burnt Sienna",
  "Saffron",
  "Lime",
  "Forest Green",
  "Orange",
  "Purple",
];

const RARITIES = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Import",
  "Exotic",
  "Black Market",
  "Limited",
  "Premium",
  "Legacy",
];

// Build a filter option list: the "All …" sentinel first, then the full
// canonical vocabulary, then any extra values the live data happens to use
// (e.g. "Animated Decal") so nothing in the pipeline is ever unfilterable.
function filterOptions(allLabel, canonical, extras) {
  const seen = new Set();
  const out = [{ label: allLabel, value: "all" }];
  const push = (label) => {
    if (label && !seen.has(label)) {
      seen.add(label);
      out.push({ label, value: label });
    }
  };
  canonical.forEach(push);
  Array.from(extras).sort().forEach(push);
  return out;
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 48 48" width="26" height="26" aria-hidden="true">
      <defs>
        <linearGradient id="rl-grad-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00A3FF" />
          <stop offset="100%" stopColor="#0072CE" />
        </linearGradient>
        <linearGradient id="rl-grad-orange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#F85A1B" />
        </linearGradient>
      </defs>
      <g transform="skewX(-14)">
        <rect x="8" y="16" width="12" height="22" rx="4.5" fill="url(#rl-grad-blue)" />
        <rect x="26" y="8" width="12" height="30" rx="4.5" fill="url(#rl-grad-orange)" />
      </g>
    </svg>
  );
}

function StatCounter({ value, suffix, label, places }) {
  return (
    <div className="hero-stat">
      <strong>
        <Counter
          value={value}
          places={places}
          fontSize={30}
          padding={4}
          gap={0}
          textColor="#F5F5F7"
          fontWeight={600}
          gradientHeight={0}
        />
        {suffix ? <span className="stat-suffix">{suffix}</span> : null}
      </strong>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function ActivityMarquee({ items }) {
  const activity = useMemo(() => {
    const pool = items.filter((i) => i.name).slice(0, 12);
    const events = pool.map((i) => ({
      id: i.id,
      user: (["Nova", "Zephyr", "Apex", "Kilo", "Raze", "Saber", "Onyx", "Jolt", "Vex", "Piper", "Drift", "Blitz"])[Math.abs(String(i.id || i.name).split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 12],
      item: i.name,
      price: i.price,
    }));
    return events.length > 0 ? [...events, ...events] : [];
  }, [items]);

  if (activity.length === 0) return null;

  return (
    <GlassSurface className="marquee-glass" width="100%" height="auto" borderRadius={999} backgroundOpacity={0.1} saturation={1.6} displace={0} distortionScale={-180} borderWidth={0.15} aria-label="Recent shop activity">
      <span className="marquee-label"><span className="live-dot" />Live</span>
      <div className="marquee-track-wrapper">
        <div className="marquee-track">
          {activity.map((a, idx) => (
            <span className="marquee-event" key={`${a.id}-${idx}`}>
              <b>{a.user}</b> just grabbed <b>{a.item}</b>
              {a.price ? <em className="marquee-price"><CreditIcon />{formatPrice(a.price)}</em> : null}
            </span>
          ))}
        </div>
      </div>
    </GlassSurface>
  );
}

function CompanionWidget({ mobile = false }) {
  const [open, setOpen] = useState(false);
  const [fabPos, setFabPos] = useState(null);

  const toggle = () => setOpen((v) => !v);

  // Anchor the chat panel just above the FAB, clamped to the viewport so it
  // never flies off-screen after the FAB is dragged somewhere unusual.
  const fabR = fabPos?.r ?? 27;
  const panelStyle = fabPos
    ? {
        right: Math.max(14, window.innerWidth - fabPos.x - fabR),
        bottom: Math.max(14, window.innerHeight - fabPos.y + fabR + 12),
        maxWidth: `min(300px, calc(100vw - 28px))`,
      }
    : {
        // Plain (non-glass) FAB: anchor the panel above its fixed bottom-right spot.
        right: mobile ? 14 : 22,
        bottom: mobile ? 96 : 106,
        maxWidth: `min(300px, calc(100vw - 28px))`,
      };

  return (
    <div className={`companion-widget ${open ? "open" : ""}`}>
      {open && (
        <div className="companion-panel" style={panelStyle}>
          <div className="companion-head">
            <span className="live-chip"><span className="live-dot" />Companion online</span>
            <button className="modal-close-btn" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
          </div>
          <p className="companion-note">
            Chat with the RL Companion bot on your favorite messenger. Deals, shop alerts and rank tracking — straight from spectrum-ts.
          </p>
          <div className="companion-actions">
            <a className="companion-option imessage" href="sms:+10000000000&body=Hey%20RL%20Companion!">
              <MessageIcon kind="imessage" />
              <span>iMessage<br /><small>Blue bubble vibes</small></span>
            </a>
            <a className="companion-option whatsapp" href="https://wa.me/10000000000" target="_blank" rel="noreferrer">
              <MessageIcon kind="whatsapp" />
              <span>WhatsApp<br /><small>Chat anywhere</small></span>
            </a>
          </div>
        </div>
      )}
      {supportsWebGL && !mobile ? (
        // The liquid-glass lens stays on desktop; mobile uses the plain black
        // button (lighter, and the lens reads as a white blob on small screens).
        <React.Suspense fallback={null}>
          <FluidGlass
            open={open}
            onToggle={toggle}
            onPosChange={setFabPos}
            lensProps={{
              ior: 1.15,
              thickness: 1,
              chromaticAberration: 0.05,
              anisotropy: 0.01,
            }}
          >
            {open ? "✕" : <MessageIcon kind="chat" />}
          </FluidGlass>
        </React.Suspense>
      ) : (
        <button
          className="companion-fab"
          onClick={toggle}
          aria-label={open ? "Close companion chat" : "Open companion chat"}
          aria-expanded={open}
        >
          {open ? "✕" : <MessageIcon kind="chat" />}
        </button>
      )}
    </div>
  );
}

function MessageIcon({ kind }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (kind === "chat") {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" {...common} aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
      </svg>
    );
  }
  if (kind === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" {...common} aria-hidden="true">
        <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
        <path d="M9 9.5c.5 2.5 3 5 5.5 5.5l1-1.5 2 1c-.5 1.5-1.5 2-2.5 1.7-3-.8-6.4-4.2-7.2-7.2-.3-1 .2-2 1.7-2.5l1 2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...common} aria-hidden="true">
      <path d="M3.5 6.5A3 3 0 0 1 6.5 3.5h11a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-5.5 4z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function CreditIcon() {
  return <i className="credit-icon" aria-hidden="true" />;
}

function fmtTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${String(sec).padStart(2, "0")}s`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

// Fetched /api/shop data stores unix seconds; the local seed uses ms epochs.
const endMs = (ts) => (ts ? (ts > 1e11 ? ts : ts * 1000) : 0);

// Leaf countdown chip: ticks on its own shared clock so a single second passing
// re-renders this one span instead of the entire App tree.
function TimeChip({ endDate }) {
  const now = useNow();
  const remaining = Math.max(0, endMs(endDate) - now);
  return <span className="time-chip">{fmtTime(remaining)}</span>;
}

// Leaf hero countdown: finds the nearest ending item and renders the timer pill
// on the shared clock, so the hero no longer forces a full-tree re-render each
// second.
function HeroTimer({ items }) {
  const now = useNow();
  let earliest = Infinity;
  for (const it of items) {
    const ts = endMs(it.endDate);
    if (ts && ts > now && ts < earliest) earliest = ts;
  }
  if (earliest === Infinity) return null;
  return (
    <GlassSurface
      className="pill-glass pill-timer"
      width="auto"
      height="auto"
      borderRadius={999}
      backgroundOpacity={0.1}
      saturation={1.6}
      displace={0}
      distortionScale={-180}
      borderWidth={0.15}
    >
      ⏱ {fmtTime(earliest - now)}
    </GlassSurface>
  );
}

// The rlshop.gg mirror sometimes assigns one product id to several distinct
// items (e.g. a team's decal and goal explosion). Duplicate ids collide as
// React keys and silently drop cards from the grid, so suffix any repeat
// (-2, -3, …) to keep every item addressable.
function withUniqueIds(list) {
  const seen = new Set();
  return (list || []).map((it, idx) => {
    const base = it.id || `${it.shop || "item"}-${idx}`;
    if (!seen.has(base)) {
      seen.add(base);
      return it;
    }
    let n = 2;
    while (seen.has(`${base}-${n}`)) n += 1;
    const id = `${base}-${n}`;
    seen.add(id);
    return { ...it, id };
  });
}

function EmptyState({ onClear }) {
  return (
    <div className="empty-state">
      <h3>No items found</h3>
      <p>Try a different search query or clear your active filters.</p>
      <button className="clear-button" onClick={onClear}>Clear filters</button>
    </div>
  );
}

// Item artwork with a graceful fallback: a handful of mirror entries point at
// asset files that don't exist locally, and the card should fall back to the
// glyph instead of rendering an empty tile.
function ItemArt({ item, className }) {
  const [failed, setFailed] = useState(false);
  if (!item.image || failed) {
    return <span className="visual-glyph" aria-hidden="true">{item.visual || "✦"}</span>;
  }
  return (
    <img
      src={item.image}
      alt={item.name}
      className={className || "item-art"}
      loading="lazy"
      decoding="async"
      fetchpriority="low"
      onError={() => setFailed(true)}
    />
  );
}

const ItemCard = React.memo(function ItemCard({ item, onOpen }) {
  const rarityClass = rarityKey(item.rarity);
  return (
    <article
      className={`item-card rarity-${rarityClass}`}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(item); } }}
      tabIndex={0}
      aria-label={`View ${item.name} details`}
    >
      <div className="item-tile">
        <ItemArt item={item} />
        {item.paint && <span className={`paint-chip ${paintClass(item.paint)}`}>{item.paint}</span>}
        {item.endDate && <TimeChip endDate={item.endDate} />}
      </div>
      <div className="item-details">
        <div className="item-text">
          <h3 className="item-name">{item.name}</h3>
          <p className="item-type">{item.type}</p>
          <span className={`rarity-inline rarity-${rarityClass}`}><i aria-hidden="true" />{item.rarity}</span>
        </div>
        <span className="item-price"><CreditIcon />{formatPrice(item.price)}</span>
      </div>
    </article>
  );
});

const ContentCard = React.memo(function ContentCard({ content }) {
  const rarityClass = rarityKey(content.rarity);
  return (
    <article className={`item-card content-card rarity-${rarityClass}`}>
      <div className="item-tile">
        <ItemArt item={content} />
        {content.paint && <span className={`paint-chip ${paintClass(content.paint)}`}>{content.paint}</span>}
      </div>
      <div className="item-details">
        <div className="item-text">
          <h3 className="item-name">{content.name}</h3>
          <p className="item-type">{content.type}</p>
          <span className={`rarity-inline rarity-${rarityClass}`}><i aria-hidden="true" />{content.rarity}</span>
        </div>
      </div>
    </article>
  );
});

function BundleSection({ bundle, expanded = false }) {
  const [open, setOpen] = useState(expanded);
  const now = useNow();
  const contents = bundle.contents || [];
  const end = bundle.endDate ? (bundle.endDate > 1e11 ? bundle.endDate : bundle.endDate * 1000) : 0;
  const remaining = end ? Math.max(0, end - now) : 0;

  return (
    <section className="bundle-shop">
      <button
        className={`bundle-heading ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="bundle-title">
          <h2>{bundle.name || bundle.shop}</h2>
          <p>{contents.length} item{contents.length === 1 ? "" : "s"}</p>
        </span>
        {bundle.endDate && <span className="bundle-time">{fmtTime(remaining)}</span>}
        {bundle.price > 0 && (
          <span className="bundle-price"><CreditIcon />{formatPrice(bundle.price)}</span>
        )}
        <span className="chevron" aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="bundle-content">
          <div className="content-grid">
            {contents.map((c, idx) => (
              <ContentCard content={c} key={c.id || `${c.name || "item"}-${c.paint || ""}-${idx}`} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ItemModal({ item, saved, onClose, onToggleFavorite }) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimer = useRef(null);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [close]);

  useEffect(() => {
    return () => {
      clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      className={`modal-backdrop ${closing ? "closing" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div className="modal-art-panel">
          <ItemArt item={item} className="modal-art-image" />
        </div>
        <div className="modal-details-panel">
          <div className="modal-header">
            <div>
              <span className={`rarity-inline rarity-${rarityKey(item.rarity)}`}>{item.rarity}</span>
              <h2 id="modalTitle" style={{ fontSize: "24px", fontWeight: "700", marginTop: "4px" }}>{item.name}</h2>
              <p style={{ color: "var(--text-2)", fontSize: "14px" }}>{item.type}</p>
            </div>
            <button className="modal-close-btn" onClick={close} aria-label="Close modal">✕</button>
          </div>

          <div style={{ marginTop: "16px", padding: "12px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-2)", fontSize: "13px" }}>Price</span>
            <span className="item-price" style={{ fontSize: "18px" }}><CreditIcon />{formatPrice(item.price)}</span>
          </div>

          <button
            className={`favorite-btn ${saved ? "saved" : ""}`}
            onClick={() => onToggleFavorite(item.id)}
          >
            <span>{saved ? "♥ Saved to Favorites" : "♡ Save to Favorites"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState(() => withUniqueIds(demoItems));
  const [activeShop, setActiveShop] = useState(() => {
    return localStorage.getItem("rl-shop-active") || "featured";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("rl-sidebar-collapsed") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [paintFilter, setPaintFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");

  const [selectedItem, setSelectedItem] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("rlshop-favorites") || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState(null);
  const [glassCursor, setGlassCursor] = useState(true);
  const searchInputRef = useRef(null);

  // The cursor-following glass lens is pointless on touch screens (no cursor)
  // and it overlays a large lens-shaped cutout over the content, so disable
  // it below the mobile breakpoint.
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== "undefined" && !!window.matchMedia?.("(max-width: 767px)").matches;
  });
  useEffect(() => {
    const mql = window.matchMedia?.("(max-width: 767px)");
    if (!mql?.addEventListener) return;
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // PWA install: native prompt on Chromium, Add-to-Home-Screen help on iOS.
  const install = useInstallPrompt();

  // Press "g" to toggle the cursor-following fluid glass lens for comparison.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        setGlassCursor((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Keyboard shortcut listener for / search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch shop items from the API if available. The data file refreshes in
  // the background (rlshop.gg pipeline), so an open tab re-checks every few
  // minutes and hot-swaps the items when a newer file lands — no reload.
  const lastGeneratedRef = useRef(null);
  const loadLiveItems = useCallback(async () => {
    // Live API first (dev / self-hosted), then the baked static snapshot
    // (GitHub Pages and other static hosts), then the bundled demo seed.
    const sources = ["/api/shop", "shop.json"];
    for (const source of sources) {
      try {
        const res = await fetch(source, { cache: "no-store" });
        if (!res.ok) continue;
        const data = await res.json();
        if (!data || !Array.isArray(data.items) || data.items.length === 0) continue;
        const generated = data.generatedAt ?? 0;
        if (lastGeneratedRef.current === generated) return;
        lastGeneratedRef.current = generated;
        setItems(withUniqueIds(data.items));
        return;
      } catch {
        /* try the next source */
      }
    }
  }, []);

  useEffect(() => {
    loadLiveItems();
    const timer = setInterval(loadLiveItems, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadLiveItems]);

  const handleSelectShop = (shopKey) => {
    setActiveShop(shopKey);
    localStorage.setItem("rl-shop-active", shopKey);
  };

  // Re-capture the glass lens snapshot when the shop tab changes, so the
  // refraction shows the newly selected tab without a periodic timer. Runs
  // after React commits the new tab, deferred a frame so its DOM is laid out.
  const prevShopRef = useRef(activeShop);
  useEffect(() => {
    if (prevShopRef.current === activeShop) return;
    prevShopRef.current = activeShop;
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("fluid-glass:recapture"));
    });
    return () => cancelAnimationFrame(id);
  }, [activeShop]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("rl-sidebar-collapsed", String(next));
      return next;
    });
  };

  const shopItems = useMemo(() => {
    const map = {};
    SHOP_ORDER.forEach((s) => { map[s] = []; });
    items.forEach((it) => {
      const s = it.shop || "featured";
      if (!map[s]) map[s] = [];
      map[s].push(it);
    });
    return map;
  }, [items]);

  // Collab shops rotate daily, so both navs are derived from the loaded items.
  const navGroups = useMemo(() => navGroupsFor(items.map((it) => it.shop)), [items]);
  const mobileTabs = useMemo(() => mobileTabsFor(items.map((it) => it.shop)), [items]);

  // A persisted shop selection can point at a tab that no longer exists in
  // today's rotation — fall back to the featured shop instead of an empty grid.
  useEffect(() => {
    if (items.length === 0) return;
    if (!items.some((it) => it.shop === activeShop)) {
      handleSelectShop("featured");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, activeShop]);

  const counts = useMemo(() => {
    const res = {};
    Object.keys(shopItems).forEach((key) => {
      res[key] = shopItems[key].length;
    });
    return res;
  }, [shopItems]);

  const currentItems = useMemo(() => {
    return shopItems[activeShop] || [];
  }, [shopItems, activeShop]);

  const availableTypes = useMemo(() => {
    const set = new Set(currentItems.map((i) => i.type).filter(Boolean));
    return Array.from(set).sort();
  }, [currentItems]);

  const availablePaints = useMemo(() => {
    const set = new Set(currentItems.map((i) => i.paint).filter(Boolean));
    return Array.from(set).sort();
  }, [currentItems]);

  const availableRarities = useMemo(() => {
    const set = new Set(currentItems.map((i) => i.rarity).filter(Boolean));
    return Array.from(set).sort();
  }, [currentItems]);

  const typeItems = filterOptions("All Types", ITEM_TYPES, availableTypes);
  const paintItems = filterOptions("All Paints", PAINT_COLORS, availablePaints);
  const rarityItems = filterOptions("All Rarities", RARITIES, availableRarities);

  const filteredItems = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return currentItems.filter((i) => {
      if (q && !(i.name || "").toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (paintFilter !== "all" && i.paint !== paintFilter) return false;
      if (rarityFilter !== "all" && i.rarity !== rarityFilter) return false;
      return true;
    });
  }, [currentItems, search, typeFilter, paintFilter, rarityFilter]);

  const toggleFavorite = (itemId) => {
    setFavorites((prev) => {
      const exists = prev.includes(itemId);
      const next = exists ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      try {
        localStorage.setItem("rlshop-favorites", JSON.stringify(next));
      } catch (_) {}
      setToast(exists ? "Removed from favorites" : "Added to favorites");
      return next;
    });
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <div className="beams-bg" aria-hidden="true">
        {supportsWebGL ? (
          <React.Suspense fallback={null}>
            <Beams
              beamWidth={2}
              beamHeight={15}
              beamNumber={12}
              lightColor="#00A3FF"
              speed={2}
              noiseIntensity={1.75}
              scale={0.2}
              rotation={-32}
            />
          </React.Suspense>
        ) : null}
      </div>
      <header className="topbar">
        <button
          className="icon-button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          ☰
        </button>
        <div className="topbar-brand">
          <BrandMark />
          <span>RL Companion</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {install.canInstall && (
            <InstallButton onClick={install.install} />
          )}
          <button className="icon-button" aria-label="Notifications">
            <BellIcon />
          </button>
        </div>
      </header>

      <Sidebar
        groups={navGroups}
        counts={counts}
        active={activeShop}
        onSelect={handleSelectShop}
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        installButton={install.canInstall ? (
          <InstallButton variant="full" onClick={install.install} />
        ) : null}
      />

      <main className="main-content">
        <section className="hero-card">
          <div className="hero-content">
            <h1 className="hero-title">What's in the shop today?</h1>
            <p className="hero-subtext">Official Rocket League daily item rotation mirror with live timers & bundles.</p>
            <div className="hero-cta-row">
              <GlassSurface
                className="pill-glass pill-primary"
                width="auto"
                height="auto"
                borderRadius={999}
                backgroundOpacity={0.1}
                saturation={1.6}
                displace={0}
                distortionScale={-180}
                borderWidth={0.15}
                onClick={() => {
                  handleSelectShop("featured");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelectShop("featured"); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
                role="button"
                tabIndex={0}
              >
                Browse Today's Shop
              </GlassSurface>
              <GlassSurface
                className="pill-glass pill-ghost"
                width="auto"
                height="auto"
                borderRadius={999}
                backgroundOpacity={0.1}
                saturation={1.6}
                displace={0}
                distortionScale={-180}
                borderWidth={0.15}
                onClick={() => {
                  const widget = document.querySelector(".companion-fab");
                  widget?.click();
                }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.querySelector(".companion-fab")?.click(); } }}
                role="button"
                tabIndex={0}
              >
                Open Companion Chat
              </GlassSurface>
            </div>
          </div>
          <div className="hero-meta">
            <span className="live-pill">
              <span className="live-led" aria-hidden="true" />
              <GlassSurface className="pill-glass pill-live" width="auto" height="auto" borderRadius={999} backgroundOpacity={0.1} saturation={1.6} displace={0} distortionScale={-30} borderWidth={0.15}>
                Live item shop
              </GlassSurface>
            </span>
            <HeroTimer items={items} />
            {install.canInstallHero && (
              <InstallPill onClick={install.install} />
            )}
          </div>
          <div className="hero-stats">
            <StatCounter value={items.length} label="Items tracked" />
            <StatCounter value={48213} suffix="+" label="Players notified" places={[10000, 1000, ",", 100, 10, 1]} />
            <StatCounter value={114} suffix="ms" label="Bot response" places={[100, 10, 1]} />
          </div>
        </section>

        <ActivityMarquee items={items} />

        <section className="toolbar">
          <div className="search-wrap">
            <SpecularButton
              size="sm"
              radius={999}
              tint="#ffffff"
              tintOpacity={0}
              blur={0}
              textColor="#f5f5f5"
              lineColor="#ffffff"
              baseColor="#3a404d"
              intensity={1}
              shineSize={12}
              shineFade={40}
              thickness={1}
              speed={0.35}
              followMouse
              proximity={220}
              autoAnimate={false}
              className="search-specular"
              tabIndex={-1}
              aria-hidden="true"
              children=""
            />
            <div className="search-field">
              <span className="search-icon">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search items by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="kbd-hint">/</span>
            </div>
          </div>
          <SpecularButton
            size="sm"
            radius={999}
            tint="#ffffff"
            tintOpacity={0}
            blur={0}
            textColor="#f5f5f5"
            lineColor="#ffffff"
            baseColor="#3a404d"
            intensity={1}
            shineSize={12}
            shineFade={40}
            thickness={1}
            speed={0.35}
            followMouse
            proximity={220}
            autoAnimate={false}
            className={`filter-specular-main ${filtersOpen || typeFilter !== "all" || paintFilter !== "all" || rarityFilter !== "all" ? "active" : ""}`}
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            ⚡ Filters
          </SpecularButton>
        </section>

        {filtersOpen && (
          <GlassSurface
            className="filter-panel-glass"
            width="100%"
            height="auto"
            borderRadius={22}
            backgroundOpacity={0.1}
            saturation={1.6}
            displace={0}
            distortionScale={-180}
            borderWidth={0.15}
          >
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")} items={typeItems}>
              <div className="filter-select-wrap">
                <SpecularButton
                  size="sm"
                  radius={999}
                  tint="#ffffff"
                  tintOpacity={0.12}
                  blur={0}
                  textColor="#f5f5f5"
                  lineColor="#ffffff"
                  baseColor="#3a404d"
                  intensity={1}
                  shineSize={12}
                  shineFade={40}
                  thickness={1}
                  speed={0.35}
                  followMouse
                  proximity={220}
                  autoAnimate={false}
                  className="filter-specular"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {typeFilter === "all" ? "All Types" : typeFilter}
                  <span className="filter-chevron">▾</span>
                </SpecularButton>
                <SelectTrigger className="filter-select-trigger" aria-label="Item Type">
                  <SelectValue />
                </SelectTrigger>
              </div>
              <SelectPortal>
                <SelectPositioner className="filter-select-positioner" align="start" sideOffset={8}>
                  <SelectPopup className="filter-select-popup">
                    {typeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </Select>
            <Select value={paintFilter} onValueChange={(v) => setPaintFilter(v ?? "all")} items={paintItems}>
              <div className="filter-select-wrap">
                <SpecularButton
                  size="sm"
                  radius={999}
                  tint="#ffffff"
                  tintOpacity={0.12}
                  blur={0}
                  textColor="#f5f5f5"
                  lineColor="#ffffff"
                  baseColor="#3a404d"
                  intensity={1}
                  shineSize={12}
                  shineFade={40}
                  thickness={1}
                  speed={0.35}
                  followMouse
                  proximity={220}
                  autoAnimate={false}
                  className="filter-specular"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {paintFilter === "all" ? "All Paints" : paintFilter}
                  <span className="filter-chevron">▾</span>
                </SpecularButton>
                <SelectTrigger className="filter-select-trigger" aria-label="Paint">
                  <SelectValue />
                </SelectTrigger>
              </div>
              <SelectPortal>
                <SelectPositioner className="filter-select-positioner" align="start" sideOffset={8}>
                  <SelectPopup className="filter-select-popup">
                    {paintItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </Select>
            <Select value={rarityFilter} onValueChange={(v) => setRarityFilter(v ?? "all")} items={rarityItems}>
              <div className="filter-select-wrap">
                <SpecularButton
                  size="sm"
                  radius={999}
                  tint="#ffffff"
                  tintOpacity={0.12}
                  blur={0}
                  textColor="#f5f5f5"
                  lineColor="#ffffff"
                  baseColor="#3a404d"
                  intensity={1}
                  shineSize={12}
                  shineFade={40}
                  thickness={1}
                  speed={0.35}
                  followMouse
                  proximity={220}
                  autoAnimate={false}
                  className="filter-specular"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {rarityFilter === "all" ? "All Rarities" : rarityFilter}
                  <span className="filter-chevron">▾</span>
                </SpecularButton>
                <SelectTrigger className="filter-select-trigger" aria-label="Rarity">
                  <SelectValue />
                </SelectTrigger>
              </div>
              <SelectPortal>
                <SelectPositioner className="filter-select-positioner" align="start" sideOffset={8}>
                  <SelectPopup className="filter-select-popup">
                    {rarityItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectPopup>
                </SelectPositioner>
              </SelectPortal>
            </Select>
          </GlassSurface>
        )}

        <div key={activeShop} className="shop-content">
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>
            {shopLabel(activeShop)}
          </h2>

          {(() => {
            const isBundle = (it) => !!(it.bundle && Array.isArray(it.contents) && it.contents.length > 0);
            const bundles = currentItems.filter(isBundle);
            const plain = filteredItems.filter((it) => !isBundle(it));
            if (bundles.length === 0 && plain.length === 0) {
              return (
                <EmptyState
                  onClear={() => {
                    setSearch("");
                    setTypeFilter("all");
                    setPaintFilter("all");
                    setRarityFilter("all");
                  }}
                />
              );
            }
            return (
              <>
                {bundles.map((b) => (
                  <BundleSection key={b.id || b.name} bundle={b} expanded={true} />
                ))}
                {plain.length > 0 && (
                  <div className="item-grid">
                    {plain.map((it) => (
                      <ItemCard
                        key={it.id}
                        item={it}
                        onOpen={setSelectedItem}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <footer className="footer">
          <span>RL Companion — rocketleague.com shop mirror</span>
          <span>© 2026</span>
        </footer>
      </main>

      <BottomBar
        tabs={mobileTabs}
        active={activeShop}
        onSelect={handleSelectShop}
        counts={counts}
      />

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          saved={favorites.includes(selectedItem.id)}
          onClose={() => setSelectedItem(null)}
          onToggleFavorite={toggleFavorite}
        />
      )}

      <InstallHelpModal open={install.helpOpen} onClose={install.closeHelp} />

      {supportsWebGL && !isMobile && (
        <React.Suspense fallback={null}>
          <FluidGlassCursor
            enabled={glassCursor}
            lensProps={{ ior: 1.15, thickness: 2, chromaticAberration: 0.05, anisotropy: 0.01 }}
          />
        </React.Suspense>
      )}

      {!isMobile && <div className="glass-cursor-toggle">
        <span className="toggle-icon" aria-hidden="true"><Sparkles size={15} strokeWidth={1.75} /></span>
        <span className="toggle-label">Glass lens</span>
        <Switch
          checked={glassCursor}
          onCheckedChange={(checked) => setGlassCursor(checked)}
          aria-label="Toggle cursor fluid glass"
        />
      </div>}

      <CompanionWidget mobile={isMobile} />

      {toast && (
        <div className="toast-container">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  );
}
