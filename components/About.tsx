"use client";
import { useInView } from "@/hooks/useInView";

export default function About() {
  const { ref, visible } = useInView();

  return (
    <section id="about" style={{ padding: "96px 24px" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <div
          ref={ref}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <p style={{ fontSize: "13px", fontFamily: "monospace", color: "var(--accent)", marginBottom: "20px" }}>
            About
          </p>
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 19px)",
              lineHeight: 1.8,
              color: "var(--fg)",
              maxWidth: "620px",
              marginBottom: "16px",
            }}
          >
            I&apos;m a junior CS student at UB who builds AI-powered systems and full-stack products — the kind
            that solve real problems and handle real scale. I care about clean engineering, fast feedback loops,
            and shipping work I&apos;m proud of.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "var(--muted)", maxWidth: "580px" }}>
            Outside of code, I&apos;m co-founding Rally, directing growth at UB Forge, and competing in data
            challenges. I like building in public, learning fast, and working with people who give a damn.
          </p>
        </div>
      </div>
    </section>
  );
}
