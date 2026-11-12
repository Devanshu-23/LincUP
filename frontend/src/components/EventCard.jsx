import { dateParts, formatRange, isPast, toneFor } from "../utils/format";
import Icon from "./Icon";
import "./EventCard.css";

// Compact event row with a calendar-style date block.
// Click opens the event details (RSVP + comments).
export default function EventCard({ event, communityName, going, conflict, onOpen }) {
  const { day, month } = dateParts(event.start_at);
  const past = isPast(event);

  return (
    <button
      className={`event-card ${past ? "is-past" : ""}`}
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
          {conflict && (
            <span className="chip chip-accent" title="Overlaps with another event you're going to">
              <Icon name="alert" size={13} /> Clash
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
    </button>
  );
}
