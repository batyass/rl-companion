// Presentational pieces for the PWA install flow. The visibility logic lives
// in useInstallPrompt(); these components just render.
//
// - InstallButton: "Install app" — icon variant for the mobile topbar, full
//   variant for the desktop sidebar footer.
// - InstallPill: the hero pill among "Live item shop" / the timer — always
//   visible until installed, so the install path is discoverable everywhere.
// - InstallHelpModal: step-by-step Add-to-Home-Screen guidance for iOS Safari,
//   where there is no programmatic install API.

import GlassSurface from "../reactbits/GlassSurface.jsx";

function InstallIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function InstallPill({ onClick }) {
  return (
    <GlassSurface
      className="pill-glass pill-install"
      // Same glass recipe as the hero pills (Live item shop / timer).
      width="auto"
      height="auto"
      borderRadius={999}
      backgroundOpacity={0.1}
      saturation={1.6}
      displace={0}
      distortionScale={-30}
      borderWidth={0.15}
      role="button"
      tabIndex={0}
      aria-label="Install app"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      <InstallIcon />
      Install app
    </GlassSurface>
  );
}

export function InstallButton({ variant = "icon", onClick }) {
  if (variant === "full") {
    return (
      <button className="sidebar-install" onClick={onClick} title="Install app">
        <InstallIcon />
        <span className="sidebar-install-label">Install app</span>
      </button>
    );
  }
  return (
    <button className="icon-button install-icon-button" onClick={onClick} aria-label="Install app" title="Install app">
      <InstallIcon />
    </button>
  );
}

export function InstallHelpModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog install-help-dialog" role="dialog" aria-modal="true" aria-labelledby="installHelpTitle">
        <div className="install-help-body">
          <button className="modal-close-btn" onClick={onClose} aria-label="Close install help">✕</button>
          <div className="install-help-icon" aria-hidden="true"><InstallIcon /></div>
          <h2 id="installHelpTitle">Install RL Companion</h2>
          <p className="install-help-sub">
            Get the full app experience — a home-screen icon, full-screen view,
            and offline access to today's shop.
          </p>
          <ol className="install-help-steps">
            <li>
              <span className="install-step-num" aria-hidden="true">1</span>
              <span>Tap the <b>Share</b> button <svg className="install-share-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3" /><path d="M7 8l5-5 5 5" /><path d="M5 21h14" /></svg> in Safari's toolbar.</span>
            </li>
            <li>
              <span className="install-step-num" aria-hidden="true">2</span>
              <span>Scroll down and tap <b>"Add to Home Screen"</b>.</span>
            </li>
            <li>
              <span className="install-step-num" aria-hidden="true">3</span>
              <span>Tap <b>Add</b> — done, RL Companion is on your Home Screen.</span>
            </li>
          </ol>
          <button className="install-help-done" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
