import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "../components/Sidebar.jsx";
import { NAV_GROUPS } from "../data.js";

describe("Sidebar component", () => {
  const mockCounts = { featured: 5, supersonic: 3, bmw: 0 };

  it("renders brand title and nav groups", () => {
    render(<Sidebar groups={NAV_GROUPS} counts={mockCounts} active="featured" />);
    expect(screen.getByText("RL Companion")).toBeInTheDocument();
    expect(screen.getByText("Daily Shops")).toBeInTheDocument();
    expect(screen.getByText("Featured Shop")).toBeInTheDocument();
  });

  it("triggers onSelect when a shop item is clicked", () => {
    const handleSelect = vi.fn();
    render(<Sidebar groups={NAV_GROUPS} counts={mockCounts} active="featured" onSelect={handleSelect} />);
    
    fireEvent.click(screen.getByText("Supersonic Customs"));
    expect(handleSelect).toHaveBeenCalledWith("supersonic");
  });

  it("triggers onToggle when collapse button is clicked", () => {
    const handleToggle = vi.fn();
    render(<Sidebar groups={NAV_GROUPS} counts={mockCounts} active="featured" onToggle={handleToggle} />);
    
    const toggleBtn = screen.getByRole("button", { name: /Collapse sidebar/i });
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalled();
  });

  it("renders in collapsed mode properly", () => {
    const { container } = render(
      <Sidebar groups={NAV_GROUPS} counts={mockCounts} active="featured" collapsed={true} />
    );
    expect(container.querySelector(".sidebar.collapsed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Expand sidebar/i })).toBeInTheDocument();
  });

  it("handles mobile open state and backdrop click", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Sidebar groups={NAV_GROUPS} counts={mockCounts} active="featured" mobileOpen={true} onClose={handleClose} />
    );

    expect(container.querySelector(".sidebar-backdrop")).toBeInTheDocument();
    fireEvent.click(container.querySelector(".sidebar-backdrop"));
    expect(handleClose).toHaveBeenCalled();
  });

  it("renders with default props without error", () => {
    expect(() => render(<Sidebar />)).not.toThrow();
  });
});
