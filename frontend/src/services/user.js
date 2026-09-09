import api from "../utils/api";


export async function getCurrentUser() {
  const response =
    await api.get(
      "/user/auth/me/"
    );

  return response.data;
}
