import { useState } from "react";
const cards = [
  {
    title: "Log Your Opportunity",
    text: "Forget messy spreadsheets. Add job roles manually with structured fields — company, title, source, deadline, and notes. HireLogix keeps it clean, fast, and focused so you never lose track of an opportunity.",
    pos: "left-0",
  },
  {
    title: "Track Your Progress",
    text: "Move applications through custom stages like “Saved,” “Applied,” “Interviewing,” and “Offer.” Visual cues and one-click updates make it easy to see where you stand — and what needs action.",
    pos: "left-[34%]",
  },
  {
    title: "Visualize Your Job Hunt",
    text: "See your entire job search at a glance. Monitor application volume, interview conversion, and follow-up timing. HireLogix turns raw data into career insight — no formulas required.",
    pos: "left-[68%]",
  },
];

export default function BodySection() {
  const [opened, setOpened] = useState(false);

  return (
    <section className="max-w-7xl mx-auto mt-20 md:mt-24 px-4 sm:px-6">
      {/* DESKTOP */}
      <div
        className="relative h-[420px] lg:h-[460px] hidden md:flex justify-center"
        onMouseEnter={() => setOpened(true)}
      >
        {cards.map((card, i) => (
          <div
            key={i}
            className={`
              absolute top-[120px]
              w-[300px] lg:w-[380px] md:w-[220px]
              h-[380px] lg:h-[430px] 
              bg-[var(--brand-soft)]
              text-white
              rounded-[40px]
              flex items-center justify-center
              transition-all duration-[1600ms]
              ease-[cubic-bezier(0.22,1,0.36,1)]
              ${opened ? `${card.pos} rotate-0` : "left-[38%] rotate-45"}
            `}
          >
            <div
              className={`
                p-6 lg:p-8 text-center
                transition-opacity duration-[800ms] delay-[600ms]
                ${opened ? "opacity-100" : "opacity-0"}
              `}
            >
              <h3 className="text-xl lg:text-2xl font-semibold mb-4">
                {card.title}
              </h3>
              <p className="opacity-80 text-sm lg:text-base">
                {card.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE */}
      <div className="md:hidden space-y-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-[var(--brand-soft)] text-white rounded-3xl p-6"
          >
            <h3 className="text-lg font-semibold mb-3">{card.title}</h3>
            <p className="opacity-80 text-sm">{card.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}