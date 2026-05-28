"use client";
import { Github, Linkedin, Mail } from "lucide-react";

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.743l7.732-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const links = [
  { label: "Email", href: "mailto:kevinqu489@gmail.com", Icon: Mail, external: false },
  { label: "GitHub", href: "https://github.com/Kevqu2", Icon: Github, external: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kevinqu-swe", Icon: Linkedin, external: true },
  { label: "Twitter", href: "https://x.com/_kevinquT", Icon: XIcon, external: true },
];

export default function Footer() {
  return (
    <footer style={{ padding: "48px 24px", borderTop: "1px solid var(--border)" }}>
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          alignItems: "center",
        }}
      >
        {links.map(({ label, href, Icon, external }) => (
          <a
            key={label}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            aria-label={label}
            style={{ color: "var(--muted)", textDecoration: "none", transition: "color 0.2s", display: "inline-flex" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            <Icon size={16} />
          </a>
        ))}
      </div>
    </footer>
  );
}
