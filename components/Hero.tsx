"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Github, Linkedin } from "lucide-react";

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.732-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const socials = [
  { label: "GitHub", href: "https://github.com/Kevqu2", Icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kevinqu-swe", Icon: Linkedin },
  { label: "Twitter", href: "https://x.com/_kevinquT", Icon: XIcon },
];

const PREFIX = "20, ";
const WORDS = ["volleyball enjoyer 🏐", "movie and show connoisseur 📺", "gymrat?"];

function Typewriter() {
  const [displayed, setDisplayed] = useState(PREFIX);
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = PREFIX + WORDS[wordIndex];

    let delay: number;

    if (!isDeleting && displayed === fullText) {
      delay = 1800;
      const t = setTimeout(() => setIsDeleting(true), delay);
      return () => clearTimeout(t);
    }

    if (isDeleting && displayed === PREFIX) {
      delay = 400;
      const t = setTimeout(() => {
        setIsDeleting(false);
        setWordIndex((i) => (i + 1) % WORDS.length);
      }, delay);
      return () => clearTimeout(t);
    }

    delay = isDeleting ? 55 : 100;
    const t = setTimeout(() => {
      setDisplayed(isDeleting
        ? displayed.slice(0, -1)
        : fullText.slice(0, displayed.length + 1)
      );
    }, delay);
    return () => clearTimeout(t);
  }, [displayed, isDeleting, wordIndex]);

  return (
    <span style={{ fontSize: "15px", color: "var(--fg)" }}>
      {displayed}
      <span style={{ animation: "blink 1s step-end infinite", color: "var(--fg)", opacity: 1 }}>|</span>
    </span>
  );
}

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const fadeIn = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  });

  return (
    <section style={{ paddingTop: "96px", paddingBottom: "64px" }}>
      <div className="hero-layout">
        <div className="hero-text" style={{ flex: 1 }}>
          <h1
            style={{
              ...fadeIn(0),
              fontSize: "clamp(36px, 5vw, 48px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "var(--fg)",
              marginBottom: "14px",
            }}
          >
            Kevin Qu
          </h1>
          <div style={{ ...fadeIn(100), marginBottom: "10px" }}>
            <Typewriter />
          </div>
          <p style={{ ...fadeIn(200), fontSize: "14px", lineHeight: 1.75, color: "var(--muted)", marginBottom: "28px" }}>
            Junior CS student at UB, building AI systems and full-stack products.
            Co-founder of Rally. Currently a SWE intern at the UB CSE department.
          </p>
          <div className="hero-socials" style={{ ...fadeIn(300), display: "flex", gap: "10px" }}>
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "38px",
                  height: "38px",
                  color: "var(--muted)",
                  border: "1px solid #2a2a2a",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#2a2a2a";
                  e.currentTarget.style.color = "var(--muted)";
                }}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div style={{ ...fadeIn(200), flexShrink: 0 }}>
          <div className="hero-photo-wrap" style={{ width: "180px", height: "180px", borderRadius: "50%", overflow: "hidden", border: "1px solid var(--border)" }}>
            <Image
              src="/photo.jpg"
              alt="Kevin Qu"
              width={180}
              height={180}
              priority
              style={{ objectFit: "cover", objectPosition: "center 35%", width: "100%", height: "100%", transform: "scale(1.5)", transformOrigin: "center 35%" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
