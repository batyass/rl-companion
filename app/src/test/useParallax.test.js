import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useParallax } from "../hooks/useParallax.js";

describe("useParallax hook", () => {
  it("does not throw when rendered with valid or missing parameters", () => {
    const el1 = document.createElement("div");
    const ref1 = { current: el1 };

    expect(() => {
      renderHook(() => useParallax([ref1], [10]));
    }).not.toThrow();
  });

  it("handles missing refs or unmatched range bounds safely", () => {
    const refNull = { current: null };

    expect(() => {
      renderHook(() => useParallax([refNull], []));
    }).not.toThrow();
  });

  it("adds and cleans up pointermove listener when fine pointer is active", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("pointer: fine"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }));

    const ref = { current: document.createElement("div") };
    const { unmount } = renderHook(() => useParallax([ref], [12]));

    expect(addEventListenerSpy).toHaveBeenCalledWith("pointermove", expect.any(Function), { passive: true });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("pointermove", expect.any(Function));
  });
});
