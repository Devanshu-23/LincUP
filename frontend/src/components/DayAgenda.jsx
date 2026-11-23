import { Link } from "react-router-dom";
import { formatDay, isPast, toDate } from "../utils/format";
import { byStart, dayLabel, eventsOnDay } from "../utils/schedule";
import EventCard from "./EventCard";

// Details of the events on the day picked in the calendar.
export default function DayAgenda({ day, events, communityNames, partners, onOpen, onJump }) {
  const onDay = eventsOnDay(events, day);
  const next = events.filter((e) => !isPast(e)).sort(byStart)[0];
  const label = dayLabel(day);

  return (
    <section className="day-agenda" aria-live="polite">
      <div className="day-agenda-head">
        <p className="eyebrow">{label || "Selected day"}</p>
        <h2>{formatDay(day)}</h2>
      </div>

      {onDay.length > 0 ? (
        <div className="event-list">
          {onDay.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              communityName={communityNames[event.community_id]}
              clashesWith={partners.get(event.id)}
              onOpen={onOpen}
            />
          ))}
        </div>
      ) : (
        <div className="day-agenda-empty">
          <p className="muted">
            {events.length > 0
              ? "Nothing planned for this day."
              : 'Open an event and tap "I\'m interested". It will appear on your calendar.'}
          </p>
          {next ? (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onJump(toDate(next.start_at))}
            >
              Go to your next plan
            </button>
          ) : (
            <Link to="/communities" className="btn btn-primary btn-sm">
              Explore communities
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
