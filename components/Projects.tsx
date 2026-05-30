"use client";
import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Github, ExternalLink } from "lucide-react";
import {
  SiPython, SiOpencv, SiTypescript, SiReact, SiNextdotjs, SiFastapi,
  SiPytorch, SiMapbox, SiTwilio, SiOpenai, SiApple,
} from "react-icons/si";
import { useInView } from "@/hooks/useInView";

type IconCmp = React.ComponentType<{ size?: number; title?: string }>;
const TECH_ICON: Record<string, IconCmp> = {
  "Python": SiPython,
  "OpenCV": SiOpencv,
  "macOS Voice APIs": SiApple,
  "Next.js": SiNextdotjs,
  "FastAPI": SiFastapi,
  "GPT-5": SiOpenai,
  "TypeScript": SiTypescript,
  "React": SiReact,
  "PyTorch": SiPytorch,
  "Mapbox": SiMapbox,
  "Twilio": SiTwilio,
  "OpenAI": SiOpenai,
};

const FALLBACK_BG = "radial-gradient(120% 120% at 0% 0%, rgba(226,85,46,0.18), rgba(226,85,46,0.03) 50%, transparent 72%), linear-gradient(160deg, #1a1512, #0c0a09)";

const projects = [
  {
    name: "Lock-In",
    description: "Real-time habit detection tracking anxiety-related hand-to-face behaviors via computer vision.",
    stack: ["Python", "OpenCV", "MediaPipe", "macOS Voice APIs"],
    github: "https://github.com/Kevqu2/lock-in",
    live: "",
    images: [] as string[],
  },
  {
    name: "Lovaslide",
    description: "AI presentation generator turning documents into fact-checked slides via a multi-agent system.",
    stack: ["Next.js", "FastAPI", "GPT-5", "SerpAPI"],
    github: "https://github.com/diggygeorge/lovaslide",
    live: "",
    images: ["/projects/lovaslide-1.jpeg", "/projects/lovaslide-2.jpeg", "/projects/lovaslide-3.jpeg", "/projects/lovaslide-4.jpeg"],
  },
  {
    name: "EDEN",
    description: "AI security monitoring across 25+ live camera feeds with real-time incident detection and dispatch.",
    stack: ["TypeScript", "React", "YOLO", "PyTorch", "Mapbox", "Twilio", "OpenAI"],
    github: "https://github.com/OmSethi/EDEN",
    live: "",
    images: ["/projects/eden-1.jpeg", "/projects/eden-2.jpeg", "/projects/eden-3.jpeg", "/projects/eden-4.jpeg"],
  },
];

function IconLink({ href, children, label }: { href: string; children: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      style={{ color: "rgba(255,255,255,0.7)", display: "inline-flex", transition: "color 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
    >
      {children}
    </a>
  );
}

function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: (typeof projects)[0];
  index: number;
  onOpen: (images: string[], start: number) => void;
}) {
  const { ref, visible } = useInView();
  const hasImages = project.images.length > 0;

  return (
    <div
      ref={ref}
      onClick={() => hasImages && onOpen(project.images, 0)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        position: "relative",
        aspectRatio: "10 / 7",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "#0d0d0d",
        cursor: hasImages ? "zoom-in" : "default",
        transition: `opacity 0.6s ease ${index * 90}ms, transform 0.6s ease ${index * 90}ms, border-color 0.2s`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(226,85,46,0.45)";
        const img = e.currentTarget.querySelector("img");
        if (img) img.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        const img = e.currentTarget.querySelector("img");
        if (img) img.style.transform = "scale(1)";
      }}
    >
      {hasImages ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.images[0]}
          alt={`${project.name} preview`}
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transition: "transform 0.45s ease" }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: FALLBACK_BG }} />
      )}

      {/* legibility overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 38%, rgba(0,0,0,0.04) 72%)" }} />

      {/* content */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "16px", display: "flex", flexDirection: "column", gap: "7px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>{project.name}</h3>
          <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
            {project.live && <IconLink href={project.live} label="Live"><ExternalLink size={16} /></IconLink>}
            <IconLink href={project.github} label="GitHub"><Github size={16} /></IconLink>
          </div>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: 1.5, color: "rgba(255,255,255,0.68)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {project.description}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "9px", alignItems: "center", marginTop: "2px" }}>
          {project.stack.map((tech) => {
            const Icon = TECH_ICON[tech];
            return (
              <span key={tech} title={tech} aria-label={tech} style={{ display: "inline-flex", alignItems: "center", height: "18px", color: "rgba(255,255,255,0.82)" }}>
                {Icon ? (
                  <Icon size={15} title={tech} />
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", height: "18px", padding: "0 6px", fontSize: "9.5px", fontFamily: "var(--font-mono)", borderRadius: "4px", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.1)" }}>
                    {tech}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Lightbox({
  images,
  index,
  setIndex,
  onClose,
}: {
  images: string[];
  index: number;
  setIndex: (i: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIndex((index + 1) % images.length);
      else if (e.key === "ArrowLeft") setIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onClose, setIndex]);

  const go = (dir: number) => setIndex((index + dir + images.length) % images.length);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff", display: "inline-flex" }}>
        <X size={18} />
      </button>

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "10px", cursor: "pointer", color: "#fff", display: "inline-flex" }}>
            <ChevronLeft size={22} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "10px", cursor: "pointer", color: "#fff", display: "inline-flex" }}>
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt="Project screenshot"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "92vw", maxHeight: "84vh", objectFit: "contain", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
      />

      {images.length > 1 && (
        <span style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", fontSize: "12px", fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.5)", padding: "4px 10px", borderRadius: "6px" }}>
          {index + 1} / {images.length}
        </span>
      )}
    </div>
  );
}

export default function Projects() {
  const { ref, visible } = useInView();
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  return (
    <section id="projects" style={{ paddingBottom: "64px" }}>
      <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)" }}>02</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", letterSpacing: "0.04em", color: "var(--fg)" }}>Projects</span>
          <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>
      </div>
      <div className="projects-grid">
        {projects.map((p, i) => (
          <ProjectCard key={p.name} project={p} index={i} onOpen={(images, start) => setLightbox({ images, index: start })} />
        ))}
      </div>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          setIndex={(i) => setLightbox((lb) => (lb ? { ...lb, index: i } : lb))}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}
