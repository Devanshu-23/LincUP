import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import Avatar from "../components/Avatar";
import CreateEventModal from "../components/CreateEventModal";
import CreatePostModal from "../components/CreatePostModal";
import EmptyState from "../components/EmptyState";
import EventCard from "../components/EventCard";
import EventDrawer from "../components/EventDrawer";
import Icon from "../components/Icon";
import PostDrawer from "../components/PostDrawer";
import PostsTab from "../components/PostsTab";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import useApi from "../hooks/useApi";
import { isPast, toneFor } from "../utils/format";
import "./CommunityDetailPage.css";

const loadCommunityPage = (id) =>
  Promise.all([
    api.getCommunity(id),
    api.listCommunityEvents(id),
    api.getMyCommunities(),
    api.getMyEvents(),
  ]).then(([community, events, myCommunities, myEvents]) => ({
    community,
    events,
    role: myCommunities.find((c) => c.id === community.id)?.role || null,
    goingIds: new Set(myEvents.map((e) => e.id)),
  }));

// Loaded separately, so a problem with posts doesn't take down the whole page.
// Posts only carry the author's id, so look the names up as well.
async function loadPosts(communityId) {
  const posts = await api.listCommunityPosts(communityId);
  const authorIds = [...new Set(posts.map((p) => p.created_by))];
  const names = new Map(
    await Promise.all(
      authorIds.map((id) =>
        api
          .getUser(id)
          .then((author) => [id, author.full_name])
          .catch(() => [id, "LincUP member"]),
      ),
    ),
  );
  return posts
    .map((p) => ({ ...p, authorName: names.get(p.created_by) }))
    .sort((a, b) => b.id - a.id); // newest first
}

function MembersTab({ communityId }) {
  const { data, loading, error } = useApi(
    () => api.getCommunityMembers(communityId),
    [communityId],
  );
  if (loading) return <Spinner label="Loading members…" />;
  if (error) return <div className="alert alert-error">{error.message}</div>;
  return (
    <ul className="member-list">
      {data.map((m) => (
        <li key={m.user_id} className="card">
          <Avatar name={m.full_name} id={m.user_id} size={42} />
          <div>
            <strong>{m.full_name}</strong>
            <span className="muted">
              {m.degree_program} · Year {m.study_year} · {m.department}
            </span>
          </div>
          {m.role !== "member" && <span className="chip chip-accent">{m.role}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function CommunityDetailPage() {
  const { id } = useParams();
  const communityId = Number(id);
  const { user } = useAuth();
  const { data, loading, error, reload, setData } = useApi(
    () => loadCommunityPage(communityId),
    [communityId],
  );
  const posts = useApi(() => loadPosts(communityId), [communityId]);
  const [tab, setTab] = useState("events");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [openEvent, setOpenEvent] = useState(null);
  const [openPost, setOpenPost] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  if (loading) return <Spinner label="Loading community…" />;
  if (error) {
    return (
      <EmptyState
        emoji="🧭"
        title={error.status === 404 ? "Community not found" : "Couldn't load community"}
        action={
          <Link to="/communities" className="btn btn-primary">
            Back to communities
          </Link>
        }
      >
        {error.message}
      </EmptyState>
    );
  }

  const { community, events, role, goingIds } = data;
  const isMember = Boolean(role);
  const isOwner = community.created_by === user.id;
  const tone = toneFor(community.id);
  const upcoming = events.filter((e) => !isPast(e));
  const past = events.filter(isPast).reverse();

  const toggleMembership = async () => {
    if (
      isMember &&
      !window.confirm(`Leave ${community.name}? Your RSVPs for its events will be cancelled.`)
    ) {
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      if (isMember) await api.leaveCommunity(community.id);
      else await api.joinCommunity(community.id);
      if (isMember && tab === "members") setTab("events");
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRsvpChange = (eventId, going) => {
    setData((d) => {
      const goingIds = new Set(d.goingIds);
      if (going) goingIds.add(eventId);
      else goingIds.delete(eventId);
      return { ...d, goingIds };
    });
  };

  // Heading of an event list. The first one also has the "New event" button,
  // in the same place as "New post" on the posts tab.
  const renderHeading = (title, isFirst) => (
    <div className="section-title">
      <h2 className="list-heading">{title}</h2>
      {isFirst && isOwner && (
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={16} /> New event
        </button>
      )}
    </div>
  );

  const renderEvents = (list) => (
    <div className="event-list">
      {list.map((ev) => (
        <EventCard
          key={ev.id}
          event={ev}
          going={goingIds.has(ev.id)}
          onOpen={setOpenEvent}
        />
      ))}
    </div>
  );

  return (
    <>
      <Link to="/communities" className="back-link">
        <Icon name="arrowLeft" size={16} /> All communities
      </Link>

      <header className={`community-hero hero-tone-${tone}`}>
        <div className={`community-hero-badge tone-${tone}`} aria-hidden="true">
          {community.name.trim()[0]?.toUpperCase()}
        </div>
        <div className="community-hero-text">
          <div className="community-hero-chips">
            {isOwner && <span className="chip chip-accent">★ You own this</span>}
            {isMember && !isOwner && <span className="chip chip-primary">✓ Member</span>}
          </div>
          <h1>{community.name}</h1>
          <p className="muted">{community.description || "No description yet."}</p>
        </div>
        {!isOwner && (
          <div className="community-hero-actions">
            <button
              className={`btn ${isMember ? "btn-outline" : "btn-primary"}`}
              onClick={toggleMembership}
              disabled={busy}
            >
              {isMember ? "Leave community" : "Join community"}
            </button>
          </div>
        )}
      </header>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div className="segmented community-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "events"}
          className={tab === "events" ? "active" : ""}
          onClick={() => setTab("events")}
        >
          Events <span>{events.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === "posts"}
          className={tab === "posts" ? "active" : ""}
          onClick={() => setTab("posts")}
        >
          General posts {posts.data && <span>{posts.data.length}</span>}
        </button>
        {isMember && (
          <button
            role="tab"
            aria-selected={tab === "members"}
            className={tab === "members" ? "active" : ""}
            onClick={() => setTab("members")}
          >
            Members
          </button>
        )}
      </div>

      {tab === "events" &&
        (events.length === 0 ? (
          <EmptyState
            emoji="📅"
            title="No events yet"
            action={
              isOwner && (
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                  Create the first event
                </button>
              )
            }
          >
            {isOwner
              ? "Plan something for your members, like a meetup, a workshop or a trip."
              : "When this community plans something, it will show up here."}
          </EmptyState>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="section">
                {renderHeading("Upcoming", true)}
                {renderEvents(upcoming)}
              </section>
            )}
            {past.length > 0 && (
              <section className="section">
                {renderHeading("Past", upcoming.length === 0)}
                {renderEvents(past)}
              </section>
            )}
          </>
        ))}

      {tab === "posts" && (
        <PostsTab
          posts={posts}
          isMember={isMember}
          onOpen={setOpenPost}
          onCreate={() => setShowCreatePost(true)}
        />
      )}

      {tab === "members" && isMember && <MembersTab communityId={community.id} />}

      {openEvent && (
        <EventDrawer
          event={openEvent}
          communityName={community.name}
          isMember={isMember}
          onClose={() => setOpenEvent(null)}
          onRsvpChange={handleRsvpChange}
        />
      )}

      {openPost && (
        <PostDrawer
          post={openPost}
          communityName={community.name}
          onClose={() => setOpenPost(null)}
        />
      )}

      {showCreate && (
        <CreateEventModal
          communityId={community.id}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setTab("events");
            reload();
          }}
        />
      )}

      {showCreatePost && (
        <CreatePostModal
          communityId={community.id}
          onClose={() => setShowCreatePost(false)}
          onCreated={() => {
            setShowCreatePost(false);
            setTab("posts");
            posts.reload();
          }}
        />
      )}
    </>
  );
}
