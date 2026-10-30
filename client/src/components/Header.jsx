import { useEffect, useRef, useState } from "react";
import { Clock, Diamond, LogOut, Settings, User, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const PRIMARY_NAV = [
  { key: "home", label: "Explore" },
  { key: "image", label: "Image", media: "image" },
  { key: "ref", label: "Ref Image", path: "ref", badge: "New" },
  { key: "video", label: "Video", media: "video" },
  { key: "remotion", label: "Remotion Engine", path: "remotion", badge: "New" },
];

export const Header = ({
  activeTab,
  mediaType,
  path,
  bannerVisible,
  onDismissBanner,
  onNavigate,
  onMediaNavigate,
  onRemotionNavigate,
  onRefNavigate,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointer);
    return () => window.removeEventListener("pointerdown", handlePointer);
  }, [open]);

  const isPrimaryActive = (item) => {
    if (item.key === "home") return activeTab === "home";
    if (item.key === "remotion") {
      return activeTab === "studio" && path === "remotion" && mediaType === "video";
    }
    if (item.key === "ref") {
      return activeTab === "studio" && path === "ref" && mediaType === "image";
    }
    if (item.media) {
      return (
        activeTab === "studio" &&
        mediaType === item.media &&
        path !== "remotion" &&
        path !== "ref"
      );
    }
    return false;
  };

  const handleNavClick = (item) => {
    if (item.key === "remotion") {
      onRemotionNavigate();
      return;
    }
    if (item.key === "ref") {
      onRefNavigate?.();
      return;
    }
    if (item.media) {
      onMediaNavigate(item.media);
      return;
    }
    onNavigate(item.key);
  };

  return (
    <>
      {bannerVisible && (
        <div className="vc-banner">
          <span className="vc-banner-tag">EXTRA DISCOUNT</span>
          <span>Sign up and get additional discount on premium plans</span>
          <button
            className="vc-banner-close"
            onClick={onDismissBanner}
            aria-label="Dismiss banner"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      <header className="vc-topbar">
        <button className="vc-brand" onClick={() => onNavigate("home")}>
          <span className="vc-brand-mark">V</span>
          <span className="vc-brand-name">VidCraft</span>
        </button>

        <nav className="vc-nav" aria-label="Primary">
          <div className="vc-nav-primary">
            {PRIMARY_NAV.map((item) => (
              <button
                key={item.key}
                className={`vc-nav-link${isPrimaryActive(item) ? " is-active" : ""}`}
                onClick={() => handleNavClick(item)}
              >
                {item.label}
                {item.badge && <span className="vc-nav-badge">{item.badge}</span>}
              </button>
            ))}
          </div>
        </nav>

        <div className="vc-topbar-actions" ref={menuRef}>
          <div className="vc-pricing-wrap">
            <button className="vc-btn-ghost" onClick={() => onNavigate("settings")}>
              <Diamond size={13} strokeWidth={1.8} />
              Pricing
            </button>
            <span className="vc-offer-tag">30% OFF</span>
          </div>

          {isAuthenticated ? (
            <span className="vc-user-chip" title={user?.email}>
              {user?.name || "Account"}
            </span>
          ) : (
            <>
              <button className="vc-btn-text" onClick={() => onNavigate("login")}>
                Login
              </button>
              <button className="vc-btn-signup" onClick={() => onNavigate("signup")}>
                Sign up
              </button>
            </>
          )}

          <button
            className="vc-profile-btn"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Account menu"
          >
            <User size={16} strokeWidth={1.7} />
          </button>

          {open && (
            <div className="vc-menu">
              {isAuthenticated && (
                <>
                  <div className="vc-menu-user">
                    <div className="vc-menu-user-name">{user?.name}</div>
                    <div className="vc-menu-user-email">{user?.email}</div>
                  </div>
                  <div className="vc-menu-divider" />
                </>
              )}
              <button
                className="vc-menu-item"
                onClick={() => {
                  setOpen(false);
                  onNavigate("home");
                }}
              >
                Explore
              </button>
              <button
                className="vc-menu-item"
                onClick={() => {
                  setOpen(false);
                  onNavigate("history");
                }}
              >
                <Clock size={15} strokeWidth={1.7} />
                History
              </button>
              <div className="vc-menu-divider" />
              <button
                className="vc-menu-item"
                onClick={() => {
                  setOpen(false);
                  onNavigate("settings");
                }}
              >
                <Settings size={15} strokeWidth={1.7} />
                Settings
              </button>
              {isAuthenticated ? (
                <button
                  className="vc-menu-item"
                  onClick={() => {
                    setOpen(false);
                    logout();
                    onNavigate("home");
                  }}
                >
                  <LogOut size={15} strokeWidth={1.7} />
                  Log out
                </button>
              ) : (
                <button
                  className="vc-menu-item"
                  onClick={() => {
                    setOpen(false);
                    onNavigate("login");
                  }}
                >
                  Sign in
                </button>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
};
