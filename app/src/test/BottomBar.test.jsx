import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BottomBar from "../components/BottomBar.jsx";
import { MOBILE_TABS } from "../data.js";

describe("BottomBar component", () => {
  const mockCounts = { featured: 5, supersonic: 2 };

  it("renders mobile navigation tabs and item counts", () => {
    render(<BottomBar tabs={MOBILE_TABS} active="featured" counts={mockCounts} />);

    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onSelect when tab button is clicked", () => {
    const handleSelect = vi.fn();
    render(<BottomBar tabs={MOBILE_TABS} active="featured" onSelect={handleSelect} counts={mockCounts} />);

    fireEvent.click(screen.getByText("Daily"));
    expect(handleSelect).toHaveBeenCalledWith("supersonic");
  });

  it("renders default props without error", () => {
    expect(() => render(<BottomBar />)).not.toThrow();
  });

  it("shows the iOS-style indicator pill behind the active tab and moves it on switch", () => {
    const { rerender } = render(
      <BottomBar tabs={MOBILE_TABS} active="featured" counts={mockCounts} />
    );

    // jsdom reports offsetWidth 0, so stub the geometry of the Daily button
    // before switching to it; the indicator must be measured from the real tab.
    const dailyBtn = screen.getByText("Daily").closest("button");
    Object.defineProperty(dailyBtn, "offsetLeft", { configurable: true, value: 200 });
    Object.defineProperty(dailyBtn, "offsetWidth", { configurable: true, value: 90 });

    rerender(<BottomBar tabs={MOBILE_TABS} active="supersonic" counts={mockCounts} />);

    const indicator = document.querySelector(".tab-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator.style.left).toBe("204px");
    expect(indicator.style.width).toBe("82px");
  });
});
