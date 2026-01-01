import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constant";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem(ACCESS_TOKEN);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const { exp } = jwtDecode(token);
    const now = Date.now() / 1000;

    if (exp < now) {
      localStorage.removeItem(ACCESS_TOKEN);
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch {
    localStorage.removeItem(ACCESS_TOKEN);
    return <Navigate to="/login" replace />;
  }
}
