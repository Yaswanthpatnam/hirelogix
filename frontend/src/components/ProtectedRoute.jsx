import {
  Navigate,
  useLocation,
} from "react-router-dom";


export default function ProtectedRoute({
  children,
}) {
  const location =
    useLocation();

  const accessToken =
    localStorage.getItem("access");

  if (!accessToken) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}
