"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { HERO, PROJECTS } from "@/lib/content";
import { useFluidStore } from "@/lib/store";
import { fluidComputeWGSL, textDisplaceWGSL } from "./webgpuFluidShaders";

type GPUCapableNavigator = Navigator & {
  gpu?: {
    getPreferredCanvasFormat: () => GPUTextureFormat;
    requestAdapter: (options?: GPURequestAdapterOptions) => Promise<GPUAdapter | null>;
  };
};

type FluidTexturePair = {
  velocity: GPUTexture;
  density: GPUTexture;
  velocityView: GPUTextureView;
  densityView: GPUTextureView;
};

type WebGPURuntime = {
  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  canvasFormat: GPUTextureFormat;
  computePipeline: GPUComputePipeline;
  renderPipeline: GPURenderPipeline;
  computeUniform: GPUBuffer;
  renderUniform: GPUBuffer;
  sampler: GPUSampler;
  textures: [FluidTexturePair, FluidTexturePair];
  computeBindGroups: [GPUBindGroup, GPUBindGroup];
  renderBindGroups: [GPUBindGroup, GPUBindGroup];
  typographyTexture: GPUTexture;
  typographyView: GPUTextureView;
  readIndex: 0 | 1;
  width: number;
  height: number;
  simWidth: number;
  simHeight: number;
  typographyWidth: number;
  typographyHeight: number;
  lastFrame: number;
  lastDraw: number;
  lastCapture: number;
  typographyKey: string;
};

interface WebGPUFluidCanvasProps {
  enabled?: boolean;
}

const TEXTURE_FORMAT: GPUTextureFormat = "rgba16float";
const TYPOGRAPHY_FORMAT: GPUTextureFormat = "rgba8unorm";
const COMPUTE_UNIFORM_BYTES = 64;
const RENDER_UNIFORM_BYTES = 32;
const TYPOGRAPHY_SOURCE_ID = "webgpu-typography-texture-source";
const FluidCanvas = dynamic(() => import("@/components/fluid/FluidCanvas"), {
  ssr: false,
  loading: () => <FluidFallback />,
});

export function supportsWebGPU() {
  if (typeof navigator === "undefined") return false;
  return Boolean((navigator as GPUCapableNavigator).gpu);
}

function FluidFallback() {
  return (
    <div
      data-fluid-canvas
      className="fluid-fallback pointer-events-none fixed inset-0 z-0"
    />
  );
}

function subscribeMounted() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function resolutionScaleFor(tier: "high" | "medium" | "low") {
  if (tier === "high") return 0.48;
  if (tier === "medium") return 0.34;
  return 0.24;
}

function createFluidTexturePair(
  device: GPUDevice,
  width: number,
  height: number,
): FluidTexturePair {
  const usage =
    GPUTextureUsage.TEXTURE_BINDING |
    GPUTextureUsage.STORAGE_BINDING |
    GPUTextureUsage.COPY_DST;
  const velocity = device.createTexture({
    size: [width, height],
    format: TEXTURE_FORMAT,
    usage,
  });
  const density = device.createTexture({
    size: [width, height],
    format: TEXTURE_FORMAT,
    usage,
  });

  return {
    velocity,
    density,
    velocityView: velocity.createView(),
    densityView: density.createView(),
  };
}

function createTypographyTexture(
  device: GPUDevice,
  width: number,
  height: number,
) {
  const texture = device.createTexture({
    size: [Math.max(1, width), Math.max(1, height)],
    format: TYPOGRAPHY_FORMAT,
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });
  return { texture, view: texture.createView() };
}

function destroyRuntime(runtime: WebGPURuntime | null) {
  if (!runtime) return;
  runtime.textures.forEach((pair) => {
    pair.velocity.destroy();
    pair.density.destroy();
  });
  runtime.typographyTexture.destroy();
  runtime.computeUniform.destroy();
  runtime.renderUniform.destroy();
}

function writeComputeUniform(runtime: WebGPURuntime, dt: number, time: number) {
  const state = useFluidStore.getState();
  const buffer = new ArrayBuffer(COMPUTE_UNIFORM_BYTES);
  const view = new DataView(buffer);

  view.setUint32(0, runtime.simWidth, true);
  view.setUint32(4, runtime.simHeight, true);
  view.setFloat32(8, dt, true);
  view.setFloat32(12, 0.986, true);
  view.setFloat32(16, 0.976, true);
  view.setFloat32(20, 0.18, true);
  view.setFloat32(24, state.isTouch ? 0.006 : 0.0038, true);
  view.setFloat32(28, 4200, true);
  view.setFloat32(32, state.scrollVelocity * 0.052, true);
  view.setFloat32(40, state.mouseX * 0.5 + 0.5, true);
  view.setFloat32(44, state.mouseY * 0.5 + 0.5, true);
  view.setFloat32(48, state.mouseDX, true);
  view.setFloat32(52, state.mouseDY, true);
  view.setFloat32(56, time, true);
  view.setFloat32(60, 0, true);

  runtime.device.queue.writeBuffer(runtime.computeUniform, 0, buffer);
}

function writeRenderUniform(runtime: WebGPURuntime, time: number) {
  const buffer = new ArrayBuffer(RENDER_UNIFORM_BYTES);
  const view = new DataView(buffer);
  view.setFloat32(0, runtime.width, true);
  view.setFloat32(4, runtime.height, true);
  view.setFloat32(8, 0.016, true);
  view.setFloat32(12, 0.85, true);
  view.setFloat32(16, time, true);
  view.setFloat32(20, 0, true);
  runtime.device.queue.writeBuffer(runtime.renderUniform, 0, buffer);
}

function makeFallbackTypographyCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f5f5f7";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(56, Math.floor(width / 8))}px JetBrains Mono, monospace`;
  ctx.fillText("EZZY", width / 2, height * 0.44);
  ctx.font = `500 ${Math.max(14, Math.floor(width / 48))}px JetBrains Mono, monospace`;
  ctx.fillText("AI SYSTEMS · IOS SOFTWARE · COGNITIVE SCIENCE", width / 2, height * 0.56);
  return canvas;
}

function makeBlankTypographyCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#050507";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

function ensureTypographySource(width: number, height: number) {
  let source = document.getElementById(TYPOGRAPHY_SOURCE_ID);
  if (!source) {
    source = document.createElement("div");
    source.id = TYPOGRAPHY_SOURCE_ID;
    source.setAttribute("aria-hidden", "true");
    document.body.appendChild(source);
  }

  const state = useFluidStore.getState();
  const project =
    state.activeProjectId !== null
      ? PROJECTS.find((item) => item.id === state.activeProjectId)
      : null;
  const progress = state.scrollProgress;
  const title =
    progress > 0.25 && progress < 0.75 && project ? project.title : HERO.name;
  const eyebrow =
    progress > 0.25 && progress < 0.75 && project
      ? project.category
      : HERO.role;
  const detail =
    progress > 0.25 && progress < 0.75 && project
      ? project.subtitle
      : HERO.thesis;

  source.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${width}px`,
    `height:${height}px`,
    "overflow:hidden",
    "pointer-events:none",
    "z-index:-1",
    "background:#050507",
    "color:#f5f5f7",
    "font-family:var(--font-mono), JetBrains Mono, Fira Code, monospace",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "text-align:center",
  ].join(";");

  source.innerHTML = `
    <div style="width:82%;max-width:1200px;">
      <div style="font-size:${Math.max(12, width * 0.016)}px;letter-spacing:0.28em;text-transform:uppercase;color:#86868b;margin-bottom:${Math.max(16, height * 0.03)}px;">${eyebrow}</div>
      <div style="font-size:${Math.max(64, width * 0.15)}px;line-height:0.82;font-weight:900;letter-spacing:0;color:#f5f5f7;text-shadow:0 0 42px rgba(245,245,247,0.22);">${title}</div>
      <div style="font-size:${Math.max(14, width * 0.024)}px;line-height:1.45;font-weight:500;color:#a8a8ad;margin:${Math.max(18, height * 0.035)}px auto 0;max-width:860px;">${detail}</div>
    </div>
  `;

  return source;
}

function currentTypographyKey() {
  const state = useFluidStore.getState();
  const activeProjectId = state.activeProjectId ?? "hero";
  const progressZone =
    state.scrollProgress > 0.25 && state.scrollProgress < 0.75
      ? "project"
      : "hero";
  return `${progressZone}:${activeProjectId}`;
}

async function captureTypographyCanvas(width: number, height: number) {
  const { toCanvas } = await import("html-to-image");
  const target = ensureTypographySource(width, height);
  const captured = await toCanvas(target, {
    width,
    height,
    pixelRatio: 1,
    backgroundColor: "#050507",
    cacheBust: false,
  });

  if (captured.width > 0 && captured.height > 0) return captured;
  return makeFallbackTypographyCanvas(width, height);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function uploadCanvasToTypography(runtime: WebGPURuntime, canvas: HTMLCanvasElement) {
  if (
    canvas.width !== runtime.typographyWidth ||
    canvas.height !== runtime.typographyHeight
  ) {
    runtime.typographyTexture.destroy();
    const next = createTypographyTexture(runtime.device, canvas.width, canvas.height);
    runtime.typographyTexture = next.texture;
    runtime.typographyView = next.view;
    runtime.typographyWidth = canvas.width;
    runtime.typographyHeight = canvas.height;
    rebuildBindGroups(runtime);
  }

  runtime.device.queue.copyExternalImageToTexture(
    { source: canvas },
    { texture: runtime.typographyTexture },
    [canvas.width, canvas.height],
  );
}

async function uploadTypography(runtime: WebGPURuntime) {
  const now = performance.now();
  if (now - runtime.lastCapture < 500) return;
  runtime.lastCapture = now;

  let canvas: HTMLCanvasElement;
  const key = currentTypographyKey();
  if (key.startsWith("hero:")) {
    uploadCanvasToTypography(
      runtime,
      makeBlankTypographyCanvas(runtime.width, runtime.height),
    );
    return;
  }

  try {
    canvas = await withTimeout(
      captureTypographyCanvas(runtime.width, runtime.height),
      900,
      "Typography capture timed out.",
    );
  } catch {
    canvas = makeFallbackTypographyCanvas(runtime.width, runtime.height);
  }

  uploadCanvasToTypography(runtime, canvas);
}

function rebuildBindGroups(runtime: WebGPURuntime) {
  const computeLayout = runtime.computePipeline.getBindGroupLayout(0);
  const renderLayout = runtime.renderPipeline.getBindGroupLayout(0);

  runtime.computeBindGroups = [0, 1].map((index) => {
    const read = runtime.textures[index as 0 | 1];
    const write = runtime.textures[(1 - index) as 0 | 1];
    return runtime.device.createBindGroup({
      layout: computeLayout,
      entries: [
        { binding: 0, resource: read.velocityView },
        { binding: 1, resource: read.densityView },
        { binding: 2, resource: write.velocityView },
        { binding: 3, resource: write.densityView },
        { binding: 4, resource: { buffer: runtime.computeUniform } },
      ],
    });
  }) as [GPUBindGroup, GPUBindGroup];

  runtime.renderBindGroups = [0, 1].map((index) => {
    const read = runtime.textures[index as 0 | 1];
    return runtime.device.createBindGroup({
      layout: renderLayout,
      entries: [
        { binding: 0, resource: read.velocityView },
        { binding: 1, resource: read.densityView },
        { binding: 2, resource: runtime.typographyView },
        { binding: 3, resource: runtime.sampler },
        { binding: 4, resource: { buffer: runtime.renderUniform } },
      ],
    });
  }) as [GPUBindGroup, GPUBindGroup];
}

async function createRuntime(canvas: HTMLCanvasElement): Promise<WebGPURuntime> {
  const gpu = (navigator as GPUCapableNavigator).gpu;
  if (!gpu) throw new Error("WebGPU is unavailable.");

  const adapter = await withTimeout(
    gpu.requestAdapter({ powerPreference: "high-performance" }),
    1800,
    "WebGPU adapter request timed out.",
  );
  if (!adapter) throw new Error("WebGPU adapter request failed.");

  const device = await withTimeout(
    adapter.requestDevice(),
    1800,
    "WebGPU device request timed out.",
  );
  const context = canvas.getContext("webgpu");
  if (!context) throw new Error("WebGPU canvas context is unavailable.");

  const canvasFormat = gpu.getPreferredCanvasFormat();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = Math.max(2, Math.floor(window.innerWidth * dpr));
  const height = Math.max(2, Math.floor(window.innerHeight * dpr));
  const gpuTier = useFluidStore.getState().gpuTier;
  const scale = resolutionScaleFor(gpuTier);
  const simWidth = Math.max(64, Math.floor(width * scale));
  const simHeight = Math.max(64, Math.floor(height * scale));

  canvas.width = width;
  canvas.height = height;
  context.configure({
    device,
    format: canvasFormat,
    alphaMode: "opaque",
  });

  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module: device.createShaderModule({ code: fluidComputeWGSL }),
      entryPoint: "main",
    },
  });

  const renderPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: textDisplaceWGSL }),
      entryPoint: "vertexMain",
    },
    fragment: {
      module: device.createShaderModule({ code: textDisplaceWGSL }),
      entryPoint: "fragmentMain",
      targets: [{ format: canvasFormat }],
    },
    primitive: { topology: "triangle-list" },
  });

  const computeUniform = device.createBuffer({
    size: COMPUTE_UNIFORM_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const renderUniform = device.createBuffer({
    size: RENDER_UNIFORM_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });
  const textures: [FluidTexturePair, FluidTexturePair] = [
    createFluidTexturePair(device, simWidth, simHeight),
    createFluidTexturePair(device, simWidth, simHeight),
  ];
  const typography = createTypographyTexture(device, width, height);

  const runtime: WebGPURuntime = {
    adapter,
    device,
    context,
    canvasFormat,
    computePipeline,
    renderPipeline,
    computeUniform,
    renderUniform,
    sampler,
    textures,
    computeBindGroups: [] as unknown as [GPUBindGroup, GPUBindGroup],
    renderBindGroups: [] as unknown as [GPUBindGroup, GPUBindGroup],
    typographyTexture: typography.texture,
    typographyView: typography.view,
    readIndex: 0,
    width,
    height,
    simWidth,
    simHeight,
    typographyWidth: width,
    typographyHeight: height,
    lastFrame: performance.now(),
    lastDraw: 0,
    lastCapture: 0,
    typographyKey: currentTypographyKey(),
  };

  rebuildBindGroups(runtime);
  uploadCanvasToTypography(runtime, makeBlankTypographyCanvas(width, height));
  return runtime;
}

function renderFrame(runtime: WebGPURuntime, now: number) {
  const dt = Math.min(0.033, Math.max(0.001, (now - runtime.lastFrame) / 1000));
  runtime.lastFrame = now;
  const time = now / 1000;

  writeComputeUniform(runtime, dt, time);
  writeRenderUniform(runtime, time);

  const encoder = runtime.device.createCommandEncoder();
  const compute = encoder.beginComputePass();
  compute.setPipeline(runtime.computePipeline);
  compute.setBindGroup(0, runtime.computeBindGroups[runtime.readIndex]);
  compute.dispatchWorkgroups(
    Math.ceil(runtime.simWidth / 8),
    Math.ceil(runtime.simHeight / 8),
  );
  compute.end();

  runtime.readIndex = (1 - runtime.readIndex) as 0 | 1;

  const render = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: runtime.context.getCurrentTexture().createView(),
        clearValue: { r: 0.005, g: 0.005, b: 0.008, a: 1 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });
  render.setPipeline(runtime.renderPipeline);
  render.setBindGroup(0, runtime.renderBindGroups[runtime.readIndex]);
  render.draw(3);
  render.end();

  runtime.device.queue.submit([encoder.finish()]);
}

function shouldUseWebGPU({
  enabled,
  mounted,
  reducedMotion,
  renderMode,
  isTouch,
  gpuTier,
}: {
  enabled: boolean;
  mounted: boolean;
  reducedMotion: boolean;
  renderMode: "webgl" | "fallback";
  isTouch: boolean;
  gpuTier: "high" | "medium" | "low";
}) {
  return (
    mounted &&
    enabled &&
    !reducedMotion &&
    renderMode === "webgl" &&
    !isTouch &&
    gpuTier === "high" &&
    supportsWebGPU()
  );
}

/**
 * Production WebGPU fluid renderer. It owns a real WebGPU compute pass for the
 * velocity/density field and a render pass that displaces a DOM typography
 * texture captured with html-to-image. If any WebGPU step fails, it falls back
 * to the existing R3F/WebGL2 fluid renderer.
 */
export default function WebGPUFluidCanvas({
  enabled = true,
}: WebGPUFluidCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<WebGPURuntime | null>(null);
  const frameRef = useRef(0);
  const captureQueuedRef = useRef(false);
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [forcedFallback, setForcedFallback] = useState(false);
  const gpuTier = useFluidStore((s) => s.gpuTier);
  const renderMode = useFluidStore((s) => s.renderMode);
  const reducedMotion = useFluidStore((s) => s.reducedMotion);
  const isTouch = useFluidStore((s) => s.isTouch);

  const useWebGPU = shouldUseWebGPU({
    enabled,
    mounted,
    reducedMotion,
    renderMode,
    isTouch,
    gpuTier,
  });

  useEffect(() => {
    if (!useWebGPU) return;

    let cancelled = false;

    const queueTypographyUpload = (runtime: WebGPURuntime, force = false) => {
      if (captureQueuedRef.current) return;
      const key = currentTypographyKey();
      if (!force && key === runtime.typographyKey) return;
      runtime.typographyKey = key;
      captureQueuedRef.current = true;
      void uploadTypography(runtime).finally(() => {
        captureQueuedRef.current = false;
      });
    };

    const startLoop = () => {
      const minFrameMs = 1000 / 45;
      const loop = (now: number) => {
        const current = runtimeRef.current;
        if (!current) return;

        if (!document.hidden && now - current.lastDraw >= minFrameMs) {
          current.lastDraw = now;
          renderFrame(current, now);
          queueTypographyUpload(current);
        }

        frameRef.current = requestAnimationFrame(loop);
      };

      frameRef.current = requestAnimationFrame(loop);
    };

    async function boot() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        const runtime = await createRuntime(canvas);
        if (cancelled) {
          destroyRuntime(runtime);
          return;
        }
        runtimeRef.current = runtime;
        document.documentElement.dataset.webgpuFluid = "active";
        queueTypographyUpload(runtime, true);
        startLoop();
      } catch (error) {
        console.warn("WebGPU fluid failed; falling back to WebGL2.", error);
        if (!cancelled) setForcedFallback(true);
      }
    }

    const onResize = () => {
      const canvas = canvasRef.current;
      const old = runtimeRef.current;
      if (!canvas || !old) return;
      cancelAnimationFrame(frameRef.current);
      destroyRuntime(old);
      runtimeRef.current = null;
      void createRuntime(canvas)
        .then((runtime) => {
          if (cancelled) {
            destroyRuntime(runtime);
            return;
          }
          runtimeRef.current = runtime;
          queueTypographyUpload(runtime, true);
          startLoop();
        })
        .catch(() => {
          if (!cancelled) setForcedFallback(true);
        });
    };

    void boot();
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameRef.current);
      destroyRuntime(runtimeRef.current);
      runtimeRef.current = null;
      if (document.documentElement.dataset.webgpuFluid === "active") {
        delete document.documentElement.dataset.webgpuFluid;
      }
      document.getElementById(TYPOGRAPHY_SOURCE_ID)?.remove();
    };
  }, [useWebGPU]);

  if (!mounted) return null;
  if (!enabled) return null;
  if (forcedFallback) return <FluidCanvas />;
  if (!useWebGPU) {
    if (renderMode === "fallback" || reducedMotion || isTouch || gpuTier === "low") {
      return <FluidFallback />;
    }
    return <FluidCanvas />;
  }

  return (
    <canvas
      ref={canvasRef}
      data-fluid-canvas
      data-renderer="webgpu"
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
