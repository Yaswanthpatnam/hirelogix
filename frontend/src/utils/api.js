import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constant";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem(REFRESH_TOKEN);
      if (!refresh) {
        clearAuth();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          "https://hirelogix.onrender.com/api/token/refresh/",
          { refresh }
        );

        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        originalRequest.headers.Authorization =
          `Bearer ${res.data.access}`;

        return api(originalRequest);
      } catch {
        clearAuth();
      }
    }

    return Promise.reject(error);
  }
);

function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
}

export default api;
