"use client";

import { useEffect, useRef } from "react";
import { useFluidStore } from "@/lib/store";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Audio toggle (fixed bottom-left). When enabled, starts a Web Audio
 * graph: a 60Hz sine rumble whose gain is modulated by the fluid's
 * overall scroll velocity. Provides an ambient, reactive soundscape.
 */
export default function AudioToggle() {
  const audioEnabled = useFluidStore((s) => s.audioEnabled);
  const set = useFluidStore((s) => s.set);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    if (!audioEnabled) return;
    if (typeof window === "undefined") return;

    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AC();
    ctxRef.current = ctx;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 60; // low rumble

    const gain = ctx.createGain();
    gain.gain.value = 0.0001;

    // gentle lowpass for warmth
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 220;

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    oscRef.current = osc;
    gainRef.current = gain;

    // modulate gain from scroll velocity (read from store without rerender)
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const v = useFluidStore.getState().scrollVelocity;
      const target = Math.min(0.18, 0.005 + v * 0.004);
      if (gainRef.current && ctx) {
        gainRef.current.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      try {
        osc.stop();
      } catch {
        /* noop */
      }
      ctx.close();
    };
  }, [audioEnabled]);

  const toggle = () => {
    set({ audioEnabled: !audioEnabled });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={audioEnabled}
      aria-label={audioEnabled ? "Mute ambient audio" : "Enable ambient audio"}
      className="fixed bottom-6 left-6 md:bottom-8 md:left-8 z-50 flex items-center gap-2 rounded-full px-3 py-2 font-ui text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      style={{
        background: "rgba(20,20,30,0.5)",
        border: "1px solid rgba(245,245,247,0.08)",
        backdropFilter: "blur(8px)",
      }}
      data-cursor-label={audioEnabled ? "Mute" : "Sound"}
    >
      {audioEnabled ? (
        <Volume2 className="h-4 w-4 text-[var(--indigo)]" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {audioEnabled ? "Ambient On" : "Sound Off"}
      </span>
      {/* soundwave bars */}
      {audioEnabled && (
        <span className="flex items-end gap-[2px] h-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-[2px] bg-[var(--indigo)]"
              style={{
                height: "100%",
                animation: `eq 0.${6 + i}s ${i * 0.1}s ease-in-out infinite alternate`,
                transformOrigin: "bottom",
              }}
            />
          ))}
        </span>
      )}
      <style>{`@keyframes eq { from { transform: scaleY(0.2);} to { transform: scaleY(1);} }`}</style>
    </button>
  );
}
