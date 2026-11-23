import { useState } from "react";
import { isImageLink, MAX_IMAGE_LINK } from "../utils/media";
import "./ImageLinkField.css";

// Optional image URL with a preview. The preview loads when you leave the field,
// so half-typed addresses aren't requested.
export default function ImageLinkField({ id, value, onChange }) {
  const [preview, setPreview] = useState("");
  const [failed, setFailed] = useState(false);

  const showPreview = () => {
    const url = value.trim();
    const next = isImageLink(url) ? url : "";
    if (next === preview) return;
    setPreview(next);
    setFailed(false);
  };

  const showing = preview && preview === value.trim();

  return (
    <div className="field">
      <label htmlFor={id}>Image link (optional)</label>
      <input
        id={id}
        className="input"
        type="url"
        inputMode="url"
        placeholder="https://…/poster.jpg"
        maxLength={MAX_IMAGE_LINK}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={showPreview}
      />
      {showing && failed ? (
        <span className="image-link-error" role="status">
          That link didn't load as an image. The event will show the placeholder instead.
        </span>
      ) : showing ? (
        <img
          className="image-link-preview"
          src={preview}
          alt="Event image preview"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="field-hint">
          Use a direct link to a picture. Without one, a placeholder is shown.
        </span>
      )}
    </div>
  );
}
