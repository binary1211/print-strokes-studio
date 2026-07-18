import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { customerTokenStorage } from "@/lib/auth/tokenStorage";
import type { ApiResponse, AuthResponse } from "@/types";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const AUTH_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/signup",
  "/api/v1/auth/refresh-token",
];

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25_000,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = customerTokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue: Array<{ resolve: (token: string) => void; reject: (error?: unknown) => void }> = [];

const flushQueue = (token?: string, error?: unknown) => {
  queue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error ?? new Error("Session refresh failed"));
  });
  queue = [];
};

const isAuthRequest = (url?: string) => AUTH_PATHS.some((path) => url?.includes(path));

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original || error.response?.status !== 401 || original._retry || isAuthRequest(original.url)) {
      return Promise.reject(error);
    }

    const refreshToken = customerTokenStorage.getRefreshToken();
    if (!refreshToken) {
      customerTokenStorage.clear();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => queue.push({ resolve, reject }))
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post<ApiResponse<AuthResponse>>(
        `${API_BASE_URL}/api/v1/auth/refresh-token`,
        {
          refreshToken,
          sessionId: customerTokenStorage.getSessionId(),
        },
        { timeout: 25_000, headers: { Accept: "application/json", "Content-Type": "application/json" } },
      );
      const auth = response.data.data;
      if (!response.data.success || !auth?.accessToken || !auth.refreshToken) {
        throw new Error(response.data.message || "Session refresh failed");
      }
      customerTokenStorage.setAuth(auth);
      original.headers.Authorization = `Bearer ${auth.accessToken}`;
      flushQueue(auth.accessToken);
      return apiClient(original);
    } catch (refreshError) {
      customerTokenStorage.clear();
      flushQueue(undefined, refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string; errors?: Array<{ defaultMessage?: string; message?: string }> } | undefined;
    return data?.message || data?.error || data?.errors?.map((item) => item.message || item.defaultMessage).filter(Boolean).join(", ") || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};
