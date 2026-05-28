"use client";
import { Trophy, Users } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const extras = [
  {
    org: "UB Forge",
    role: "Director of Growth & Community",
    period: "Apr 2025 – Present",
    Icon: Users,
    description: "Building a startup-like culture at UB, connecting developers, designers, and founders. Leading weekly showcases and growing the community.",
  },
  {
    org: "UB Data Analytics Club",
    role: "Member · 1st Place, Data Analytics Competition",
    period: "Jan 2025 – Present",
    Icon: Trophy,
    description: "Won 1st out of 16 teams (80+ students). Analyzed 20,000+ songs to surface trends between song attributes and viewer engagement.",
  },
];

function ExtraCard({ item, index }: { item: (typeof extras)[0]; index: number }) {
  const { ref, visible } = useInView();
  const { Icon } = item;

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease ${index * 100}ms, transform 0.6s ease ${index * 100}ms`,
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
        <div style={{ padding: "7px", borderRadius: "7px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.12)", flexShrink: 0 }}>
          <Icon size={14} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--fg)" }}>{item.org}</p>
          <p style={{ fontSize: "12px", color: "var(--accent)", marginTop: "2px" }}>{item.role}</p>
          <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{item.period}</p>
        </div>
      </div>
      <p style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--muted)" }}>{item.description}</p>
    </div>
  );
}

export default function Extras() {
  const { ref, visible } = useInView();

  return (
    <section id="extracurriculars" style={{ paddingBottom: "64px" }}>
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease", marginBottom: "28px" }}>
        <p style={{ fontSize: "13px", fontFamily: "monospace", color: "var(--accent)" }}>Extracurriculars</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {extras.map((e, i) => (
          <ExtraCard key={e.org} item={e} index={i} />
        ))}
      </div>
    </section>
  );
}
