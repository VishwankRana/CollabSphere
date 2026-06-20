import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
import ConnectionStatusBadge from "./ConnectionStatusBadge";

function getInitials(name) {
  if (!name) {
    return "?";
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function AppTopBar({
  connectionStatus,
  roomStatus,
  roomTitle,
  showActiveDot = false,
  variant = "default",
}) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSignOut() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  const statusLabel =
    roomStatus === "active" ? "Active" : roomStatus === "ended" ? "Ended" : "Waiting";

  return (
    <header className="cs-topbar">
      <div className="cs-topbar-left">
        <Link className="cs-logo" to="/">
          <span
            className={`cs-logo-dot${showActiveDot ? " cs-logo-dot--active" : ""}`}
            aria-hidden="true"
          />
          <span className="font-display">CodeScreen</span>
        </Link>
      </div>

      {variant === "room" && roomTitle ? (
        <div className="cs-topbar-center">
          <span className="cs-topbar-room-title">{roomTitle}</span>
          <span className="cs-topbar-separator" aria-hidden="true">
            |
          </span>
          <span className={`cs-badge cs-badge--status-${roomStatus || "waiting"}`}>
            {statusLabel}
          </span>
        </div>
      ) : null}

      {variant === "replay" && roomTitle ? (
        <div className="cs-topbar-center">
          <span className="cs-topbar-room-title">Replay: {roomTitle}</span>
        </div>
      ) : null}

      <div className="cs-topbar-right">
        {connectionStatus ? <ConnectionStatusBadge status={connectionStatus} /> : null}

        <div className="cs-user-menu" ref={menuRef}>
          <button
            type="button"
            className="cs-avatar-btn"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span className="cs-avatar">{getInitials(user?.name)}</span>
          </button>

          {menuOpen ? (
            <div className="cs-user-dropdown" role="menu">
              <Link className="cs-user-dropdown-item" role="menuitem" to="/" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <button
                type="button"
                className="cs-user-dropdown-item"
                role="menuitem"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
