import { Link } from "react-router-dom";
import { toneFor } from "../utils/format";
import "./CommunityCard.css";

// Card used on the Communities directory and the Feed.
// `membership` is the user's role ("owner"/"member") or null if not joined.
export default function CommunityCard({ community, membership, onJoin, onLeave, busy }) {
  const tone = toneFor(community.id);
  const isOwner = membership === "owner";

  return (
    <article className={`community-card card-tone-${tone}`}>
      <Link to={`/communities/${community.id}`} className="community-card-link">
        <div className={`community-badge tone-${tone}`} aria-hidden="true">
          {community.name.trim()[0]?.toUpperCase()}
        </div>
        <div className="community-card-text">
          <h3>{community.name}</h3>
          <p className="muted">
            {community.description || "No description yet."}
          </p>
        </div>
      </Link>

      <div className="community-card-foot">
        {membership ? (
          <span className="chip chip-primary">
            {isOwner ? "★ Owner" : "✓ Joined"}
          </span>
        ) : (
          <span className="chip">Open to all</span>
        )}

        {onJoin &&
          (membership ? (
            !isOwner && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onLeave(community.id)}
                disabled={busy}
              >
                Leave
              </button>
            )
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onJoin(community.id)}
              disabled={busy}
            >
              Join
            </button>
          ))}
      </div>
    </article>
  );
}
