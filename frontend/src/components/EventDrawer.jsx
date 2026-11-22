import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import useApi from "../hooks/useApi";
import { formatFullDate, formatTime, isPast } from "../utils/format";
import Avatar from "./Avatar";
import CommentsSection from "./CommentsSection";
import Drawer from "./Drawer";
import Icon from "./Icon";

// Side panel (bottom sheet on mobile) with full event details,
// RSVP toggle + attendee list, and the comments thread.
//
// `isMember` - RSVPs and attendee lists are members-only on the backend.
// `onRsvpChange(eventId, going)` - lets the parent page update its lists.
export default function EventDrawer({ event, communityName, isMember, onClose, onRsvpChange }) {
  const { user } = useAuth();
  const [toggling, setToggling] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const rsvps = useApi(
    () => (isMember ? api.getEventRsvps(event.id) : Promise.resolve(null)),
    [event.id, isMember],
  );

  const attendees = rsvps.data || [];
  const going = attendees.some((a) => a.user_id === user?.id);
  const past = isPast(event);

  const toggleRsvp = async () => {
    setToggling(true);
    setRsvpError("");
    try {
      const res = await api.toggleRsvp(event.id);
      rsvps.reload();
      onRsvpChange?.(event.id, res.status === "going");
    } catch (err) {
      setRsvpError(err.message);
    } finally {
      setToggling(false);
    }
  };

  return (
    <Drawer
      title={event.title}
      communityId={event.community_id}
      communityName={communityName}
      onClose={onClose}
    >
      <ul className="drawer-facts">
        <li>
          <Icon name="calendar" size={18} />
          <div>
            <strong>{formatFullDate(event.start_at)}</strong>
            <span className="muted">
              {formatTime(event.start_at)} – {formatTime(event.end_at)}
              {formatFullDate(event.start_at) !== formatFullDate(event.end_at) &&
                ` (ends ${formatFullDate(event.end_at)})`}
            </span>
          </div>
        </li>
        <li>
          <Icon name="pin" size={18} />
          <div>
            <strong>{event.location}</strong>
            <span className="muted">Venue</span>
          </div>
        </li>
      </ul>

      <p className="drawer-description">{event.description}</p>

      <section className="rsvp-box">
        {isMember ? (
          <>
            <div className="rsvp-row">
              <div>
                <strong className="rsvp-count">{attendees.length}</strong>{" "}
                <span className="muted">
                  {attendees.length === 1 ? "person" : "people"} going
                </span>
              </div>
              {!past && (
                <button
                  className={`btn ${going ? "btn-outline" : "btn-accent"}`}
                  onClick={toggleRsvp}
                  disabled={toggling || rsvps.loading}
                >
                  {going ? (
                    <>
                      <Icon name="check" size={18} /> Going · Cancel
                    </>
                  ) : (
                    "I'm interested"
                  )}
                </button>
              )}
            </div>
            {attendees.length > 0 && (
              <div className="attendees">
                {attendees.slice(0, 8).map((a) => (
                  <Avatar key={a.user_id} name={a.full_name} id={a.user_id} size={30} />
                ))}
                {attendees.length > 8 && (
                  <span className="muted">+{attendees.length - 8} more</span>
                )}
              </div>
            )}
            {past && <p className="muted">This event has ended.</p>}
          </>
        ) : (
          <p className="muted">
            Join{" "}
            <Link to={`/communities/${event.community_id}`}>
              {communityName || "this community"}
            </Link>{" "}
            to RSVP and see who's going.
          </p>
        )}
        {rsvpError && <div className="alert alert-error">{rsvpError}</div>}
      </section>

      <CommentsSection target="event" id={event.id} />
    </Drawer>
  );
}
