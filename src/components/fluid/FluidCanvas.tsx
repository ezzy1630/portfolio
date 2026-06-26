"use client";

import { Canvas } from "@react-three/fiber";
import { useFluidStore } from "@/lib/store";
import FluidSimulation from "./FluidSimulation";

function resolutionScaleFor(tier: "high" | "medium" | "low") {
  if (tier === "high") return 0.5;
  if (tier === "medium") return 0.35;
  return 0.25;
}

export default function FluidCanvas() {
  const renderMode = useFluidStore((s) => s.renderMode);
  const gpuTier = useFluidStore((s) => s.gpuTier);
  const reducedMotion = useFluidStore((s) => s.reducedMotion);

  // Fallback: CSS-only liquid gradient (mobile / no WebGL / reduced motion)
  if (renderMode === "fallback" || reducedMotion) {
    return (
      <div className="fluid-fallback pointer-events-none fixed inset-0 z-0" />
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: false,
          preserveDrawingBuffer: true,
        }}
        dpr={[1, gpuTier === "high" ? 1.5 : 1]}
        flat
        frameloop={reducedMotion ? "demand" : "always"}
        style={{ background: "#030303" }}
      >
        <FluidSimulation resolutionScale={resolutionScaleFor(gpuTier)} />
      </Canvas>
    </div>
  );
}
