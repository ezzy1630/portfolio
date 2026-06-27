"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useFluidStore } from "@/lib/store";
import { CONTACT } from "@/lib/content";
import { toast } from "sonner";
import { Github, Linkedin, Copy, Send, Terminal } from "lucide-react";

/**
 * ACT 5 — THE TERMINAL (scroll ~89% → 100%)
 *
 * The fluid has imploded into a single glowing dot at the center of the
 * viewport. Around it: the heading "Initiate contact.", a glassmorphic
 * terminal input where the visitor can type a message to Ezzy, and a
 * fallback row of direct-contact links.
 *
 * On submit the message POSTs to /api/contact (which persists to the
 * ContactMessage table). A burst of particles "shatters" outward from
 * the input on send (skipped under reduced-motion). Success swaps the
 * input for a "Message transmitted." confirmation with a reset control.
 *
 * Pointer-events are only enabled once the act has faded in past 0.3
 * so it never blocks the earlier acts while still invisible.
 */

const EMAIL = CONTACT.email;
const PHONE = CONTACT.phone;
const LOCATION = CONTACT.location;
const GITHUB = CONTACT.github;
const LINKEDIN = CONTACT.linkedin;

const MAX_MESSAGE = 5000;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smoothStep = (edge0: number, edge1: number, n: number) => {
  const t = clamp01((n - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

interface Particle {
  id: number;
  dx: number;
  dy: number;
  rotate: number;
  size: number;
  color: string;
}

function makeParticles(n: number): Particle[] {
  const colors = ["#5e5ce6", "#0a84ff", "#f5f5f7", "#86868b"];
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 + Math.random() * 0.6;
    const dist = 200 + Math.random() * 420;
    return {
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      rotate: (Math.random() - 0.5) * 720,
      size: 4 + Math.random() * 7,
      color: colors[i % colors.length],
    };
  });
}

export default function Act5Terminal() {
  const p = useFluidStore((s) => s.scrollProgress);
  const reducedMotion = useFluidStore((s) => s.reducedMotion);
  const contactSending = useFluidStore((s) => s.contactSending);
  const contactSent = useFluidStore((s) => s.contactSent);
  const set = useFluidStore((s) => s.set);

  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [showShatter, setShowShatter] = useState(false);
  const particlesRef = useRef<Particle[]>([]);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);

  const reveal = smoothStep(0.915, 0.975, p);
  const opacity = reveal;
  const interactive = opacity > 0.3;
  const pointerEvents: "auto" | "none" = interactive ? "auto" : "none";

  // central glowing dot expansion 0..1 across the Act 4 -> Act 5 handoff
  const dotScale = smoothStep(0.9, 0.985, p);
  const contentY = (1 - reveal) * 12;
  const contentScale = 0.96 + reveal * 0.04;

  // auto-grow the textarea to fit content (capped)
  useEffect(() => {
    const el = messageRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [message, contactSent]);

  const onSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("Type a message first.");
      return;
    }
    if (trimmed.length > MAX_MESSAGE) {
      toast.error(`Message too long (max ${MAX_MESSAGE} chars).`);
      return;
    }
    if (contactSending || contactSent) return;

    set({ contactSending: true });

    if (!reducedMotion) {
      particlesRef.current = makeParticles(28);
      setShowShatter(true);
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          name: name.trim() || undefined,
          email: emailVal.trim() || undefined,
        }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      const ok =
        res.ok && typeof data === "object" && data !== null &&
        "ok" in data && (data as { ok: unknown }).ok === true;
      if (!ok) {
        const err =
          typeof data === "object" && data !== null && "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Transmission failed.";
        throw new Error(err);
      }
      set({ contactSending: false, contactSent: true });
      if (!reducedMotion) {
        window.setTimeout(() => setShowShatter(false), 950);
      }
      toast.success("Message transmitted.");
    } catch (err) {
      set({ contactSending: false });
      setShowShatter(false);
      const msg = err instanceof Error ? err.message : "Transmission failed.";
      toast.error(msg);
    }
  };

  const onReset = () => {
    setMessage("");
    setName("");
    setEmailVal("");
    set({ contactSent: false, contactSending: false });
    setShowShatter(false);
  };

  const onCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      toast.success("Email copied to clipboard.");
    } catch {
      toast.error("Couldn't copy — select manually.");
    }
  };

  // magnetic snap on the Copy Email button
  const onCopyMove = (e: React.MouseEvent) => {
    const el = copyBtnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) * 0.3;
    const dy = (e.clientY - cy) * 0.3;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
  };
  const onCopyLeave = () => {
    const el = copyBtnRef.current;
    if (el) el.style.transform = "translate(0,0) scale(1)";
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSubmit();
    }
  };

  const particles = particlesRef.current;
  const panelStyle: React.CSSProperties = {
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    background: "rgba(20,20,30,0.55)",
    border: "1px solid rgba(245,245,247,0.1)",
    borderRadius: "16px",
    boxShadow: "0 30px 80px -30px rgba(94,92,230,0.4)",
  };
  const fieldStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid rgba(245,245,247,0.08)",
    borderRadius: "8px",
    padding: "0.5rem 0.75rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.875rem",
    color: "var(--text-primary)",
    outline: "none",
    width: "100%",
  };

  return (
    <section
      id="contact"
      className="fixed inset-0 z-20 flex flex-col items-center justify-center px-6 pointer-events-none"
      style={{ opacity }}
      aria-label="The Terminal — contact"
    >
      {/* central glowing dot */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `${10 + dotScale * 260}px`,
          height: `${10 + dotScale * 260}px`,
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(94,92,230,0.9) 0%, rgba(94,92,230,0.3) 38%, transparent 70%)",
          filter: "blur(2px)",
          transition: "width 0.6s var(--ease-act), height 0.6s var(--ease-act)",
          opacity: dotScale,
        }}
      />

      {/* content stack */}
      <div
        className="relative z-10 w-full max-w-3xl flex flex-col items-center"
        style={{
          pointerEvents,
          transform: `translate3d(0, ${contentY}vh, 0) scale(${contentScale})`,
          transformOrigin: "50% 52%",
        }}
      >
        <h2
          className="font-h2 text-center select-none"
          style={{
            color: "var(--text-primary)",
            textShadow: "0 0 60px rgba(94,92,230,0.45)",
          }}
        >
          Initiate contact.
        </h2>

        {/* terminal panel */}
        <div className="mt-10 w-full relative" style={panelStyle}>
          {/* title bar */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[rgba(245,245,247,0.06)]">
            <span className="flex items-center gap-2 font-ui text-[10px] text-[var(--text-secondary)]">
              <Terminal size={12} /> ezzy@fluid:~ — contact
            </span>
            <span className="flex items-center gap-1.5" aria-hidden>
              <span className="inline-block w-2 h-2 rounded-full bg-[#ff5f56]" />
              <span className="inline-block w-2 h-2 rounded-full bg-[#ffbd2e]" />
              <span className="inline-block w-2 h-2 rounded-full bg-[#27c93f]" />
            </span>
          </div>

          <div className="p-5 relative">
            {!contactSent ? (
              <>
                {/* optional name/email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <label htmlFor="act5-name" className="sr-only">
                    Your name (optional)
                  </label>
                  <input
                    id="act5-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="name (optional)"
                    className="font-mono text-sm placeholder:text-[var(--text-secondary)] focus:border-[var(--indigo)] transition-colors"
                    style={{ ...fieldStyle, pointerEvents }}
                    maxLength={200}
                    disabled={contactSending}
                  />
                  <label htmlFor="act5-email" className="sr-only">
                    Your email (optional)
                  </label>
                  <input
                    id="act5-email"
                    type="email"
                    value={emailVal}
                    onChange={(e) => setEmailVal(e.target.value)}
                    placeholder="email (optional)"
                    className="font-mono text-sm placeholder:text-[var(--text-secondary)] focus:border-[var(--indigo)] transition-colors"
                    style={{ ...fieldStyle, pointerEvents }}
                    maxLength={320}
                    disabled={contactSending}
                  />
                </div>

                {/* prompt + message + send */}
                <label htmlFor="act5-message" className="sr-only">
                  Message to Ezzy
                </label>
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="font-mono select-none mt-2"
                    style={{
                      color: "var(--indigo)",
                      fontSize: "0.95rem",
                      lineHeight: "1.5rem",
                      textShadow: "0 0 8px rgba(94,92,230,0.6)",
                    }}
                  >
                    &gt;
                  </span>
                  <textarea
                    id="act5-message"
                    ref={messageRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Type a message to Ezzy…"
                    rows={1}
                    aria-label="Message to Ezzy"
                    className="flex-1 bg-transparent resize-none font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none py-2 max-h-40 overflow-y-auto fluid-scroll disabled:opacity-50"
                    style={{
                      caretColor: "var(--indigo)",
                      pointerEvents,
                      lineHeight: "1.5rem",
                    }}
                    maxLength={MAX_MESSAGE}
                    disabled={contactSending}
                  />
                  <button
                    type="button"
                    onClick={() => void onSubmit()}
                    disabled={contactSending || contactSent}
                    aria-label="Send message"
                    className="btn-fluid shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ pointerEvents }}
                  >
                    <Send size={14} className="btn-arrow" />
                    <span>{contactSending ? "Sending…" : "Send"}</span>
                  </button>
                </div>

                <div className="mt-3 font-ui text-[10px] text-[var(--text-secondary)]">
                  Enter to send · Shift+Enter for newline · {message.length}/{MAX_MESSAGE}
                </div>
              </>
            ) : (
              <div className="py-8 flex flex-col items-center gap-5 text-center">
                <div
                  className="font-mono text-base text-[var(--text-primary)]"
                  style={{ textShadow: "0 0 24px rgba(94,92,230,0.7)" }}
                >
                  ▚ Message transmitted. ▞
                </div>
                <p className="font-ui text-[10px] text-[var(--text-secondary)] max-w-md">
                  Your note is queued in the terminal log. I&apos;ll read it from{" "}
                  <span className="text-[var(--text-primary)]">{EMAIL}</span>.
                </p>
                <button
                  type="button"
                  onClick={onReset}
                  className="btn-fluid"
                  style={{ pointerEvents }}
                  aria-label="Send another message"
                >
                  <Terminal size={14} className="btn-arrow" />
                  <span>Send another</span>
                </button>
              </div>
            )}

            {/* shattering particles overlay (originates from input area) */}
            {showShatter && !reducedMotion && (
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ overflow: "visible" }}
              >
                {particles.map((pt) => (
                  <motion.span
                    key={pt.id}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                    animate={{
                      x: pt.dx,
                      y: pt.dy,
                      opacity: 0,
                      rotate: pt.rotate,
                      scale: 0.2,
                    }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "60%",
                      width: pt.size,
                      height: pt.size,
                      marginLeft: -pt.size / 2,
                      marginTop: -pt.size / 2,
                      background: pt.color,
                      borderRadius: "2px",
                      boxShadow: `0 0 8px ${pt.color}`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* fallback row */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            ref={copyBtnRef}
            type="button"
            onMouseMove={onCopyMove}
            onMouseLeave={onCopyLeave}
            onClick={() => void onCopyEmail()}
            className="btn-fluid"
            style={{ pointerEvents }}
            aria-label={`Copy email ${EMAIL} to clipboard`}
          >
            <Copy size={14} className="btn-arrow" />
            <span>Copy Email</span>
          </button>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-fluid"
            style={{ pointerEvents }}
            aria-label="Open Ezzy's GitHub in a new tab"
          >
            <Github size={14} className="btn-arrow" />
            <span>GitHub</span>
          </a>
          <a
            href={LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-fluid"
            style={{ pointerEvents }}
            aria-label="Open Ezzy's LinkedIn in a new tab"
          >
            <Linkedin size={14} className="btn-arrow" />
            <span>LinkedIn</span>
          </a>
        </div>

        {/* secondary text */}
        <p className="mt-5 font-ui text-[10px] text-[var(--text-secondary)] text-center max-w-xl">
          or reach me directly — {EMAIL} · {PHONE} · {LOCATION}
        </p>
      </div>
    </section>
  );
}
