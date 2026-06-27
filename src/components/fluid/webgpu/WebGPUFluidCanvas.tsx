"use client";

import { useEffect, useRef, useState } from "react";
import FluidCanvas from "@/components/fluid/FluidCanvas";
import { fluidComputeWGSL, textDisplaceWGSL } from "./webgpuFluidShaders";

type GPUCapableNavigator = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<unknown>;
  };
};

interface WebGPUFluidCanvasProps {
  enabled?: boolean;
}

export function supportsWebGPU() {
  if (typeof navigator === "undefined") return false;
  return Boolean((navigator as GPUCapableNavigator).gpu);
}

/**
 * Architecture shell for the WebGPU fluid renderer.
 *
 * The production WebGL renderer remains the live fallback. The WebGPU path is
 * isolated here because Three's experimental WebGPU/R3F surface changes
 * quickly; this component owns feature detection, adapter setup, compute shader
 * modules, and a safe fallback boundary.
 */
export default function WebGPUFluidCanvas({
  enabled = false,
}: WebGPUFluidCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(() => !enabled || !supportsWebGPU());

  useEffect(() => {
    if (!enabled || !supportsWebGPU()) return;

    let cancelled = false;

    async function bootWebGPU() {
      const gpu = (navigator as GPUCapableNavigator).gpu;
      if (!gpu) {
        setFallback(true);
        return;
      }

      const adapter = await gpu.requestAdapter();
      if (!adapter || cancelled) {
        setFallback(true);
        return;
      }

      /**
       * Pipeline wiring to implement in the WebGPU migration:
       *
       * 1. requestDevice() from adapter.
       * 2. configure canvas.getContext("webgpu") with preferred format.
       * 3. allocate velocity/density texture pairs:
       *    - rgba16float
       *    - STORAGE_BINDING | TEXTURE_BINDING | COPY_DST
       *    - ping-pong read/write every dispatch.
       * 4. create shader modules from fluidComputeWGSL/textDisplaceWGSL.
       * 5. each frame:
       *    - update mouse/scroll uniform buffer
       *    - dispatch compute workgroups ceil(resolution / 8)
       *    - swap storage texture pairs
       *    - render fullscreen triangle sampling typography texture
       * 6. regenerate the typography texture from html-to-image when DOM text
       *    or viewport size changes.
       */
      void canvasRef.current;
      void fluidComputeWGSL;
      void textDisplaceWGSL;
    }

    void bootWebGPU().catch(() => {
      if (!cancelled) setFallback(true);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (fallback) return <FluidCanvas />;

  return (
    <canvas
      ref={canvasRef}
      data-fluid-canvas
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
