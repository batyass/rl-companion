import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "../App.jsx";

// Item names also appear in the live activity marquee, so scope queries to cards.
function getItemCardText(name) {
  const el = screen.getAllByText(name).find((node) => node.closest(".item-card"));
  if (!el) throw new Error(`No item card found with text: ${name}`);
  return el;
}

function cardTextCount(name) {
  return screen.queryAllByText(name).filter((node) => node.closest(".item-card")).length;
}

describe("App component (Integration & Edge Cases)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject("API unavailable")));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders main app layout, header, and demo items", () => {
    render(<App />);
    expect(screen.getByText("What's in the shop today?")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Featured Shop" })).toBeInTheDocument();
    expect(getItemCardText("Del Rey")).toBeInTheDocument();
  });

  it("allows switching shop categories", () => {
    render(<App />);
    const supersonicBtn = screen.getByRole("button", { name: /Supersonic Customs/i });
    fireEvent.click(supersonicBtn);
    expect(screen.getByRole("heading", { level: 2, name: "Supersonic Customs" })).toBeInTheDocument();
  });

  it("filters items by search input and shows empty state on no match", async () => {
    render(<App />);
    const searchInput = screen.getByPlaceholderText("Search items by name...");
    
    fireEvent.change(searchInput, { target: { value: "NonExistentItemXYZ" } });
    
    expect(screen.getByText("No items found")).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: "Clear filters" });
    fireEvent.click(clearBtn);

    expect(getItemCardText("Del Rey")).toBeInTheDocument();
    expect(searchInput.value).toBe("");
  });

  it("opens modal on item card click and toggles favorites", async () => {
    render(<App />);
    
    const card = getItemCardText("Del Rey");
    fireEvent.click(card);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Del Rey" })).toBeInTheDocument();

    const favBtn = screen.getByRole("button", { name: /Save to Favorites/i });
    fireEvent.click(favBtn);

    expect(screen.getByText("♥ Saved to Favorites")).toBeInTheDocument();
    expect(screen.getByText("Added to favorites")).toBeInTheDocument();

    expect(localStorage.getItem("rlshop-favorites")).toContain("featured-9745");
  });

  it("closes modal on Escape key press", async () => {
    render(<App />);
    
    fireEvent.click(getItemCardText("Del Rey"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    await new Promise((r) => setTimeout(r, 300));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("opens filter panel and filters items by rarity", async () => {
    render(<App />);
    
    const filterToggle = screen.getByRole("button", { name: /Filters/i });
    fireEvent.click(filterToggle);

    expect(screen.getByRole("combobox", { name: "Item Type" })).toBeInTheDocument();

    const rarityTrigger = screen.getByRole("combobox", { name: "Rarity" });
    fireEvent.click(rarityTrigger);

    const blackMarket = await screen.findByRole("option", { name: "Black Market" });
    fireEvent.pointerDown(blackMarket);
    fireEvent.click(blackMarket);

    expect(getItemCardText("Draco (Earth)")).toBeInTheDocument();
    expect(cardTextCount("Del Rey")).toBe(0);
  });

  it("fetches shop data from /api/shop when endpoint returns data", async () => {
    const mockData = {
      items: [
        { id: "custom-item-1", name: "Custom Dominus", price: 1000, shop: "featured", rarity: "Import" },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(getItemCardText("Custom Dominus")).toBeInTheDocument();
    });
  });
});
