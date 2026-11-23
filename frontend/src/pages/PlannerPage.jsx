import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import EmptyState from "../components/EmptyState";
import EventCard from "../components/EventCard";
import EventDrawer from "../components/EventDrawer";
import Icon from "../components/Icon";
import Spinner from "../components/Spinner";
import useApi from "../hooks/useApi";
import { formatDay, isPast } from "../utils/format";
import { canManageEvents } from "../utils/roles";
import { clashPartners, dayLabel, findConflicts, groupByDay } from "../utils/schedule";
import "./PlannerPage.css";

// FullCalendar is big, so it is only downloaded when the planner needs it
const PlannerCalendar = lazy(() => import("../components/PlannerCalendar"));

// The backend's /me/events has no community names, so fetch the
// community list too and join them on the client.
const loadPlanner = () =>
  Promise.all([api.getMyEvents(), api.listCommunities(), api.getMyCommunities()]).then(
    ([events, communities, mine]) => ({
      events,
      communityNames: Object.fromEntries(communities.map((c) => [c.id, c.name])),
      roles: new Map(mine.map((c) => [c.id, c.role])),
    }),
  );

export default function PlannerPage() {
  const { data, loading, error, setData } = useApi(loadPlanner);
  const [tab, setTab] = useState("calendar");
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [view, setView] = useState("upcoming");
  const [openEvent, setOpenEvent] = useState(null);

  const { upcoming, past, conflicts, partners } = useMemo(() => {
    const events = data?.events || [];
    const upcoming = events.filter((e) => !isPast(e));
    return {
      upcoming,
      past: events.filter(isPast),
      conflicts: findConflicts(upcoming),
      partners: clashPartners(upcoming),
    };
  }, [data]);

  if (loading) return <Spinner label="Loading your planner…" />;
  if (error) return <div className="alert alert-error">{error.message}</div>;

  const shown = view === "upcoming" ? upcoming : past;
  // newest first for past events, soonest first for upcoming
  const groups = view === "upcoming" ? groupByDay(shown) : groupByDay(shown).reverse();
  const nextEvent = groups[0]?.events[0];

  // Cancelling from the drawer removes the event; tapping interested again restores it
  const handleRsvpChange = (eventId, going) => {
    setData((d) => {
      const others = d.events.filter((e) => e.id !== eventId);
      return { ...d, events: going && openEvent ? [...others, openEvent] : others };
    });
  };

  const handleEventDeleted = (eventId) => {
    setData((d) => ({ ...d, events: d.events.filter((e) => e.id !== eventId) }));
  };

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Your schedule</p>
          <h1>Planner</h1>
          <p className="muted">Everything you've said you're interested in.</p>
        </div>
      </div>

      <div className="segmented planner-tabs" role="tablist">
        <button
          id="planner-tab-calendar"
          role="tab"
          aria-selected={tab === "calendar"}
          className={tab === "calendar" ? "active" : ""}
          onClick={() => setTab("calendar")}
        >
          <Icon name="calendar" size={17} /> Calendar
        </button>
        <button
          id="planner-tab-list"
          role="tab"
          aria-selected={tab === "list"}
          className={tab === "list" ? "active" : ""}
          onClick={() => setTab("list")}
        >
          <Icon name="clock" size={17} /> All events <span>{data.events.length}</span>
        </button>
      </div>

      {tab === "calendar" ? (
        <div role="tabpanel" aria-labelledby="planner-tab-calendar">
          <Suspense fallback={<Spinner label="Loading calendar…" />}>
            <PlannerCalendar
              events={data.events}
              communityNames={data.communityNames}
              conflicts={conflicts}
              partners={partners}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onOpen={setOpenEvent}
            />
          </Suspense>
        </div>
      ) : (
        <div role="tabpanel" aria-labelledby="planner-tab-list">
          <div className="segmented planner-filter" role="group" aria-label="Filter events">
            <button
              aria-pressed={view === "upcoming"}
              className={view === "upcoming" ? "active" : ""}
              onClick={() => setView("upcoming")}
            >
              Upcoming <span>{upcoming.length}</span>
            </button>
            <button
              aria-pressed={view === "past"}
              className={view === "past" ? "active" : ""}
              onClick={() => setView("past")}
            >
              Past <span>{past.length}</span>
            </button>
          </div>

          {view === "upcoming" && upcoming.length > 0 && (
            <div className="planner-summary">
              <div className="summary-tile">
                <span className="summary-number">{upcoming.length}</span>
                <span className="muted">upcoming {upcoming.length === 1 ? "plan" : "plans"}</span>
              </div>
              <div className="summary-tile">
                <span className="summary-label">Next up</span>
                <strong>{nextEvent.title}</strong>
                <span className="muted">{formatDay(nextEvent.start_at)}</span>
              </div>
              <div className={`summary-tile ${conflicts.size ? "has-clash" : ""}`}>
                <span className="summary-number">{conflicts.size}</span>
                <span className="muted">
                  {conflicts.size ? "events clash, check your timings" : "clashes, you're all set"}
                </span>
              </div>
            </div>
          )}

          {shown.length === 0 ? (
            view === "upcoming" ? (
              <EmptyState
                emoji="🗓️"
                title="Your planner is empty"
                action={
                  <Link to="/communities" className="btn btn-primary">
                    Explore communities
                  </Link>
                }
              >
                Open an event and tap "I'm interested". It will appear here.
              </EmptyState>
            ) : (
              <EmptyState emoji="🕰️" title="No past events yet" />
            )
          ) : (
            <ol className="timeline">
              {groups.map((g) => (
                <li key={g.key} className="timeline-day">
                  <div className="timeline-label">
                    <span className="timeline-dot" aria-hidden="true" />
                    <strong>{dayLabel(g.date) || formatDay(g.date)}</strong>
                    {dayLabel(g.date) && <span className="muted">{formatDay(g.date)}</span>}
                  </div>
                  <div className="event-list">
                    {g.events.map((ev) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        communityName={data.communityNames[ev.community_id]}
                        clashesWith={view === "upcoming" ? partners.get(ev.id) : undefined}
                        onOpen={setOpenEvent}
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {openEvent && (
        <EventDrawer
          event={openEvent}
          communityName={data.communityNames[openEvent.community_id]}
          isMember={data.roles.has(openEvent.community_id)}
          canManage={canManageEvents(data.roles.get(openEvent.community_id))}
          onClose={() => setOpenEvent(null)}
          onRsvpChange={handleRsvpChange}
          onDeleted={handleEventDeleted}
        />
      )}
    </>
  );
}
