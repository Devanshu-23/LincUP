import { useState } from "react";

// <img> that shows `fallback` when `src` is empty or fails to load.
export default function FallbackImage({ src, fallback, alt = "", ...rest }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showReal = Boolean(src) && src !== failedSrc;

  return (
    <img
      src={showReal ? src : fallback}
      alt={alt}
      decoding="async"
      referrerPolicy="no-referrer" // image links can point to any site
      onError={showReal ? () => setFailedSrc(src) : undefined}
      {...rest}
    />
  );
}
