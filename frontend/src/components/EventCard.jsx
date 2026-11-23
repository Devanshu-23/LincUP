import { dateParts, formatRange, isPast, toneFor } from "../utils/format";
import EventImage from "./EventImage";
import Icon from "./Icon";
import "./EventCard.css";

const names = (events) =>
  events.length === 1 ? events[0].title : `${events[0].title} and ${events.length - 1} more`;

// Compact event row with a calendar-style date block and a thumbnail.
// Click opens the event details (RSVP + comments).
//
// `clashesWith` - your other plans at the same time (red: you're double-booked)
// `overlapsPlans` - for an event you haven't joined: plans it would clash with
export default function EventCard({
  event,
  communityName,
  going,
  clashesWith = [],
  overlapsPlans = [],
  onOpen,
}) {
  const { day, month } = dateParts(event.start_at);
  const past = isPast(event);
  const clash = clashesWith.length > 0;

  return (
    <button
      className={`event-card ${past ? "is-past" : ""} ${clash ? "is-clash" : ""}`}
      onClick={() => onOpen(event)}
    >
      <div className={`event-date tone-${toneFor(event.community_id)}`}>
        <span className="event-month">{month}</span>
        <span className="event-day">{day}</span>
      </div>

      <div className="event-body">
        <div className="event-tags">
          {communityName && <span className="event-community">{communityName}</span>}
          {going && <span className="chip chip-primary">✓ Going</span>}
          {past && <span className="chip">Ended</span>}
          {clash && (
            <span className="chip chip-danger chip-clash">
              <Icon name="alert" size={13} /> Clashes with {names(clashesWith)}
            </span>
          )}
          {!clash && overlapsPlans.length > 0 && (
            <span className="chip chip-warn chip-clash">
              <Icon name="clock" size={13} /> Same time as {names(overlapsPlans)}
            </span>
          )}
        </div>
        <h3>{event.title}</h3>
        <div className="event-meta">
          <span>
            <Icon name="clock" size={15} /> {formatRange(event.start_at, event.end_at)}
          </span>
          <span>
            <Icon name="pin" size={15} /> {event.location}
          </span>
        </div>
      </div>

      <EventImage event={event} className="event-thumb" />
    </button>
  );
}
