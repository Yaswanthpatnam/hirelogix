import axios from "axios";
import api from "../utils/api";


export async function getCurrentUser() {
  const response =
    await api.get(
      "/user/auth/me/"
    );

  return response.data;
}


export async function logoutUser() {
  const refreshToken =
    localStorage.getItem("refresh");

  const accessToken =
    localStorage.getItem("access");

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000";

  try {
    if (refreshToken || accessToken) {
      await axios.post(
        `${apiBaseUrl}/user/auth/logout/`,
        {
          refresh: refreshToken || "",
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : {}),
          },
          timeout: 5000,
        }
      );
    }
  } catch (err) {
    console.error("Logout request failed:", err);
  } finally {
    try {
      window.google?.accounts?.id?.disableAutoSelect?.();
    } catch (_) {}

    localStorage.clear();
    sessionStorage.clear();
    window.location.assign("/");
  }
}
