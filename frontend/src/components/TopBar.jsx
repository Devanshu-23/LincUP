import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useTheme from "../hooks/useTheme";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { NAV_ITEMS } from "./navItems";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the profile menu when clicking anywhere outside it
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/home" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          LincUP
        </Link>

        <nav className="topbar-nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className="topbar-link">
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title="Toggle theme"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>

          <div className="profile-menu" ref={menuRef}>
            <button
              className="avatar-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <Avatar name={user?.full_name} id={user?.id} size={36} />
            </button>
            {menuOpen && (
              <div className="menu" role="menu">
                <div className="menu-header">
                  <strong>{user?.full_name}</strong>
                  <span className="muted">{user?.email}</span>
                </div>
                <Link
                  to="/profile"
                  className="menu-item"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name="user" size={18} /> My profile
                </Link>
                <button className="menu-item" role="menuitem" onClick={handleLogout}>
                  <Icon name="logout" size={18} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
