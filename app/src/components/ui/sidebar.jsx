import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// Collapsed/expanded widths for the sidebar, exposed like shadcn's constants
// and mirrored in :root as --sidebar-width / --sidebar-width-icon so both the
// component and plain CSS stay in sync.
export const SIDEBAR_WIDTH = "260px";
export const SIDEBAR_WIDTH_ICON = "72px";
export const SIDEBAR_WIDTH_MOBILE = "260px";
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";

const SidebarContext = createContext(null);

function useIsMobile(breakpoint = 767) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isMobile;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a <SidebarProvider>.");
  }
  return ctx;
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  defaultOpenMobile = false,
  openMobile: openMobileProp,
  onOpenMobileChange,
  children,
}) {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalOpenMobile, setInternalOpenMobile] = useState(defaultOpenMobile);

  const open = openProp !== undefined ? openProp : internalOpen;
  const openMobile = openMobileProp !== undefined ? openMobileProp : internalOpenMobile;

  const setOpen = useCallback(
    (next) => {
      if (onOpenChange) onOpenChange(next);
      else setInternalOpen(next);
    },
    [onOpenChange]
  );

  const setOpenMobile = useCallback(
    (next) => {
      if (onOpenMobileChange) onOpenMobileChange(next);
      else setInternalOpenMobile(next);
    },
    [onOpenMobileChange]
  );

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile(!openMobile);
    else setOpen(!open);
  }, [isMobile, openMobile, open, setOpen, setOpenMobile]);

  // cmd/ctrl+b toggles the sidebar, matching shadcn's keyboard shortcut.
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === SIDEBAR_KEYBOARD_SHORTCUT) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  const value = useMemo(
    () => ({
      state: open ? "expanded" : "collapsed",
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "icon",
  className,
  children,
  ariaLabel = "Sidebar",
  ...props
}) {
  const { state, openMobile } = useSidebar();
  return (
    <aside
      data-slot="sidebar"
      data-side={side}
      data-variant={variant}
      data-collapsible={collapsible}
      data-state={state}
      data-mobile={openMobile ? "" : undefined}
      className={cn(
        "sidebar",
        state === "collapsed" && "collapsed",
        openMobile && "mobile-open",
        className
      )}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ className, children, ...props }) {
  return (
    <div data-slot="sidebar-header" className={cn("sidebar-header", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarFooter({ className, children, ...props }) {
  return (
    <div data-slot="sidebar-footer" className={cn("sidebar-footer", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarContent({ className, children, ...props }) {
  return (
    <div data-slot="sidebar-content" className={cn("sidebar-content", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarInset({ className, children, ...props }) {
  return (
    <main data-slot="sidebar-inset" className={cn("sidebar-inset", className)} {...props}>
      {children}
    </main>
  );
}

export function SidebarGroup({ className, children, ...props }) {
  return (
    <div data-slot="sidebar-group" className={cn("sidebar-group", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarGroupLabel({ className, children, ...props }) {
  return (
    <div data-slot="sidebar-group-label" className={cn("sidebar-group-label", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarGroupAction({ className, children, ...props }) {
  return (
    <button data-slot="sidebar-group-action" className={cn("sidebar-group-action", className)} {...props}>
      {children}
    </button>
  );
}

export function SidebarGroupContent({ className, children, ...props }) {
  return (
    <div data-slot="sidebar-group-content" className={cn("sidebar-group-content", className)} {...props}>
      {children}
    </div>
  );
}

export function SidebarMenu({ className, children, ...props }) {
  return (
    <ul data-slot="sidebar-menu" className={cn("sidebar-menu", className)} {...props}>
      {children}
    </ul>
  );
}

export function SidebarMenuItem({ className, children, ...props }) {
  return (
    <li data-slot="sidebar-menu-item" className={cn("sidebar-menu-item", className)} {...props}>
      {children}
    </li>
  );
}

function mergeRenderProps(render, props, className, children) {
  return React.cloneElement(
    render,
    {
      ...props,
      ...render.props,
      className: cn(className, render.props?.className),
    },
    children ?? render.props?.children
  );
}

export function SidebarMenuButton({ render, isActive = false, className, children, ...props }) {
  const { state } = useSidebar();
  const base = cn("sidebar-menu-button", isActive && "active", className);
  if (render) {
    return mergeRenderProps(render, props, base, children);
  }
  return (
    <button
      data-slot="sidebar-menu-button"
      data-state={state}
      data-active={isActive || undefined}
      className={base}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarMenuAction({ className, children, ...props }) {
  return (
    <button data-slot="sidebar-menu-action" className={cn("sidebar-menu-action", className)} {...props}>
      {children}
    </button>
  );
}

export function SidebarMenuBadge({ className, children, ...props }) {
  return (
    <span data-slot="sidebar-menu-badge" className={cn("sidebar-menu-badge", className)} {...props}>
      {children}
    </span>
  );
}

export function SidebarMenuSub({ className, children, ...props }) {
  return (
    <ul data-slot="sidebar-menu-sub" className={cn("sidebar-menu-sub", className)} {...props}>
      {children}
    </ul>
  );
}

export function SidebarMenuSubItem({ className, children, ...props }) {
  return (
    <li data-slot="sidebar-menu-sub-item" className={cn("sidebar-menu-sub-item", className)} {...props}>
      {children}
    </li>
  );
}

export function SidebarMenuSubButton({ render, isActive = false, className, children, ...props }) {
  const base = cn("sidebar-menu-sub-button", isActive && "active", className);
  if (render) {
    return mergeRenderProps(render, props, base, children);
  }
  return (
    <button
      data-slot="sidebar-menu-sub-button"
      data-active={isActive || undefined}
      className={base}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarTrigger({ className, children, onClick, "aria-label": ariaLabel, ...props }) {
  const { toggleSidebar, state } = useSidebar();
  return (
    <button
      data-slot="sidebar-trigger"
      data-state={state}
      onClick={(e) => {
        onClick?.(e);
        toggleSidebar();
      }}
      aria-label={ariaLabel ?? (state === "expanded" ? "Collapse sidebar" : "Expand sidebar")}
      className={cn("sidebar-trigger", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarRail({ className, ...props }) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      data-slot="sidebar-rail"
      className={cn("sidebar-rail", className)}
      onClick={toggleSidebar}
      aria-hidden="true"
      tabIndex={-1}
      {...props}
    />
  );
}
