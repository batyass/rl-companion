import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ParallaxBackground from "../components/ParallaxBackground.jsx";

describe("ParallaxBackground component", () => {
  it("renders background layers with aria-hidden", () => {
    const { container } = render(<ParallaxBackground />);
    const parallaxEl = container.querySelector(".parallax");
    expect(parallaxEl).toBeInTheDocument();
    expect(parallaxEl).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".parallax-hex")).toBeInTheDocument();
    expect(container.querySelector(".parallax-orbs")).toBeInTheDocument();
    expect(container.querySelector(".parallax-dots")).toBeInTheDocument();
  });
});
