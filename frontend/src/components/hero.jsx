import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const [phase, setPhase] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 2800),
      setTimeout(() => setPhase(3), 4800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="mt-20 sm:mt-24 relative overflow-hidden">
      {/* Expanding background */}
      <div
        className={`
          absolute inset-x-0 top-0
          bg-[var(--brand)]
          transition-all duration-[2200ms]
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${phase >= 2 ? "h-full" : "h-0"}
        `}
      />

      <div className="relative max-w-5xl mx-auto py-24 sm:py-32 px-4 text-center">
        <h1
          className={`
            font-brand-title 
            transition-all duration-[2200ms]
            ease-[cubic-bezier(0.22,1,0.36,1)]
            ${
              phase === 0
                ? "text-[4rem] sm:text-[6rem] md:text-[10rem] text-black"
                : "text-2xl sm:text-4xl md:text-6xl text-white"
            }
          `}
        >
          {phase === 0 ? "BEGIN" : "Begin Your Career Journey with Precision"}
        </h1>

        <div
          className={`
            transition-all duration-[1400ms] delay-[400ms]
            ${phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
        >
          <p className="mt-6 text-sm sm:text-base md:text-lg text-white/80 max-w-3xl mx-auto">
            HireLogix replaces scattered spreadsheets with a single,
            purpose-built tracker — then turns data into clarity.
          </p>

          <button
            onClick={() => navigate("/register")}
            className="
              mt-8 sm:mt-10
              px-8 sm:px-10
              py-4 sm:py-5
              bg-white
              text-[var(--brand)]
              rounded-full
              hover:scale-105
              transition
            "
          >
            Sign up for free
          </button>
        </div>
      </div>
    </section>
  );
}