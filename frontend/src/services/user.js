import axios from "axios";
import api from "../utils/api";


export async function getCurrentUser() {
  const response =
    await api.get(
      "/user/auth/me/"
    );

  return response.data;
}


export function logoutUser() {
  const refreshToken = localStorage.getItem("refresh");
  const accessToken = localStorage.getItem("access");
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  // 1. Immediately disable Google auto-select
  try {
    window.google?.accounts?.id?.disableAutoSelect?.();
  } catch (_) {}

  // 2. Fire-and-forget token revocation in background using keepalive
  if (refreshToken || accessToken) {
    try {
      fetch(`${apiBaseUrl}/user/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          refresh: refreshToken || "",
        }),
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  }

  // 3. Immediately clear local storage and redirect without blocking UI
  localStorage.clear();
  sessionStorage.clear();
  window.location.assign("/");
}
