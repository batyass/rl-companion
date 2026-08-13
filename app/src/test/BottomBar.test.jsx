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
});
