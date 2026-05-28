"use client";
import Image from "next/image";
import { useInView } from "@/hooks/useInView";

const experience = [
  {
    role: "Software Engineer Intern",
    company: "University at Buffalo",
    location: "Buffalo, NY",
    period: "Jan 2026 – Present",
    current: true,
    logo: "/logos/ub.jpeg",
    bullets: [
      "Maintaining and scaling an academic TraceTool for CSE 115/116, supporting 500+ students annually and 5,000+ submissions per semester.",
      "Supporting scalability efforts targeting higher concurrency and peak submission reliability across multi-institution deployment.",
      "Improving correctness and consistency of tracing behavior by validating memory modeling with course staff.",
    ],
  },
  {
    role: "Co-Founder",
    company: "Rally",
    location: "Remote",
    period: "Dec 2025 – Present",
    current: true,
    logo: "/logos/rally.png",
    logoScale: 1.4,
    bullets: [
      "Building a full-stack iOS app with SwiftUI and a Go/Gin REST API, integrating live match stat tracking, AI-powered post-game recaps via OpenAI, and phone OTP authentication via Twilio — deployed on AWS ECS with Terraform.",
      "Engineered location-based match discovery using haversine distance queries in PostgreSQL and built a social system with friends, teams, and roster management across 60+ screens.",
    ],
  },
  {
    role: "Software Engineer Teaching Intern",
    company: "Lavner Education",
    location: "Garden City, NY",
    period: "Jun 2025 – Aug 2025",
    current: false,
    logo: "/logos/lavner.jpeg",
    bullets: [
      "Delivered 20+ workshops across Python, Scratch, Java, C++, AI, game design, and robotics.",
      "Mentored 15–20 students per group through 100+ hands-on coding projects, strengthening debugging and problem-solving skills.",
    ],
  },
];

function ExperienceItem({ item, index }: { item: (typeof experience)[0]; index: number }) {
  const { ref, visible } = useInView();

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease ${index * 120}ms, transform 0.6s ease ${index * 120}ms`,
        display: "flex",
        gap: "16px",
      }}
    >
      {/* Logo */}
      <div style={{ flexShrink: 0, paddingTop: "2px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)", background: "#111" }}>
          <Image
            src={item.logo}
            alt={item.company}
            width={48}
            height={48}
            style={{ objectFit: "cover", width: "100%", height: "100%", transform: `scale(${item.logoScale ?? 1})` }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--fg)" }}>{item.role}</span>
          {item.current && (
            <span style={{ position: "relative", display: "inline-flex", width: "10px", height: "10px" }}>
              <span className="animate-ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e", opacity: 0.6 }} />
              <span style={{ position: "relative", display: "inline-flex", width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--muted)", marginBottom: "10px", flexWrap: "wrap" }}>
          <span>{item.company}</span>
          <span>·</span>
          <span>{item.location}</span>
          <span>·</span>
          <span>{item.period}</span>
        </div>
        <ul style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {item.bullets.map((b, i) => (
            <li key={i} style={{ display: "flex", gap: "10px", fontSize: "13px", lineHeight: 1.65, color: "var(--muted)" }}>
              <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: "1px" }}>—</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Experience() {
  const { ref, visible } = useInView();

  return (
    <section id="experience" style={{ paddingBottom: "64px" }}>
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease", marginBottom: "28px" }}>
        <p style={{ fontSize: "13px", fontFamily: "monospace", color: "var(--accent)" }}>Experience</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        {experience.map((item, i) => (
          <ExperienceItem key={i} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
