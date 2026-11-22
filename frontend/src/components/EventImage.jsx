import { toneFor } from "../utils/format";
import { eventImage, PLACEHOLDERS } from "../utils/media";
import FallbackImage from "./FallbackImage";
import "./EventImage.css";

// Event photo, or the placeholder on the community's tint. Sized by `className`.
export default function EventImage({ event, className = "" }) {
  return (
    <div className={`event-image tone-${toneFor(event.community_id)} ${className}`}>
      <FallbackImage src={eventImage(event)} fallback={PLACEHOLDERS.event} loading="lazy" />
    </div>
  );
}
