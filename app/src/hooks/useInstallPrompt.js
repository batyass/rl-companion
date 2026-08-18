import { useCallback, useEffect, useState } from "react";

// Session-scoped "don't nag me again": closing the iOS help modal hides the
// install button for the rest of the session, but it returns on the next visit.
const DISMISS_KEY = "rl-install-dismissed";

function isIos() {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Modern iPads report as Macs, so the touch-points check is required.
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && navigator.maxTouchPoints > 1 && !window.MSStream)
  );
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari exposes the standalone flag instead of a display-mode.
    navigator.standalone === true
  );
}

// Detects when the current page is being viewed as an installed app.
function watchDisplayMode(onChange) {
  const mql = window.matchMedia?.("(display-mode: standalone)");
  if (!mql?.addEventListener) return () => {};
  const handler = (e) => onChange(e.matches);
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const [standalone, setStandalone] = useState(isStandalone);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => {
      // Chromium fires this when the installability criteria are met. Keep the
      // event so we can call prompt() later from a user gesture.
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setAppInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const unsubscribe = watchDisplayMode(setStandalone);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      unsubscribe();
    };
  }, []);

  const ios = isIos();
  let dismissed = false;
  try {
    dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    /* storage may be unavailable */
  }

  // Show the button when the platform can install and the app isn't already
  // installed / dismissed: Chromium waits for beforeinstallprompt, iOS always
  // falls back to manual Add-to-Home-Screen instructions.
  const canInstall = !standalone && !appInstalled && !dismissed && (!!deferredPrompt || ios);

  // The hero install pill is always visible until the app is installed — no
  // gating on prompt availability, so it shows even in browsers that never fire
  // beforeinstallprompt (and on iOS, where the flow is always manual).
  const canInstallHero = !standalone && !appInstalled;

  const install = useCallback(async () => {
    if (deferredPrompt) {
      // Chromium: show the native install prompt.
      const prompt = deferredPrompt;
      setDeferredPrompt(null);
      try {
        await prompt.prompt();
        const choice = await (prompt.userChoice ?? Promise.resolve(null));
        if (choice?.outcome === "accepted") setAppInstalled(true);
      } catch {
        /* user dismissed or prompt unavailable */
      }
      return;
    }
    // No native prompt (iOS Safari, or a browser that hasn't fired
    // beforeinstallprompt): guide the manual Add-to-Home-Screen flow.
    setHelpOpen(true);
  }, [deferredPrompt]);

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  return { canInstall, canInstallHero, install, helpOpen, closeHelp };
}
