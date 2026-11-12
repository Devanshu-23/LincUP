import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import CommunityCard from "../components/CommunityCard";
import CreateCommunityModal from "../components/CreateCommunityModal";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import Spinner from "../components/Spinner";
import useApi from "../hooks/useApi";
import "./CommunitiesPage.css";

const loadCommunities = () =>
  Promise.all([api.listCommunities(), api.getMyCommunities()]).then(
    ([all, mine]) => ({
      all,
      // community id -> my role ("owner" / "member")
      roles: Object.fromEntries(mine.map((c) => [c.id, c.role])),
    }),
  );

export default function CommunitiesPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(loadCommunities);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const visible = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.all.filter((c) => {
      if (filter === "joined" && !data.roles[c.id]) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      );
    });
  }, [data, query, filter]);

  const runAction = async (id, action) => {
    setBusyId(id);
    setActionError("");
    try {
      await action(id);
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleLeave = (id) => {
    const name = data.all.find((c) => c.id === id)?.name;
    if (window.confirm(`Leave ${name}? Your RSVPs for its events will be cancelled.`)) {
      runAction(id, api.leaveCommunity);
    }
  };

  const joinedCount = data ? Object.keys(data.roles).length : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Explore</p>
          <h1>Communities</h1>
          <p className="muted">
            Clubs, hobby groups and study circles across campus. Join the ones
            that feel like you.
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={18} /> Start a community
        </button>
      </div>

      <div className="toolbar">
        <label className="search">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Search communities…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search communities"
          />
        </label>
        <div className="segmented" role="tablist">
          <button
            role="tab"
            aria-selected={filter === "all"}
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All {data && <span>{data.all.length}</span>}
          </button>
          <button
            role="tab"
            aria-selected={filter === "joined"}
            className={filter === "joined" ? "active" : ""}
            onClick={() => setFilter("joined")}
          >
            Joined {data && <span>{joinedCount}</span>}
          </button>
        </div>
      </div>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      {loading ? (
        <Spinner label="Finding communities…" />
      ) : error ? (
        <div className="alert alert-error">{error.message}</div>
      ) : visible.length === 0 ? (
        query || filter === "joined" ? (
          <EmptyState emoji="🔍" title="Nothing matches">
            {filter === "joined" && !query
              ? "You haven't joined any communities yet."
              : "Try a different search term."}
          </EmptyState>
        ) : (
          <EmptyState
            emoji="🌱"
            title="No communities yet"
            action={
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                Start the first one
              </button>
            }
          >
            Be the first to bring people together on LincUP.
          </EmptyState>
        )
      ) : (
        <div className="grid">
          {visible.map((c) => (
            <CommunityCard
              key={c.id}
              community={c}
              membership={data.roles[c.id] || null}
              busy={busyId === c.id}
              onJoin={(id) => runAction(id, api.joinCommunity)}
              onLeave={handleLeave}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCommunityModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => navigate(`/communities/${c.id}`)}
        />
      )}
    </>
  );
}
