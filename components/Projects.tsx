"use client";
import { ArrowUpRight } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const projects = [
  {
    name: "Lock-In",
    description: "Real-time habit detection pipeline tracking anxiety-related hand-to-face behaviors using computer vision, with discreet voice alerts.",
    metric: "90%+ accuracy · 30 FPS · <100ms latency",
    stack: ["Python", "OpenCV", "MediaPipe", "macOS Voice APIs"],
    github: "https://github.com/Kevqu2/lock-in",
  },
  {
    name: "Lovaslide",
    description: "AI-powered presentation generator transforming documents into fact-checked slides via a multi-agent system. Built at HackHarvard.",
    metric: "80% faster slide creation · 95% claim accuracy",
    stack: ["Next.js", "FastAPI", "GPT-5", "SerpAPI"],
    github: "https://github.com/diggygeorge/lovaslide",
  },
  {
    name: "EDEN",
    description: "AI security monitoring system analyzing 25+ live camera feeds for real-time incident detection with automated dispatch.",
    metric: "75% → 92% detection · 30min → 5min response",
    stack: ["TypeScript", "React", "YOLO", "PyTorch", "Mapbox", "Twilio", "OpenAI"],
    github: "https://github.com/OmSethi/EDEN",
  },
];

function ProjectCard({ project, index }: { project: (typeof projects)[0]; index: number }) {
  const { ref, visible } = useInView();

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: `opacity 0.6s ease ${index * 100}ms, transform 0.6s ease ${index * 100}ms, border-color 0.2s`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--fg)" }}>{project.name}</h3>
        <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--muted)", transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          <ArrowUpRight size={15} />
        </a>
      </div>
      <p style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--muted)" }}>{project.description}</p>
      <div style={{ fontSize: "12px", fontFamily: "monospace", padding: "6px 10px", borderRadius: "6px", color: "var(--accent)", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.14)" }}>
        {project.metric}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {project.stack.map((tech) => (
          <span key={tech} style={{ fontSize: "11px", fontFamily: "monospace", padding: "3px 8px", borderRadius: "4px", color: "var(--muted)", background: "#141414", border: "1px solid #222" }}>
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Projects() {
  const { ref, visible } = useInView();

  return (
    <section id="projects" style={{ paddingBottom: "64px" }}>
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease", marginBottom: "28px" }}>
        <p style={{ fontSize: "13px", fontFamily: "monospace", color: "var(--accent)" }}>Projects</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {projects.map((p, i) => (
          <ProjectCard key={p.name} project={p} index={i} />
        ))}
      </div>
    </section>
  );
}
