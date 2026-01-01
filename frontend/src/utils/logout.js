import api from "./api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constant";

export async function logoutUser() {
  try {
    const refresh = localStorage.getItem(REFRESH_TOKEN);
    if (refresh) {
      await api.post("/user/logout/", { refresh });
    }
  } catch {
    // ignore
  } finally {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    window.location.replace("/");
  }
}