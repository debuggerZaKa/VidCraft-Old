import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe, loginRequest, registerRequest } from "../api/authApi";
import { clearSession, getStoredToken, getStoredUser, persistSession } from "./session";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [booting, setBooting] = useState(Boolean(getStoredToken()));
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (!token) {
        setBooting(false);
        return;
      }
      try {
        const data = await fetchMe(token);
        if (cancelled) return;
        setUser(data.user);
        persistSession(token, data.user);
      } catch {
        if (cancelled) return;
        clearSession();
        setToken("");
        setUser(null);
      } finally {
        if (!cancelled) setBooting(false);
      }
    };
    boot();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async ({ email, password }) => {
    setAuthError("");
    const data = await loginRequest({ email, password });
    persistSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    setAuthError("");
    const data = await registerRequest({ name, email, password });
    persistSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken("");
    setUser(null);
    setAuthError("");
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      booting,
      authError,
      setAuthError,
      login,
      register,
      logout,
    }),
    [token, user, booting, authError, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
