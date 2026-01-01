import { Link, useLocation, useNavigate } from "react-router-dom";

export default function DashboardNavbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="w-full flex justify-center mt-4 px-3">
      {/* OUTER CAPSULE */}
      <div
        className="
          w-full max-w-6xl
          flex items-center justify-between
          gap-3
          border border-black/60
          rounded-full
          bg-white
          px-3 py-2
          sm:px-5 sm:py-3
        "
      >
        {/* LEFT — LOGO */}
        <h1
          className="
            font-brand
            text-sm xs:text-base sm:text-lg md:text-xl
            whitespace-nowrap
          "
        >
          HireLogix
        </h1>

        {/* CENTER — DASHBOARD / TRACKER CAPSULE */}
        <div
          className="
            flex items-center
            bg-gray-100
            rounded-full
            p-1
            shrink-0
          "
        >
          <Link
            to="/dashboard"
            className={`
              px-3 py-1
              text-[11px] sm:text-xs md:text-sm
              rounded-full
              transition-all
              ${
                pathname === "/dashboard"
                  ? "bg-purple-600 text-white shadow"
                  : "text-gray-700 hover:text-purple-600"
              }
            `}
          >
            Dashboard
          </Link>

          <Link
            to="/tracker"
            className={`
              px-3 py-1
              text-[11px] sm:text-xs md:text-sm
              rounded-full
              transition-all
              ${
                pathname.startsWith("/tracker")
                  ? "bg-purple-600 text-white shadow"
                  : "text-gray-700 hover:text-purple-600"
              }
            `}
          >
            Tracker
          </Link>
        </div>

        {/* RIGHT — LOGOUT */}
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          className="
            px-3 py-1
            text-[11px] sm:text-xs md:text-sm
            rounded-full
            border border-red-500
            text-red-500
            hover:bg-red-50
            transition
            whitespace-nowrap
          "
        >
          Logout
        </button>
      </div>
    </nav>
  );
}