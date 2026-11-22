import { useState } from "react";
import { initials, toneFor } from "../utils/format";
import "./Avatar.css";

// Photo when there is one. Otherwise `placeholder` if given, else initials.
export default function Avatar({ name, id, size = 36, src, placeholder }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const photo = src && src !== failedSrc ? src : null;
  const image = photo || placeholder;

  return (
    <span
      className={`avatar tone-${toneFor(id ?? name)}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          referrerPolicy="no-referrer"
          onError={photo ? () => setFailedSrc(photo) : undefined}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
