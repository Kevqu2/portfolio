"use client";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Waves } from "lucide-react";
import { usePond } from "./PondContext";

const links = [
  { label: "Home", href: "#" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Extracurriculars", href: "#extracurriculars" },
];

export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const locked = useRef(false);
  const { on: pondOn, toggle: togglePond } = usePond();

  useEffect(() => {
    const handleScroll = () => {
      if (locked.current) return;
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 80);
      lastY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = () => {
    setMenuOpen(false);
    locked.current = true;
    setHidden(false);
    setTimeout(() => {
      lastY.current = window.scrollY;
      locked.current = false;
    }, 1200);
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backdropFilter: "blur(12px)",
        background: "rgba(10,10,10,0.85)",
        borderBottom: "1px solid var(--border)",
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "0 24px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px", fontWeight: 500, color: "var(--fg)" }}>Kevin Qu</span>

        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          {/* Desktop links */}
          <div className="nav-desktop-links" style={{ display: "flex", gap: "28px" }}>
            {links.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={handleLinkClick}
                style={{ fontSize: "14px", color: "var(--muted)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Subtle Pond-mode toggle (hidden on mobile — no margins there) */}
          <button
            className="nav-pond-toggle"
            onClick={togglePond}
            aria-label="Toggle Pond mode"
            title="Pond"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "inline-flex",
              alignItems: "center",
              color: pondOn ? "var(--accent)" : "#3a3a3a",
              transition: "color 0.3s",
            }}
            onMouseEnter={(e) => { if (!pondOn) e.currentTarget.style.color = "var(--muted)"; }}
            onMouseLeave={(e) => { if (!pondOn) e.currentTarget.style.color = "#3a3a3a"; }}
          >
            <Waves size={16} />
          </button>

          {/* Hamburger button — mobile only */}
          <button
            className="nav-hamburger-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              padding: "4px",
            }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={handleLinkClick}
              style={{
                fontSize: "14px",
                color: "var(--muted)",
                textDecoration: "none",
                padding: "12px 24px",
                transition: "color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--fg)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
