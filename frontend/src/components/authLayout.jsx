import { Link } from "react-router-dom";

export default function AuthLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo */}
      <header className="px-6 py-6">
        <Link
          to="/"
          className="font-brand text-xxl md:text-3xl  text-[var(--brand)]"
        >
          HireLogix
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl md:text-[45px] font-bold tracking-wide mb-10">
            {title}
          </h1>

          {children}
        </div>
      </main>
    </div>
  );
}
