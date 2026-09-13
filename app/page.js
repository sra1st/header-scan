"use client";

import { useState } from "react";

const GRADE_COLOR = {
  "A+": "var(--pass)",
  A: "var(--pass)",
  B: "var(--pass)",
  C: "var(--warn)",
  D: "var(--fail)",
  F: "var(--fail)",
};

function Glyph({ pass }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: `1.5px solid ${pass ? "var(--pass)" : "var(--fail)"}`,
        color: pass ? "var(--pass)" : "var(--fail)",
        fontSize: 12,
        fontFamily: "var(--font-mono)",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {pass ? "✓" : "×"}
    </span>
  );
}

function SeverityTag({ severity }) {
  const label = { critical: "critical", important: "important", recommended: "advisory" }[severity];
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--text-faint)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius)",
        padding: "2px 6px",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
  );
}

function CheckRow({ check }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid var(--line)",
        padding: "18px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ marginTop: 2 }}>
          <Glyph pass={check.pass} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14.5, fontWeight: 500 }}>
              {check.name}
            </span>
            <SeverityTag severity={check.severity} />
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 14.5, color: "var(--text-dim)", maxWidth: 640 }}>
            {check.verdict}
          </p>
          {check.raw && (
            <button
              onClick={() => setOpen(!open)}
              style={{
                marginTop: 8,
                background: "none",
                border: "none",
                color: "var(--text-faint)",
                fontSize: 12.5,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {open ? "hide raw value" : "show raw value"}
            </button>
          )}
          {open && check.raw && (
            <pre
              style={{
                marginTop: 8,
                background: "var(--bg)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                padding: "10px 12px",
                fontSize: 12.5,
                fontFamily: "var(--font-mono)",
                color: "var(--text-dim)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                maxWidth: 640,
              }}
            >
              {check.raw}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Couldn't reach the scan service. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const passCount = result ? result.checks.filter((c) => c.pass).length : 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        maxWidth: 720,
        margin: "0 auto",
        padding: "64px 24px 96px",
      }}
    >
      <header style={{ marginBottom: 40 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12.5,
            color: "var(--text-faint)",
            letterSpacing: "0.03em",
            marginBottom: 10,
          }}
        >
          header-scan
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            margin: "0 0 10px",
            letterSpacing: "-0.01em",
          }}
        >
          What is your site telling every browser about itself?
        </h1>
        <p style={{ color: "var(--text-dim)", fontSize: 15.5, margin: 0, maxWidth: 560 }}>
          Response headers are quiet instructions to the browser — whether to allow framing,
          whether to trust HTTPS, whether inline scripts are allowed to run. Paste a URL to see
          which of those instructions are set, missing, or set too loosely.
        </p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com"
          spellCheck={false}
          autoCapitalize="off"
          style={{
            flex: 1,
            background: "var(--bg-raised)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            padding: "12px 14px",
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: 14.5,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "var(--line)" : "var(--text)",
            color: loading ? "var(--text-faint)" : "var(--bg)",
            border: "none",
            borderRadius: "var(--radius)",
            padding: "12px 20px",
            fontWeight: 600,
            fontSize: 14.5,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Scanning…" : "Scan"}
        </button>
      </form>

      {error && (
        <p style={{ color: "var(--fail)", fontSize: 14, marginTop: 12 }}>{error}</p>
      )}

      {result && (
        <section style={{ marginTop: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 20,
              paddingBottom: 24,
              borderBottom: "1px solid var(--line)",
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 44,
                fontWeight: 600,
                color: GRADE_COLOR[result.grade],
                lineHeight: 1,
              }}
            >
              {result.grade}
            </div>
            <div>
              <div style={{ fontSize: 14.5, color: "var(--text-dim)" }}>
                {passCount} of {result.checks.length} checks pass
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12.5,
                  color: "var(--text-faint)",
                  marginTop: 3,
                  wordBreak: "break-all",
                }}
              >
                {result.target}
              </div>
            </div>
          </div>

          <div>
            {result.checks.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </div>
        </section>
      )}

      <footer
        style={{
          marginTop: 80,
          paddingTop: 24,
          borderTop: "1px solid var(--line)",
          fontSize: 13,
          color: "var(--text-faint)",
        }}
      >
        Checks response headers only — this isn't a full penetration test, and a passing grade
        here doesn't mean a site is otherwise secure.
      </footer>
    </main>
  );
}
