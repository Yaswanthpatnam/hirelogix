
import { useEffect, useRef, useState } from "react";

export default function About() {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setShow(true),
      { threshold: 0.4 }
    );
    obs.observe(ref.current);
  }, []);

  return (
    <section ref={ref} className="max-w-5xl mx-auto mt-70 md:mt-50 px-12">
      <h2 className="text-4xl md:text-2xl font-semibold mb-8">
        Why HireLogix Isn’t Just Another Tracker?
      </h2>

      <div
        className={`space-y-6 transition-all duration-[1200ms]
          ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        `}
      >
        <p>HireLogix isn’t a bloated CRM or a repurposed template. It’s designed from the ground up for one thing: tracking job applications with precision and ease.</p>
        <p>You enter the data — job role, company, status — and HireLogix turns it into actionable insights. No automation overload. Just clean, intentional tracking.</p>
        <p>Our dashboard doesn’t just show numbers — it tells a story. See where you’re gaining traction, where follow-ups are due, and how your job search is evolving.</p>
        <p>Whether you're applying to 5 roles or 50, HireLogix helps you stay organized, focused, and ready to act — without the clutter or confusion of traditional tools.</p>
      </div>
    </section>
  );
}
