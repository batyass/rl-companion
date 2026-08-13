import { describe, it, expect } from "vitest";
import {
  rarityKey,
  formatPrice,
  paintClass,
  demoItems,
  SHOP_ORDER,
  SHOP_LABELS,
  NAV_GROUPS,
  MOBILE_TABS,
} from "../data.js";

describe("data.js utilities & constants", () => {
  describe("rarityKey", () => {
    it("converts rarity strings to lowercase hyphens", () => {
      expect(rarityKey("Black Market")).toBe("black-market");
      expect(rarityKey("Very Rare")).toBe("very-rare");
      expect(rarityKey("Import")).toBe("import");
      expect(rarityKey("Exotic")).toBe("exotic");
    });

    it("handles null, undefined, numbers, and empty values gracefully", () => {
      expect(rarityKey(null)).toBe("");
      expect(rarityKey(undefined)).toBe("");
      expect(rarityKey("")).toBe("");
      expect(rarityKey(123)).toBe("123");
    });
  });

  describe("formatPrice", () => {
    it("formats numbers with US locale separators", () => {
      expect(formatPrice(2000)).toBe("2,000");
      expect(formatPrice(600)).toBe("600");
      expect(formatPrice(0)).toBe("0");
    });

    it("handles null, undefined, or invalid inputs safely", () => {
      expect(formatPrice(null)).toBe("0");
      expect(formatPrice(undefined)).toBe("0");
      expect(formatPrice("invalid")).toBe("0");
    });
  });

  describe("paintClass", () => {
    it("maps known paints to CSS classes", () => {
      expect(paintClass("Purple")).toBe("paint-purple");
      expect(paintClass("Titanium White")).toBe("paint-white");
      expect(paintClass("Saffron")).toBe("paint-saffron");
      expect(paintClass("Crimson")).toBe("paint-crimson");
    });

    it("returns empty string for unknown or empty paints", () => {
      expect(paintClass("NonExistentColor")).toBe("");
      expect(paintClass(null)).toBe("");
      expect(paintClass(undefined)).toBe("");
    });
  });

  describe("data structures", () => {
    it("exports demoItems with required properties", () => {
      expect(Array.isArray(demoItems)).toBe(true);
      expect(demoItems.length).toBeGreaterThan(0);
      demoItems.forEach((item) => {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("price");
        expect(item).toHaveProperty("shop");
      });
    });

    it("exports valid SHOP_ORDER and SHOP_LABELS mapping", () => {
      expect(Array.isArray(SHOP_ORDER)).toBe(true);
      SHOP_ORDER.forEach((shopKey) => {
        expect(SHOP_LABELS).toHaveProperty(shopKey);
      });
    });

    it("exports NAV_GROUPS and MOBILE_TABS", () => {
      expect(Array.isArray(NAV_GROUPS)).toBe(true);
      expect(Array.isArray(MOBILE_TABS)).toBe(true);
    });
  });
});
