"use client";
import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const experience = [
  {
    role: "Software Engineer",
    company: "OneAuris",
    location: "New York, NY",
    period: "May 2026 – Present",
    current: true,
    logo: "/logos/oneauris.png",
    logoFit: "contain" as const,
    logoPadding: "5px",
    logoBg: "#fff",
    bullets: [
      "Built and shipped a production multi-tenant, HIPAA-compliant AI legal-document-review platform for law firms, ingesting medical-legal records up to 3,500+ pages — Next.js, TypeScript, AWS Bedrock (Claude), Aurora PostgreSQL, and Cloudflare R2, deployed on ECS with blue/green CodeDeploy.",
      "Engineered an AI ingestion pipeline that OCRs scanned and handwritten records, auto-classifies documents, and extracts structured medical fields — diagnoses, injuries, and treatment timelines — via a multi-tier Claude (Sonnet → Opus) dispatcher, cutting attorney review from hours to minutes.",
    ],
  },
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
    logoFit: "contain" as const,
    logoPadding: "2px",
    logoBg: "#fff",
    logoPosition: "-5px -5px",
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
  const [open, setOpen] = useState(false);

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
        <div style={{ width: "48px", height: "48px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)", background: item.logoBg ?? "#111" }}>
          <Image
            src={item.logo}
            alt={item.company}
            width={48}
            height={48}
            style={{ objectFit: item.logoFit ?? "cover", width: "100%", height: "100%", padding: item.logoPadding ?? "0", objectPosition: (item as any).logoPosition ?? "center" }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {/* Clickable header */}
        <div
          onClick={() => setOpen((o) => !o)}
          role="button"
          aria-expanded={open}
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--fg)" }}>{item.role}</span>
              {item.current && (
                <span style={{ position: "relative", display: "inline-flex", width: "10px", height: "10px" }}>
                  <span className="animate-ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#22c55e", opacity: 0.6 }} />
                  <span style={{ position: "relative", display: "inline-flex", width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
                </span>
              )}
            </div>
            <ChevronDown
              size={16}
              style={{ color: "var(--muted)", flexShrink: 0, transition: "transform 0.3s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--muted)", flexWrap: "wrap" }}>
            <span>{item.company}</span>
            <span>·</span>
            <span>{item.location}</span>
            <span>·</span>
            <span>{item.period}</span>
          </div>
        </div>

        {/* Collapsible bullets */}
        <div
          style={{
            overflow: "hidden",
            maxHeight: open ? "500px" : "0px",
            opacity: open ? 1 : 0,
            marginTop: open ? "12px" : "0px",
            transition: "max-height 0.4s ease, opacity 0.3s ease, margin-top 0.3s ease",
          }}
        >
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
    </div>
  );
}

export default function Experience() {
  const { ref, visible } = useInView();

  return (
    <section id="experience" style={{ paddingBottom: "64px" }}>
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)" }}>01</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", letterSpacing: "0.04em", color: "var(--fg)" }}>Experience</span>
          <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
        {experience.map((item, i) => (
          <ExperienceItem key={i} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
