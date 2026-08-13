// slug -> rarity key used for the authentic in-game rarity colors.
function rarityKey(rarity) { return rarity.toLowerCase().replace(/[^a-z]/g, ""); }

const demoItems = [
  { id: "purple-sparkles", name: "Sparkles", paint: "Purple", type: "Rocket Boost", category: "daily", shop: "supersonic", rarity: "Import", price: 600, visual: "✦", image: "data/img/purple-sparkles.png" },
  { id: "draco-multichrome", name: "Draco: Multichrome", type: "Animated Decal", category: "daily", shop: "supersonic", rarity: "Black Market", price: 2000, visual: "◈", image: "data/img/draco-multichrome.png" },
  { id: "heavy-metal", name: "Heavy Metal", type: "Animated Decal", category: "daily", shop: "supersonic", rarity: "Exotic", price: 700, visual: "⬡", image: "data/img/heavy-metal.png" },
  { id: "oem-infinite", name: "OEM: Infinite", paint: "Purple", type: "Wheels", category: "daily", shop: "supersonic", rarity: "Exotic", price: 900, visual: "◉", image: "data/img/oem-infinite.png" },
  { id: "fslb-flare", name: "FSL-B: Flare", paint: "Saffron", type: "Wheels", category: "daily", shop: "supersonic", rarity: "Very Rare", price: 300, visual: "◎", image: "data/img/fslb-flare.png" },
  { id: "cold-front", name: "Cold Front", type: "Goal Explosion", category: "daily", shop: "supersonic", rarity: "Exotic", price: 800, visual: "✺", image: "data/img/cold-front.png" },
  { id: "prism-schism", name: "Prism Schism", paint: "Saffron", type: "Goal Explosion", category: "daily", shop: "supersonic", rarity: "Exotic", price: 1000, visual: "✧", image: "data/img/prism-schism.png" },
  { id: "lightning-gilded", name: "Lightning: Gilded", type: "Trail", category: "daily", shop: "supersonic", rarity: "Very Rare", price: 200, visual: "ϟ", image: "data/img/lightning-gilded.png" },
  { id: "octane-vertebrate", name: "Octane: Vertebrate", type: "Animated Decal", category: "daily", shop: "supersonic", rarity: "Import", price: 300, visual: "⬢", image: "data/img/octane-vertebrate.png" },
  { id: "sunset-1986", name: "Sunset 1986", type: "Player Banner", category: "daily", shop: "supersonic", rarity: "Limited", price: 150, visual: "✺", image: "data/img/sunset-1986.png" },
  { id: "neo-thermal", name: "Neo-Thermal", type: "Rocket Boost", category: "daily", shop: "supersonic", rarity: "Import", price: 600, visual: "〰", image: "data/img/neo-thermal.png" },
  { id: "halo-purple", name: "Halo: Purple", type: "Topper", category: "daily", shop: "supersonic", rarity: "Uncommon", price: 200, visual: "◌", image: "data/img/halo-purple.png" }
];

// Items are loaded from the backend (/api/shop) once available; until then
// the demo seed keeps the page functional.
let items = demoItems;
let dataSource = "demo";

// In-game shop sections, in display order. Tabs are built from whatever
// sections actually have items (empty ones are hidden), mirroring rlshop.gg.
const SHOP_ORDER = ["featured", "supersonic", "bmw", "valhalla", "lamborghini", "corvette", "bundles", "rlcs"];
const SHOP_LABELS = {
  featured: "Featured Shop",
  supersonic: "Supersonic Customs",
  bmw: "BMW",
  valhalla: "007's Aston Martin Valhalla",
  lamborghini: "Lamborghini",
  corvette: "Corvette ZR1",
  bundles: "Bundles",
  rlcs: "RLCS",
};
const state = { shop: "featured", search: "", rarity: "all", type: "all", compact: false, favorites: new Set(JSON.parse(localStorage.getItem("rlshop-favorites") || "[]")), selected: null };
const shopView = document.querySelector("#shopView");
const shopTabs = document.querySelector("#shopTabs");
const emptyState = document.querySelector("#emptyState");
const filterPanel = document.querySelector("#filterPanel");
const filterCount = document.querySelector("#filterCount");
const modalBackdrop = document.querySelector("#modalBackdrop");
const installButton = document.querySelector("#installButton");
let deferredInstallPrompt;

function formatPrice(price) { return price.toLocaleString("en-US"); }

function shopItems(shop) { return items.filter((item) => item.shop === shop || (shop === "featured" && item.category === "featured")); }

function matchesFilters(item) {
  const search = state.search.trim().toLowerCase();
  const matchesSearch = !search || `${item.name || ""} ${item.type || ""} ${item.rarity || ""} ${item.paint || ""}`.toLowerCase().includes(search);
  const matchesRarity = state.rarity === "all" || (item.rarity || "").toLowerCase() === state.rarity;
  const matchesType = state.type === "all" || (item.type || "").toLowerCase() === state.type || (state.type === "decal" && (item.type || "").toLowerCase().includes("decal"));
  return matchesSearch && matchesRarity && matchesType;
}

function paintClass(paint) {
  const map = { crimson: "paint-crimson", lime: "paint-lime", black: "paint-black", "sky blue": "paint-skyblue", cobalt: "paint-cobalt", "burnt sienna": "paint-sienna", "forest green": "paint-green", purple: "paint-purple", pink: "paint-pink", orange: "paint-orange", grey: "paint-grey", "titanium white": "paint-white", saffron: "paint-saffron", gold: "paint-gold" };
  return map[(paint || "").toLowerCase()] || "";
}

function creditIcon() { return `<span class="credit-icon" aria-hidden="true"></span>`; }

function itemCard(item) {
  const paint = paintClass(item.paint);
  return `
    <article class="item-card rarity-border rarity-${rarityKey(item.rarity)}" data-id="${item.id}" tabindex="0" aria-label="View ${item.name} details">
      <div class="item-visual rarity-glow rarity-${rarityKey(item.rarity)}">
        <button class="heart-button ${state.favorites.has(item.id) ? "saved" : ""}" data-favorite="${item.id}" aria-label="${state.favorites.has(item.id) ? "Remove" : "Save"} ${item.name}">${state.favorites.has(item.id) ? "♥" : "♡"}</button>
        ${item.paint ? `<span class="paint-chip ${paint}">${item.paint}</span>` : ""}
        <span class="time-chip">${formatTimeLeft()}</span>
        ${item.image ? `<img class="item-photo" src="${item.image}" alt="${item.name}" loading="lazy" />` : `<span class="visual-glyph ${item.type.toLowerCase().includes("decal") ? "decal" : ""}">${item.visual}</span>`}
      </div>
      <div class="item-details"><span class="item-type">${item.type}</span><strong class="item-name">${item.name}</strong><div class="item-bottom"><span class="rarity">${item.rarity}</span><span class="price">${creditIcon()}${formatPrice(item.price)} <small class="credits">CR</small></span></div></div>
    </article>`;
}

function contentCard(content) {
  const paint = paintClass(content.paint);
  return `
    <article class="item-card content-card rarity-border">
      <div class="item-visual">
        ${content.paint ? `<span class="paint-chip ${paint}">${content.paint}</span>` : ""}
        ${content.image ? `<img class="item-photo" src="${content.image}" alt="${content.name}" loading="lazy" />` : `<span class="visual-glyph ${content.type.toLowerCase().includes("decal") ? "decal" : ""}">${content.visual || "✦"}</span>`}
      </div>
      <div class="item-details"><span class="item-type">${content.type}</span><strong class="item-name">${content.name}</strong></div>
    </article>`;
}

function bundleCard(bundle) {
  const contents = (bundle.contents || []).map((content) => `
    <li class="bundle-item"><span class="bundle-item-dot"></span><span class="bundle-item-name">${content.name}</span><span class="bundle-item-type">${content.type}</span></li>`).join("");
  return `
    <article class="bundle-card rarity-border rarity-${rarityKey(bundle.rarity)}" data-id="${bundle.id}" tabindex="0" aria-label="View ${bundle.name} details">
      <div class="bundle-head">
        <div class="bundle-art rarity-glow rarity-${rarityKey(bundle.rarity)}">${bundle.image ? `<img class="item-photo" src="${bundle.image}" alt="${bundle.name}" loading="lazy" />` : `<span class="visual-glyph">${bundle.visual}</span>`}</div>
        <div class="bundle-info">
          <span class="item-type">Bundle · ${(bundle.contents || []).length} items</span>
          <strong class="bundle-name">${bundle.name}</strong>
          <div class="bundle-bottom"><span class="rarity">${bundle.rarity}</span><span class="price">${creditIcon()}${formatPrice(bundle.price)} <small class="credits">CR</small></span></div>
        </div>
      </div>
      <ul class="bundle-contents">${contents}</ul>
    </article>`;
}

function renderShopNav() {
  const sections = SHOP_ORDER.filter((shop) => shopItems(shop).length > 0);
  if (!sections.includes(state.shop)) state.shop = sections[0] || "supersonic";
  shopTabs.innerHTML = sections.map((shop) => `
    <button class="shop-tab ${shop === state.shop ? "active" : ""}" data-shop="${shop}" role="tab" aria-selected="${shop === state.shop}">
      <span>${SHOP_LABELS[shop]}</span><span class="tab-count">${shopItems(shop).length}</span>
    </button>`).join("");
}

function renderSectionHeading(title, count) {
  return `
    <div class="section-heading">
      <h2>${title} <span class="section-count">${count}</span></h2>
    </div>`;
}

function renderBundleShop(itemsInShop) {
  return itemsInShop.map((bundle) => {
    const contents = (bundle.contents || []).filter((c) => matchesFilters(c) || matchesFilters({ ...bundle, name: c.name, type: c.type }));
    const shown = contents.length ? contents : bundle.contents;
    return `
      <section class="shop-section bundle-shop" aria-labelledby="bundle-${bundle.id}">
        <div class="bundle-hero">
          <div class="bundle-hero-art rarity-glow rarity-${rarityKey(bundle.rarity)}">${bundle.image ? `<img src="${bundle.image}" alt="${bundle.name}" />` : `<span class="visual-glyph">${bundle.visual}</span>`}</div>
          <div class="bundle-hero-info">
            <h2 id="bundle-${bundle.id}">${bundle.name}</h2>
            <p>${(bundle.contents || []).length} items included</p>
          </div>
          <div class="bundle-hero-meta">
            <span class="meta-pill price-pill">${creditIcon()} ${formatPrice(bundle.price)} <small>CR</small></span>
            <span class="meta-pill time-pill">${formatTimeLeft()}</span>
          </div>
        </div>
        <div class="content-grid">${shown.map(contentCard).join("")}</div>
        <div class="empty-state" ${shown.length ? "hidden" : ""}><span>⌁</span><h3>No matching items</h3><p>Try a different search or clear your filters.</p><button class="clear-button" data-clear>Clear filters</button></div>
      </section>`;
  }).join("");
}

function render() {
  renderRecent();
  renderShopNav();

  const current = shopItems(state.shop);
  const viewItems = current.filter((item) => item.category !== "bundles" && item.category !== "esports" && matchesFilters(item));
  const bundleItems = current.filter((item) => item.category === "bundles" && matchesFilters(item));

  // Featured car shops (bmw/valhalla/lamborghini/corvette) render their own
  // hero + contents grid; the credit-bundle shop renders compact cards.
  const CAR_SHOPS = ["bmw", "valhalla", "lamborghini", "corvette"];
  if (CAR_SHOPS.includes(state.shop) && current.length > 0 && current.every((item) => item.category === "bundles")) {
    shopView.innerHTML = renderBundleShop(current);
  } else if (state.shop === "bundles") {
    const heading = renderSectionHeading(SHOP_LABELS.bundles, bundleItems.length);
    const grid = bundleItems.length ? `<div class="bundle-grid" id="bundlesGrid">${bundleItems.map(bundleCard).join("")}</div>` : "";
    const empty = bundleItems.length === 0 ? `<div class="empty-state" id="emptyState"><span>⌁</span><h3>No items found</h3><p>Try a different search or clear your filters.</p><button class="clear-button" id="clearButton">Clear filters</button></div>` : "";
    shopView.innerHTML = `<section class="shop-section" id="section-bundles">${heading}${grid}${empty}</section>`;
  } else {
    const title = SHOP_LABELS[state.shop] || "Items";
    const heading = renderSectionHeading(title, viewItems.length);
    const grid = viewItems.length ? `<div class="item-grid" id="itemGrid">${viewItems.map(itemCard).join("")}</div>` : "";
    const empty = viewItems.length === 0 ? `<div class="empty-state" id="emptyState"><span>⌁</span><h3>No items found</h3><p>Try a different search or clear your filters.</p><button class="clear-button" id="clearButton">Clear filters</button></div>` : "";
    shopView.innerHTML = `<section class="shop-section" id="section-${state.shop}">${heading}${grid}${empty}</section>`;
  }

  document.querySelectorAll(".shop-tab").forEach((tab) => tab.addEventListener("click", () => {
    state.shop = tab.dataset.shop;
    tab.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest", inline: "center" });
    document.querySelectorAll(".shop-tab").forEach((button) => {
      const active = button === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active);
    });
    render();
  }));
  delegate(shopView);
  updateFilterIndicator();
}

function renderRecent() {
  const row = document.querySelector("#recentRow");
  if (!row) return;
  const recent = items.slice(0, 3);
  row.innerHTML = recent.map((item) => `
    <article class="mini-card" data-id="${item.id}"><div class="mini-art">${item.image ? `<img src="${item.image}" alt="" />` : item.visual}</div><div><strong>${item.paint ? item.paint + " " : ""}${item.name}</strong><span>${item.type}</span></div><b>${formatPrice(item.price)} <small>CR</small></b></article>`).join("");
  row.querySelectorAll(".mini-card").forEach((card) => card.addEventListener("click", () => openModal(card.dataset.id)));
}

function applyTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark", dark);
  document.querySelector("#themeButton").textContent = dark ? "☼" : "☾";
  document.querySelector("#themeButton").setAttribute("aria-label", dark ? "Use light theme" : "Use dark theme");
}

const savedTheme = localStorage.getItem("rlshop-theme");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
applyTheme(savedTheme || systemTheme);

function updateFilterIndicator() {
  const count = [state.rarity !== "all", state.type !== "all"].filter(Boolean).length;
  filterCount.classList.toggle("visible", count > 0);
}
function saveFavorites() { localStorage.setItem("rlshop-favorites", JSON.stringify([...state.favorites])); }
function showToast(message) { const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500); }
function toggleFavorite(id) {
  const item = items.find((entry) => entry.id === id);
  if (state.favorites.has(id)) { state.favorites.delete(id); showToast(`${item ? item.name : "Item"} removed from favorites`); } else { state.favorites.add(id); showToast(`${item ? item.name : "Item"} saved to favorites`); }
  saveFavorites(); render();
  if (state.selected === id) updateModalFavorite();
}
function openModal(id) {
  const item = items.find((entry) => entry.id === id); if (!item) return;
  state.selected = id;
  document.querySelector("#modalTitle").textContent = item.name;
  document.querySelector("#modalType").textContent = item.type;
  document.querySelector("#modalRarity").textContent = item.rarity;
  document.querySelector("#modalRarity").className = `rarity-pill rarity-${rarityKey(item.rarity)}`;
  document.querySelector("#modalPrice").innerHTML = `${formatPrice(item.price)} <small>CR</small>`;
  const art = document.querySelector("#modalArt"); art.className = `modal-art rarity-glow rarity-${rarityKey(item.rarity)}`; art.innerHTML = item.image ? `<img class="item-photo" src="${item.image}" alt="${item.name}" />` : item.visual;
  updateModalFavorite(); modalBackdrop.hidden = false; document.body.style.overflow = "hidden"; document.querySelector("#modalClose").focus();
}
function updateModalFavorite() { const button = document.querySelector("#modalFavorite"); const saved = state.favorites.has(state.selected); button.innerHTML = `${saved ? "♥" : "♡"} <span>${saved ? "Saved to favorites" : "Save to favorites"}</span>`; button.classList.toggle("saved", saved); }
function closeModal() { modalBackdrop.hidden = true; document.body.style.overflow = ""; state.selected = null; }

// Card delegation keeps the controls working after every render.
function delegate(container) {
  if (!container) return;
  container.addEventListener("click", (event) => {
    const clear = event.target.closest("[data-clear]");
    if (clear) { state.search = ""; state.rarity = "all"; state.type = "all"; document.querySelector("#searchInput").value = ""; document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.value === "all")); render(); return; }
    const favorite = event.target.closest("[data-favorite]");
    if (favorite) { event.stopPropagation(); toggleFavorite(favorite.dataset.favorite); return; }
    const card = event.target.closest("[data-id]");
    if (card) { const item = items.find((entry) => entry.id === card.dataset.id); if (item) openModal(item.id); }
  });
  container.addEventListener("keydown", (event) => { if ((event.key === "Enter" || event.key === " ") && event.target.closest("[data-id]")) { event.preventDefault(); const item = items.find((entry) => entry.id === event.target.closest("[data-id]").dataset.id); if (item) openModal(item.id); } });
}

document.querySelector("#searchInput").addEventListener("input", (event) => { state.search = event.target.value; render(); });
document.querySelector("#filterButton").addEventListener("click", () => { filterPanel.hidden = !filterPanel.hidden; });
document.querySelectorAll(".filter-chip").forEach((chip) => chip.addEventListener("click", () => { const group = chip.dataset.filter; state[group] = chip.dataset.value; document.querySelectorAll(`.filter-chip[data-filter="${group}"]`).forEach((button) => button.classList.toggle("active", button === chip)); render(); }));
document.querySelector("#clearButton")?.addEventListener("click", () => { state.search = ""; state.rarity = "all"; state.type = "all"; document.querySelector("#searchInput").value = ""; document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.value === "all")); render(); });
document.querySelector("#modalClose").addEventListener("click", closeModal); modalBackdrop.addEventListener("click", (event) => { if (event.target === modalBackdrop) closeModal(); }); document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modalBackdrop.hidden) closeModal(); });
document.querySelector("#modalFavorite").addEventListener("click", () => { if (state.selected) toggleFavorite(state.selected); });
document.querySelector("#notifyButton").addEventListener("click", () => showToast("Notifications will be available in the app soon."));
document.querySelector("#themeButton").addEventListener("click", () => {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem("rlshop-theme", next);
  applyTheme(next);
});
window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", (event) => {
  if (!localStorage.getItem("rlshop-theme")) applyTheme(event.matches ? "dark" : "light");
});
document.querySelector("#menuButton").addEventListener("click", () => showToast("More navigation is coming soon."));

// Countdown to the next shop rotation.
let secondsLeft = 5 * 60 * 60 + 42 * 60 + 18;
function formatTimeLeft() {
  const hours = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const minutes = String(Math.floor(secondsLeft % 3600 / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
function updateCountdown() { secondsLeft = Math.max(0, secondsLeft - 1); document.querySelector("#countdown").textContent = formatTimeLeft(); }
setInterval(updateCountdown, 1000);
const today = new Date(); document.querySelector("#refreshDate").textContent = today.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
  showToast("RL Shop installed. Welcome back!");
});

// Load live shop data from the backend; fall back to the demo seed offline.
async function loadShopData() {
  try {
    const response = await fetch("/api/shop");
    if (response.ok) {
      const shop = await response.json();
      if (shop && Array.isArray(shop.items) && shop.items.length) {
        const wasDemo = dataSource === "demo";
        items = shop.items;
        dataSource = shop.source || "api";
        if (wasDemo && dataSource !== "demo" && items.some((item) => item.shop === "featured")) state.shop = "featured";
      }
    }
  } catch (_) {
    /* Offline: keep the demo seed. */
  }
  const badge = document.querySelector("#liveBadge");
  if (badge) badge.textContent = dataSource === "demo" ? "Demo data" : "Live game data";
  render();
}

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js");
loadShopData();
render();
