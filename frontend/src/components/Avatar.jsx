import { initials, toneFor } from "../utils/format";
import "./Avatar.css";

export default function Avatar({ name, id, size = 36 }) {
  return (
    <span
      className={`avatar tone-${toneFor(id ?? name)}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
