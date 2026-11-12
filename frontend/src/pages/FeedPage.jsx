import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import CommunityCard from "../components/CommunityCard";
import EmptyState from "../components/EmptyState";
import EventCard from "../components/EventCard";
import EventDrawer from "../components/EventDrawer";
import Icon from "../components/Icon";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import useApi from "../hooks/useApi";
import { isPast } from "../utils/format";
import { byStart } from "../utils/schedule";
import "./FeedPage.css";

// TODO: switch to GET /users/:id/feed once the backend adds it.
// Until then, build the feed from my communities + their events.
async function loadFeed() {
  const [myCommunities, myEvents] = await Promise.all([
    api.getMyCommunities(),
    api.getMyEvents(),
  ]);
  const eventLists = await Promise.all(
    myCommunities.map((c) => api.listCommunityEvents(c.id)),
  );
  const communityEvents = eventLists
    .flat()
    .filter((e) => !isPast(e))
    .sort(byStart);

  return {
    myCommunities,
    goingIds: new Set(myEvents.map((e) => e.id)),
    myUpcoming: myEvents.filter((e) => !isPast(e)).sort(byStart),
    communityEvents,
    communityNames: Object.fromEntries(myCommunities.map((c) => [c.id, c.name])),
  };
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function FeedPage() {
  const { user } = useAuth();
  const { data, loading, error, setData } = useApi(loadFeed);
  const [openEvent, setOpenEvent] = useState(null);

  if (loading) return <Spinner label="Catching up on campus…" />;
  if (error) return <div className="alert alert-error">{error.message}</div>;

  const firstName = user.full_name.split(" ")[0];
  const { myCommunities, myUpcoming, communityEvents, goingIds, communityNames } = data;
  const discover = communityEvents.filter((e) => !goingIds.has(e.id));

  const handleRsvpChange = (eventId, going) => {
    setData((d) => {
      const goingIds = new Set(d.goingIds);
      let myUpcoming = d.myUpcoming;
      if (going) {
        goingIds.add(eventId);
        const ev = d.communityEvents.find((e) => e.id === eventId);
        if (ev && !myUpcoming.some((e) => e.id === eventId)) {
          myUpcoming = [...myUpcoming, ev].sort(byStart);
        }
      } else {
        goingIds.delete(eventId);
        myUpcoming = myUpcoming.filter((e) => e.id !== eventId);
      }
      return { ...d, goingIds, myUpcoming };
    });
  };

  return (
    <>
      <section className="feed-hero">
        <div>
          <p className="eyebrow">{greeting()}</p>
          <h1>Hey {firstName}, what's the plan? ✌️</h1>
          <p className="feed-hero-sub">
            {myUpcoming.length > 0
              ? `You have ${myUpcoming.length} upcoming ${myUpcoming.length === 1 ? "plan" : "plans"}. `
              : "Nothing planned yet. "}
            {discover.length > 0 &&
              `${discover.length} more ${discover.length === 1 ? "event is" : "events are"} happening in your communities.`}
          </p>
        </div>
        <div className="feed-stats">
          <div>
            <strong>{myCommunities.length}</strong>
            <span>communities</span>
          </div>
          <div>
            <strong>{myUpcoming.length}</strong>
            <span>plans</span>
          </div>
        </div>
      </section>

      {myCommunities.length === 0 ? (
        <EmptyState
          emoji="👋"
          title="Welcome to LincUP!"
          action={
            <Link to="/communities" className="btn btn-primary">
              Find communities to join
            </Link>
          }
        >
          Join a few communities (clubs, sports, study groups) and their
          events will start showing up here.
        </EmptyState>
      ) : (
        <div className="feed-layout">
          <div className="feed-main">
            <section className="section">
              <div className="section-title">
                <h2>Your next plans</h2>
                {myUpcoming.length > 3 && (
                  <Link to="/planner" className="see-all">
                    See all in Planner →
                  </Link>
                )}
              </div>
              {myUpcoming.length === 0 ? (
                <p className="muted feed-hint">
                  RSVP to an event below and it'll show up here.
                </p>
              ) : (
                <div className="event-list">
                  {myUpcoming.slice(0, 3).map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      communityName={communityNames[ev.community_id]}
                      going
                      onOpen={setOpenEvent}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="section">
              <div className="section-title">
                <h2>Happening in your communities</h2>
              </div>
              {discover.length === 0 ? (
                <EmptyState emoji="🌤️" title="All caught up">
                  No other upcoming events in your communities right now.
                </EmptyState>
              ) : (
                <div className="event-list">
                  {discover.map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      communityName={communityNames[ev.community_id]}
                      onOpen={setOpenEvent}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="feed-side">
            <div className="section-title">
              <h2>Your communities</h2>
              <Link to="/communities" className="see-all">
                <Icon name="plus" size={16} /> Find more
              </Link>
            </div>
            <div className="feed-communities">
              {myCommunities.map((c) => (
                <CommunityCard key={c.id} community={c} membership={c.role} />
              ))}
            </div>
          </aside>
        </div>
      )}

      {openEvent && (
        <EventDrawer
          event={openEvent}
          communityName={communityNames[openEvent.community_id]}
          isMember
          onClose={() => setOpenEvent(null)}
          onRsvpChange={handleRsvpChange}
        />
      )}
    </>
  );
}
