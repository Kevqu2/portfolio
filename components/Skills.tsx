"use client";
import { useState } from "react";
import {
  SiPython, SiTypescript, SiJavascript, SiC, SiGo, SiSwift, SiHtml5, SiCss,
  SiReact, SiNextdotjs, SiFastapi, SiFirebase, SiTensorflow, SiExpo,
  SiPostgresql,
} from "react-icons/si";
import { useInView } from "@/hooks/useInView";

type IconCmp = React.ComponentType<{ size?: number; title?: string }>;

const skills: { name: string; Icon: IconCmp; color: string }[] = [
  { name: "Python", Icon: SiPython, color: "#3776AB" },
  { name: "TypeScript", Icon: SiTypescript, color: "#3178C6" },
  { name: "JavaScript", Icon: SiJavascript, color: "#F7DF1E" },
  { name: "C", Icon: SiC, color: "#A8B9CC" },
  { name: "Go", Icon: SiGo, color: "#00ADD8" },
  { name: "Swift", Icon: SiSwift, color: "#F05138" },
  { name: "HTML5", Icon: SiHtml5, color: "#E34F26" },
  { name: "CSS", Icon: SiCss, color: "#1572B6" },
  { name: "React", Icon: SiReact, color: "#61DAFB" },
  { name: "Next.js", Icon: SiNextdotjs, color: "#FFFFFF" },
  { name: "FastAPI", Icon: SiFastapi, color: "#009688" },
  { name: "Firebase", Icon: SiFirebase, color: "#FFCA28" },
  { name: "TensorFlow", Icon: SiTensorflow, color: "#FF6F00" },
  { name: "Expo", Icon: SiExpo, color: "#FFFFFF" },
  { name: "PostgreSQL", Icon: SiPostgresql, color: "#4169E1" },
];

const also = ["Java", "SQL", "AI Engineering", "Full-Stack Development", "Data Structures & Algorithms", "OOP", "APIs & Integration"];

export default function Skills() {
  const { ref, visible } = useInView();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="skills" style={{ paddingBottom: "64px" }}>
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)" }}>03</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", letterSpacing: "0.04em", color: "var(--fg)" }}>Skills</span>
          <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
        {skills.map(({ name, Icon, color }) => (
          <span
            key={name}
            aria-label={name}
            onMouseEnter={() => setHovered(name)}
            onMouseLeave={() => setHovered((h) => (h === name ? null : h))}
            style={{ position: "relative", display: "inline-flex", color, cursor: "default" }}
          >
            <Icon size={23} />
            {hovered === name && (
              <span
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 9px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1c1c1f",
                  color: "#ededed",
                  border: "1px solid #2c2c2c",
                  fontSize: "11px",
                  padding: "4px 9px",
                  borderRadius: "7px",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  zIndex: 5,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.45)",
                }}
              >
                {name}
                <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%) translateY(-3px) rotate(45deg)", width: "7px", height: "7px", background: "#1c1c1f", borderRight: "1px solid #2c2c2c", borderBottom: "1px solid #2c2c2c" }} />
              </span>
            )}
          </span>
        ))}
      </div>

      <p style={{ fontSize: "12px", lineHeight: 1.7, color: "var(--muted)", marginTop: "20px" }}>
        {also.join("  ·  ")}
      </p>
    </section>
  );
}
