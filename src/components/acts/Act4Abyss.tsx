"use client";

import { useRef, useState } from "react";
import { useFluidStore } from "@/lib/store";
import { CONTACT } from "@/lib/content";
import { scrollToTop } from "@/lib/lenis";
import { toast } from "sonner";

/**
 * ACT 4 — THE ABYSS (scroll ~80% → 100%)
 * The fluid drains to a void with floating bioluminescent specks.
 * "LET'S BUILD" + the email. Hovering pulls the magnetic snap;
 * clicking copies the email and triggers a fluid implosion that
 * resets scroll to 0.
 */
export default function Act4Abyss() {
  const p = useFluidStore((s) => s.scrollProgress);
  const set = useFluidStore((s) => s.set);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  const start = 0.8;
  const local = Math.min(1, Math.max(0, (p - start) / 0.18));
  const opacity = Math.min(1, Math.max(0, (p - 0.79) / 0.03));

  // magnetic snap
  const onMove = (e: React.MouseEvent) => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) * 0.35;
    const dy = (e.clientY - cy) * 0.35;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
  };
  const onLeave = () => {
    const el = btnRef.current;
    if (el) el.style.transform = "translate(0,0) scale(1)";
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      setCopied(true);
      toast.success("Email copied — fluid implosion triggered");
      // implosion: spike scroll velocity for one frame so the fluid bursts,
      // then reset scroll to top
      set({ scrollVelocity: 120 });
      setTimeout(() => set({ scrollVelocity: 0 }), 90);
      setTimeout(() => {
        scrollToTop(1.8);
        setCopied(false);
      }, 350);
    } catch {
      toast.error("Couldn't copy — try selecting manually");
    }
  };

  return (
    <section
      className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-6"
      style={{ opacity }}
      aria-label="Abyss"
    >
      <h2
        className="font-hero text-center select-none"
        style={{
          fontSize: "clamp(3rem, 14vw, 16rem)",
          color: "var(--text-primary)",
          textShadow: "0 0 60px rgba(0,240,255,0.3)",
        }}
      >
        {CONTACT.cta}
      </h2>

      <button
        ref={btnRef}
        type="button"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onCopy}
        className="mt-10 font-ui text-[var(--text-primary)] transition-[color] duration-300 hover:text-[var(--iridescent-cyan)]"
        style={{
          pointerEvents: opacity > 0.3 ? "auto" : "none",
          letterSpacing: "0.05em",
          fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
        }}
        aria-label="Copy email to clipboard"
      >
        {copied ? "Copied — imploding…" : CONTACT.email}
      </button>

      <div className="mt-6 font-ui text-[var(--text-secondary)]">
        Click the email to copy · scroll up to return
      </div>

      {/* progress of the void */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-ui text-[var(--text-secondary)]">
        {Math.round(local * 100)}% void
      </div>
    </section>
  );
}
