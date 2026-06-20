import { createContext, useEffect, useMemo, useState } from "react";

import { apiRequest } from "../lib/api";
import { disconnectInterviewSocket } from "../lib/interviewSocket";

const TOKEN_STORAGE_KEY = "collab-auth-token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, token);

    if (user) {
      return;
    }

    apiRequest("/api/auth/me", { token })
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, [token, user]);

  const value = useMemo(() => {
    return {
      token,
      user,
      authLoading,
      isAuthenticated: Boolean(token && user),
      async login(credentials) {
        disconnectInterviewSocket();

        const data = await apiRequest("/api/auth/login", {
          method: "POST",
          body: credentials,
        });

        setToken(data.token);
        setUser(data.user);
        setAuthLoading(false);
        return data.user;
      },
      async signup(credentials) {
        disconnectInterviewSocket();

        const data = await apiRequest("/api/auth/signup", {
          method: "POST",
          body: credentials,
        });

        setToken(data.token);
        setUser(data.user);
        setAuthLoading(false);
        return data.user;
      },
      logout() {
        setToken(null);
        setUser(null);
        setAuthLoading(false);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        disconnectInterviewSocket();
      },
    };
  }, [authLoading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
