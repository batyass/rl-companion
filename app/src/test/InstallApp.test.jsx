import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InstallButton, InstallHelpModal } from "../components/InstallApp.jsx";
import { useInstallPrompt } from "../hooks/useInstallPrompt.js";

function Harness() {
  const install = useInstallPrompt();
  return (
    <div>
      {install.canInstall && <InstallButton onClick={install.install} />}
      <InstallHelpModal open={install.helpOpen} onClose={install.closeHelp} />
    </div>
  );
}

describe("InstallButton", () => {
  it("renders an icon button with an install label and fires onClick", () => {
    const onClick = vi.fn();
    render(<InstallButton onClick={onClick} />);
    const btn = screen.getByRole("button", { name: "Install app" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders the full variant with a visible label", () => {
    render(<InstallButton variant="full" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Install app" })).toBeInTheDocument();
  });
});

describe("InstallHelpModal", () => {
  it("returns null when closed", () => {
    render(<InstallHelpModal open={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the iOS steps and closes via the Got it button", () => {
    const onClose = vi.fn();
    render(<InstallHelpModal open={true} onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Add to Home Screen/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking the backdrop", () => {
    const onClose = vi.fn();
    render(<InstallHelpModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("dialog").parentElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("useInstallPrompt integration", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the install button after beforeinstallprompt and runs the native prompt", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    render(<Harness />);

    // No installability signal yet — button hidden.
    expect(screen.queryByRole("button", { name: "Install app" })).not.toBeInTheDocument();

    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(event);

    const btn = await screen.findByRole("button", { name: "Install app" });
    fireEvent.click(btn);

    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    // Accepted install → button disappears.
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Install app" })).not.toBeInTheDocument();
    });
  });
});
