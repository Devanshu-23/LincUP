// Thin wrapper around fetch for the LincUP FastAPI backend.
// All requests go to /api/* which Vite proxies to the backend (see vite.config.js).
// Authentication is a httpOnly cookie set by POST /login, so we only need
// `credentials: "include"` - the token itself is never visible to JS.

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// FastAPI returns `detail` either as a string or (for 422 validation errors)
// as a list of { loc, msg } objects. Turn both into one readable message.
function readErrorDetail(detail) {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        const msg = (d.msg || "").replace(/^Value error, /, "");
        return field && field !== "body" ? `${field}: ${msg}` : msg;
      })
      .join(" · ");
  }
  return String(detail);
}

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the LincUP server. Is the backend running?", 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      readErrorDetail(data?.detail) || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }
  return data;
}

export const api = {
  // ----- Auth -----
  register: (payload) => request("/register", { method: "POST", body: payload }),
  login: (email, password) =>
    request("/login", { method: "POST", body: { email, password } }),
  logout: () => request("/logout", { method: "POST" }),
  sessionCheck: () => request("/session-check"),

  // ----- Profile -----
  getMe: () => request("/me"),
  updateMe: (payload) => request("/me", { method: "PUT", body: payload }),
  getUser: (userId) => request(`/users/${userId}`),
  getMyCommunities: () => request("/me/communities"),
  getMyEvents: () => request("/me/events"),

  // ----- Communities -----
  listCommunities: () => request("/communities"),
  getCommunity: (id) => request(`/communities/${id}`),
  createCommunity: (payload) =>
    request("/communities", { method: "POST", body: payload }),
  joinCommunity: (id) => request(`/communities/${id}/join`, { method: "POST" }),
  leaveCommunity: (id) =>
    request(`/communities/${id}/leave`, { method: "DELETE" }),
  getCommunityMembers: (id) => request(`/communities/${id}/members`),

  // ----- Events -----
  listCommunityEvents: (id) => request(`/communities/${id}/events`),
  createEvent: (communityId, payload) =>
    request(`/communities/${communityId}/events`, {
      method: "POST",
      body: payload,
    }),
  toggleRsvp: (eventId) => request(`/events/${eventId}/rsvp`, { method: "POST" }),
  getEventRsvps: (eventId) => request(`/events/${eventId}/rsvps`),

  // ----- Comments -----
  getEventComments: (eventId) => request(`/events/${eventId}/comments`),
  addEventComment: (eventId, content) =>
    request(`/events/${eventId}/comment`, {
      method: "POST",
      body: { content },
    }),
};
