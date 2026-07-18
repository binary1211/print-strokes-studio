import type { AuthResponse, User } from "@/types";

const KEYS = {
  access: "customerAccessToken",
  refresh: "customerRefreshToken",
  session: "customerSessionId",
  user: "customerUser",
} as const;

const mapUser = (user: AuthResponse["user"]): User => ({
  id: String(user.id),
  name: user.name,
  email: user.email,
  phone: user.phone,
  roles: user.roles,
});

export const customerTokenStorage = {
  getAccessToken: () => sessionStorage.getItem(KEYS.access) ?? localStorage.getItem(KEYS.access),
  getRefreshToken: () => localStorage.getItem(KEYS.refresh),
  getSessionId: () => localStorage.getItem(KEYS.session),
  getUser: (): User | null => {
    const raw = localStorage.getItem(KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(KEYS.user);
      return null;
    }
  },
  setAuth: (auth: AuthResponse) => {
    sessionStorage.setItem(KEYS.access, auth.accessToken);
    localStorage.removeItem(KEYS.access);
    localStorage.setItem(KEYS.refresh, auth.refreshToken);
    if (auth.sessionId) localStorage.setItem(KEYS.session, auth.sessionId);
    localStorage.setItem(KEYS.user, JSON.stringify(mapUser(auth.user)));
  },
  setUser: (user: User) => localStorage.setItem(KEYS.user, JSON.stringify(user)),
  clear: () => {
    sessionStorage.removeItem(KEYS.access);
    localStorage.removeItem(KEYS.access);
    localStorage.removeItem(KEYS.refresh);
    localStorage.removeItem(KEYS.session);
    localStorage.removeItem(KEYS.user);
  },
};

export { mapUser };
