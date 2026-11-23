import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import Avatar from "../components/Avatar";
import ConfirmDialog from "../components/ConfirmDialog";
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
import { canManageEvents, leaveWarning } from "../utils/roles";
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

function MembersTab({ communityId, isOwner }) {
  const { data, loading, error, setData } = useApi(
    () => api.getCommunityMembers(communityId),
    [communityId],
  );
  const [nominee, setNominee] = useState(null);
  if (loading) return <Spinner label="Loading members…" />;
  if (error) return <div className="alert alert-error">{error.message}</div>;
  const nominate = async () => {
    try {
      await api.nominateConvener(communityId, nominee.user_id);
    } catch (err) {
      if (err.status !== 409) throw err; // 409: already a convener, same end result
    }
    setData((list) =>
      list.map((m) => (m.user_id === nominee.user_id ? { ...m, role: "convener" } : m)),
    );
    setNominee(null);
  };

  return (
    <>
      {isOwner && (
        <p className="members-hint muted">
          {data.length > 1
            ? "Conveners help you run the community: they can create and delete its events."
            : "When students join, you can make them conveners to help you run events."}
        </p>
      )}
      <ul className="member-list">
        {data.map((m) => (
          <li key={m.user_id} className="card">
            <Avatar name={m.full_name} id={m.user_id} size={42} />
            <div>
              <strong>{m.full_name}</strong>
              <span className="muted">
                {m.degree_program} · Year {m.study_year} · {m.department}
              </span>
              {isOwner && m.role === "member" && (
                <button
                  className="btn btn-outline btn-sm member-promote"
                  onClick={() => setNominee(m)}
                  aria-label={`Make ${m.full_name} a convener`}
                >
                  Make convener
                </button>
              )}
            </div>
            {m.role !== "member" && <span className="chip chip-accent">{m.role}</span>}
          </li>
        ))}
      </ul>
      {nominee && (
        <ConfirmDialog
          title="Make convener?"
          confirmLabel="Make convener"
          busyLabel="Saving…"
          onConfirm={nominate}
          onClose={() => setNominee(null)}
        >
          <strong>{nominee.full_name}</strong> will be able to create events and delete any event
          in this community. Only choose someone you trust.
        </ConfirmDialog>
      )}
    </>
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
  const canManage = canManageEvents(role);
  const tone = toneFor(community.id);
  const upcoming = events.filter((e) => !isPast(e));
  const past = events.filter(isPast).reverse();

  const toggleMembership = async () => {
    if (
      isMember &&
      !window.confirm(leaveWarning(community.name, role))
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

  const handleEventDeleted = (eventId) => {
    setData((d) => ({ ...d, events: d.events.filter((e) => e.id !== eventId) }));
  };

  // Heading of an event list. The first one also has the "New event" button,
  // in the same place as "New post" on the posts tab.
  const renderHeading = (title, isFirst) => (
    <div className="section-title">
      <h2 className="list-heading">{title}</h2>
      {isFirst && canManage && (
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
            {isMember && !isOwner && (
              <span className="chip chip-primary">
                {role === "convener" ? "✓ Convener" : "✓ Member"}
              </span>
            )}
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
              canManage && (
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                  Create the first event
                </button>
              )
            }
          >
            {canManage
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

      {tab === "members" && isMember && <MembersTab communityId={community.id} isOwner={isOwner} />}

      {openEvent && (
        <EventDrawer
          event={openEvent}
          communityName={community.name}
          isMember={isMember}
          canManage={canManage}
          onClose={() => setOpenEvent(null)}
          onRsvpChange={handleRsvpChange}
          onDeleted={handleEventDeleted}
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
