// Membership roles from the backend: "owner", "convener" or "member".

// Same rule as verify_community_privilege() in backend/main.py
export const canManageEvents = (role) => role === "owner" || role === "convener";

export function leaveWarning(name, role) {
  const lostRole = role === "convener" ? " You will also stop being a convener." : "";
  return `Leave ${name}? Your RSVPs for its events will be cancelled.${lostRole}`;
}
