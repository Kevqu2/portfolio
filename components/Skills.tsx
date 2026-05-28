"use client";
import { useInView } from "@/hooks/useInView";

const groups = [
  {
    label: "Languages",
    items: ["Java", "Python", "C", "TypeScript", "JavaScript", "HTML/CSS", "SQL", "Go", "Swift"],
  },
  {
    label: "Frameworks & Tools",
    items: ["React", "Next.js", "FastAPI", "Firebase", "TensorFlow Lite", "Expo", "Git", "VS Code", "IntelliJ", "Xpra"],
  },
  {
    label: "Core Skills",
    items: ["AI Engineering", "Full-Stack Development", "Data Structures & Algorithms", "OOP", "APIs & Integration", "Web Development"],
  },
];

function SkillGroup({ group, index }: { group: (typeof groups)[0]; index: number }) {
  const { ref, visible } = useInView();

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease ${index * 100}ms, transform 0.6s ease ${index * 100}ms`,
      }}
    >
      <p style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {group.label}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {group.items.map((skill) => (
          <span key={skill} style={{ fontSize: "13px", fontFamily: "monospace", padding: "5px 10px", borderRadius: "6px", color: "var(--fg)", background: "#111", border: "1px solid #222" }}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Skills() {
  const { ref, visible } = useInView();

  return (
    <section id="skills" style={{ paddingBottom: "64px" }}>
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease", marginBottom: "28px" }}>
        <p style={{ fontSize: "13px", fontFamily: "monospace", color: "var(--accent)" }}>Skills</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {groups.map((g, i) => (
          <SkillGroup key={g.label} group={g} index={i} />
        ))}
      </div>
    </section>
  );
}
