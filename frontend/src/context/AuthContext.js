import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

// Access { user, loading, login, register, logout, refreshUser } anywhere.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
