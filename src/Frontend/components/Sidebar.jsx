import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Clock,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
} from "lucide-react";

import { useAuth } from "../auth/useAuth.jsx";
import IconLabel from "./IconLabel";

const STORAGE_KEY = "sidebar_collapsed";

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

function isSidebarHidden(pathname) {
  const roomMatch = pathname.match(/^\/rooms\/([^/]+)(?:\/(.*))?$/);

  if (!roomMatch) {
    return false;
  }

  const subPath = roomMatch[2];

  if (!subPath) {
    return true;
  }

  return subPath === "replay";
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? "true" : "false");
  }, [collapsed]);

  if (isSidebarHidden(location.pathname)) {
    return null;
  }

  function handleSignOut() {
    logout();
    navigate("/login");
  }

  function scrollToRecent() {
    if (location.pathname === "/") {
      document.getElementById("interview-list")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    navigate("/#interview-list");
  }

  const mainNav = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/rooms/new", label: "New Interview", icon: Plus },
    { onClick: scrollToRecent, label: "Recent", icon: Clock },
  ];

  const workspaceNav = [{ to: "/#interview-list", label: "Replays", icon: Play }];

  function isActive(path, end = false) {
    if (path === "/") {
      return end && location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  }

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {mainNav.map((item) => {
          const active = item.to ? isActive(item.to, item.end) : false;
          const className = `sidebar-item${active ? " sidebar-item--active" : ""}`;

          if (item.onClick) {
            return (
              <button
                key={item.label}
                type="button"
                className={className}
                title={collapsed ? item.label : undefined}
                onClick={item.onClick}
              >
                <IconLabel icon={item.icon} size={18}>
                  {!collapsed ? item.label : null}
                </IconLabel>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              className={className}
              title={collapsed ? item.label : undefined}
              to={item.to}
            >
              <IconLabel icon={item.icon} size={18}>
                {!collapsed ? item.label : null}
              </IconLabel>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-section-label">{collapsed ? "..." : "WORKSPACE"}</div>

      <nav className="sidebar-nav" aria-label="Workspace navigation">
        {workspaceNav.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.label}
              className={`sidebar-item${active ? " sidebar-item--active" : ""}`}
              title={collapsed ? item.label : undefined}
              to={item.to}
            >
              <IconLabel icon={item.icon} size={18}>
                {!collapsed ? item.label : null}
              </IconLabel>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-item sidebar-collapse-toggle"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((current) => !current)}
        >
          <IconLabel icon={collapsed ? PanelLeftOpen : PanelLeftClose} size={16}>
            {!collapsed ? "Collapse" : null}
          </IconLabel>
        </button>

        <button type="button" className="sidebar-item" onClick={handleSignOut}>
          <IconLabel icon={LogOut} size={18}>
            {!collapsed ? "Sign out" : null}
          </IconLabel>
        </button>

        <a
          className="sidebar-item"
          href="https://github.com"
          rel="noreferrer"
          target="_blank"
          title={collapsed ? "Help" : undefined}
        >
          <IconLabel icon={HelpCircle} size={18}>
            {!collapsed ? "Help" : null}
          </IconLabel>
        </a>

        <div className="sidebar-user-strip">
          <span className="sidebar-user-avatar">{getInitials(user?.name)}</span>
          {!collapsed ? (
            <div className="sidebar-user-meta">
              <span className="sidebar-user-name">{user?.name || "User"}</span>
              <span className="sidebar-user-role">{user?.email || ""}</span>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
