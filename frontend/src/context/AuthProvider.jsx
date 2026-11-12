import { useCallback, useEffect, useMemo, useState } from "react";
import { api, SESSION_EXPIRED_EVENT } from "../api/client";
import { AuthContext } from "./AuthContext";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true until we know whether a session cookie is already present
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  // Restore an existing session on first load
  useEffect(() => {
    let cancelled = false;
    api
      .getMe()
      .then((me) => !cancelled && setUser(me))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Any API call that gets a 401 means the session is gone
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(
    async (email, password) => {
      await api.login(email, password);
      return refreshUser();
    },
    [refreshUser],
  );

  const register = useCallback(
    async (payload) => {
      await api.register(payload);
      // Backend does not log in on register, so sign in straight away
      return login(payload.email, payload.password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
