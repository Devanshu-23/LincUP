import { useEffect } from "react";
import { Link } from "react-router-dom";
import { toneFor } from "../utils/format";
import Icon from "./Icon";
import "./Drawer.css";

// Side panel on desktop, bottom sheet on mobile. Shared by events and posts.
// Closes on Esc/backdrop.
export default function Drawer({ title, communityId, communityName, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={`drawer-hero tone-${toneFor(communityId)}`}>
          <button className="icon-btn drawer-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
          {communityName && (
            <Link to={`/communities/${communityId}`} className="drawer-community">
              {communityName}
            </Link>
          )}
          <h2>{title}</h2>
        </div>

        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
