import { NavLink } from "react-router-dom";
import Icon from "./Icon";
import { NAV_ITEMS } from "./navItems";

// Mobile tab bar (hidden on wide screens, where TopBar shows the links).
export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} className="bottom-link">
          <Icon name={item.icon} size={22} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
