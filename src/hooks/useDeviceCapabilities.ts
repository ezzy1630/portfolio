"use client";

import { useEffect } from "react";
import { useFluidStore } from "@/lib/store";

/**
 * Detects: reduced-motion preference, touch capability, and a coarse
 * GPU tier benchmark so the fluid simulation can degrade gracefully.
 * Writes results straight into the fluid store (including isBooted).
 */
export function useDeviceCapabilities() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window;

    let tier: "high" | "medium" | "low" = "high";

    const tryCanvas = document.createElement("canvas");
    const gl =
      tryCanvas.getContext("webgl2") || tryCanvas.getContext("webgl");

    if (!gl) {
      tier = "low";
    } else {
      const dbg = (gl as WebGLRenderingContext).getExtension(
        "WEBGL_debug_renderer_info"
      );
      const renderer = dbg
        ? (gl as WebGLRenderingContext).getParameter(
            dbg.UNMASKED_RENDERER_WEBGL
          )
        : "";
      const r = String(renderer).toLowerCase();

      if (
        /swiftshader|llvmpipe|software|mali|adreno 3|adreno 4|powervr|intel.*hd graphics 4/i.test(
          r
        )
      ) {
        tier = "low";
      } else if (/mali|adreno|powervr|apple gpu/i.test(r) || isTouch) {
        tier = "medium";
      }

      try {
        const t0 = performance.now();
        const ctx = gl as WebGLRenderingContext;
        const vs = ctx.createShader(ctx.VERTEX_SHADER)!;
        ctx.shaderSource(
          vs,
          "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"
        );
        ctx.compileShader(vs);
        ctx.getError();
        const dt = performance.now() - t0;
        if (dt > 60) tier = "low";
        else if (dt > 20 && tier === "high") tier = "medium";
      } catch {
        /* ignore */
      }

      const cores = navigator.hardwareConcurrency || 4;
      if (cores <= 4 && tier === "high") tier = "medium";
      if (cores <= 2) tier = "low";
    }

    const mem = (navigator as unknown as { deviceMemory?: number })
      .deviceMemory;
    if (mem && mem <= 4 && tier === "high") tier = "medium";

    const renderMode: "webgl" | "fallback" =
      tier === "low" && isTouch ? "fallback" : "webgl";

    useFluidStore.getState().set({
      gpuTier: tier,
      renderMode,
      reducedMotion,
      isTouch,
      isBooted: true,
    });
  }, []);
}
