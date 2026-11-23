import { BASE_URL } from "../api/client";

// Everything the app assumes about images from the backend is in this file.
// - events take and return `image_url` (a link, until uploads are built)
// - users have no image field yet; assuming the same name, change it here if not

export const MAX_IMAGE_LINK = 250; // backend EventCreate.image_url

// Links people type in must be full http(s) addresses
export function isImageLink(value) {
  return /^https?:\/\/\S+$/i.test(value) && URL.canParse(value);
}

export const PLACEHOLDERS = {
  event: `${import.meta.env.BASE_URL}placeholders/event.svg`,
  profile: `${import.meta.env.BASE_URL}placeholders/profile.svg`,
};

// Full URLs are used as they are; paths on the backend ("/uploads/x.png" or
// "uploads/x.png") go through the API base. Anything else shows the placeholder.
export function mediaUrl(value) {
  const url = typeof value === "string" ? value.trim() : "";
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(url)) return null;
  return `${BASE_URL}/${url.replace(/^\//, "")}`;
}

export const eventImage = (event) => mediaUrl(event?.image_url);
export const profileImage = (user) => mediaUrl(user?.image_url);
