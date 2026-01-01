
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="max-w-7xl mx-auto mt-6 px-3 sm:px-4">
      <div
        className="
          flex items-center justify-between
          border border-black/60 rounded-full
          px-4 py-3
          sm:px-6 sm:py-3
          md:px-8 md:py-4
          gap-3
        "
      >
        {/* LOGO */}
        <h1
          className="
            font-brand
            text-xl
            sm:text-2xl
            md:text-3xl
            text-[var(--brand)]
            whitespace-nowrap
          "
        >
          HireLogix
        </h1>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <Link
            to="/login"
            className="
              px-3 py-1.5
              sm:px-4 sm:py-2
              md:px-6 md:py-2
              text-xs sm:text-sm md:text-base
              border border-black
              rounded-full
              hover:scale-105
              transition
              whitespace-nowrap
            "
          >
            Log In
          </Link>

          <Link
            to="/register"
            className="
              px-3 py-1.5
              sm:px-4 sm:py-2
              md:px-6 md:py-2
              text-xs sm:text-sm md:text-base
              bg-[var(--brand-soft)]
              text-white
              rounded-full
              hover:scale-105
              transition
              whitespace-nowrap
            "
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}