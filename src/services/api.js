import axios from "axios";
// Cirkularni import: AuthService.js → api.js → AuthService.js. Radi jer se
// clearAuthState i getIsLoggingOut koriste SAMO unutar interceptor funkcija,
// koje se izvršavaju tek posle što su svi moduli završili load (live bindings).
import { clearAuthState, getIsLoggingOut } from "./AuthService.js";

function resolveApiBaseUrl() {
  const runtimeBaseUrl = window.__APP_CONFIG__?.API_BASE_URL;
  if (typeof runtimeBaseUrl === "string" && runtimeBaseUrl.trim() !== "") {
    return runtimeBaseUrl.trim().replace(/\/+$/, "");
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/+$/, "");
  }

  return "/api";
}

const baseURL = resolveApiBaseUrl();

const api = axios.create({ baseURL });

// Auth podaci se čuvaju u sessionStorage (ne localStorage) kako bi svaki tab
// imao izolovanu sesiju — sprečava koliziju kada su Admin i Klijent otvoreni u
// različitim tabovima istog brauzera (#161).
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh queue — backend koristi rotating refresh tokene (single-use).
// Bez ovoga, paralelni 401 odgovori (npr. AccountDetailsPage šalje 3 zahteva
// istovremeno) bi svi pokušali refresh sa istim tokenom. Drugi pokušaj bi
// izazvao "token mismatch: possible reuse attack" i revokaciju svih tokena.
let refreshPromise = null;

function doRefresh() {
  if (refreshPromise) return refreshPromise;

  const storedRefresh = sessionStorage.getItem("refreshToken");
  if (!storedRefresh) {
    return Promise.reject(new Error("no refresh token"));
  }

  refreshPromise = api
    .post("/token/refresh", { refresh_token: storedRefresh })
    .then(({ data }) => {
      if (getIsLoggingOut()) throw new Error("logout in progress");
      const newAccess = data.access_token || data.accessToken;
      const newRefresh = data.refresh_token || data.refreshToken;
      sessionStorage.setItem("accessToken", newAccess);
      sessionStorage.setItem("refreshToken", newRefresh);
      return newAccess;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/login") &&
      !originalRequest.url.includes("/token/refresh")
    ) {
      originalRequest._retry = true;

      // Ako je logout u toku, ne pokušavaj refresh — in-flight request bi
      // inače upisao nove tokene u sessionStorage POSLE čišćenja (M1).
      if (getIsLoggingOut()) {
        return Promise.reject(error);
      }

      try {
        const newAccess = await doRefresh();
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch {
        clearAuthState();
        sessionStorage.setItem("sessionExpired", "1");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
