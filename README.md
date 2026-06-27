# Ezzy Rappeport — Kinetic Fluid Canvas

A cinematic developer portfolio built as a real-time fluid interface. The site tells Ezzy's story through five scroll-linked acts, a WebGL liquid-metal shader, case-study islands, a terminal contact flow, and a DevTools easter egg for the engineers and recruiters curious enough to open the console.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-149eca?style=for-the-badge)
![Three.js](https://img.shields.io/badge/Three.js-R3F-f5f5f7?style=for-the-badge&labelColor=050507)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge)
![GSAP](https://img.shields.io/badge/GSAP-3-88ce02?style=for-the-badge)

## Experience

The portfolio is structured like an operating system booting into a liquid interface:

- **EzzyOS boot loader**: a fullscreen terminal boot sequence powered by Drei loader progress and a GSAP digital dissolve.
- **Kinetic fluid canvas**: a WebGL2 ping-pong FBO simulation that responds to pointer movement, scroll velocity, and active project accents.
- **Five scroll acts**: identity, current, project islands, core system, and a terminal contact surface.
- **Case studies**: MonkeyClaw, FlowE, and Argyph, each with its own color system, interaction model, and technical story.
- **Console CLI easter egg**: open DevTools and run `run('help')` to explore hidden recruiter/engineer commands.

## Tech Stack

| Layer | Tools |
| --- | --- |
| App | Next.js 16, React 19, TypeScript |
| Rendering | Three.js, React Three Fiber, Drei |
| Motion | GSAP, Framer Motion, Lenis |
| Styling | Tailwind CSS 4, CSS modules, custom CSS variables |
| State | Zustand |
| Contact | Next API route, Prisma schema |
| Future GPU path | WebGPU, WGSL compute shaders |

## Local Development

```bash
bun install
bun run dev
```

The dev server runs on [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
bun run lint
bun run build
bun run start
bun run db:generate
bun run db:push
```

## Repo Map

```text
src/
  app/                  Next.js app routes, global CSS, API routes
  components/
    acts/               Five scroll-linked portfolio acts
    casestudies/        MonkeyClaw, FlowE, Argyph deep dives
    fluid/              WebGL fluid renderer and WebGPU architecture shell
    preloader/          EzzyOS boot loader
    cursor/ nav/ audio/ Experience chrome
  hooks/                Lenis, mouse tracking, console easter egg
  lib/                  Content, store, utilities, database helpers
docs/
  WEBGPU_FLUID_ARCHITECTURE.md
public/
  Ezzy-Rappeport-Resume.docx
prisma/
  schema.prisma
```

## Boot Loader

`src/components/preloader/BootLoader.tsx` renders a fixed `z-index: 9999` terminal overlay on `#050507`. It receives a `progress` prop from Drei's `useProgress()` bridge, appends Linux-style boot messages every ~140ms, auto-scrolls to the latest line, and exits with GSAP:

```ts
opacity: 0
filter: "blur(20px)"
scale: 1.05
duration: 0.8
ease: "power2.inOut"
```

The existing site remains scroll-locked until the animation completes and the Zustand `isLoaded` flag flips.

## Fluid Renderer

The live renderer is `src/components/fluid/FluidSimulation.tsx`:

- stores velocity and ink in half-float render targets,
- runs advection and splat passes offscreen,
- composites an iridescent full-screen display shader,
- responds to scroll progress, pointer velocity, and project accent colors.

The WebGPU migration plan lives in `docs/WEBGPU_FLUID_ARCHITECTURE.md`, with WGSL in `src/components/fluid/webgpu/webgpuFluidShaders.ts`.

## DevTools CLI

Open the browser console and run:

```js
run("help")
run("hire")
run("monkeyclaw")
run("flowe")
run("clear")
```

The CLI prints an EzzyOS banner, exposes the resume URL, scrolls to contact, prints the MonkeyClaw security loop, and temporarily tints the fluid canvas FlowE blue.

## Content Highlights

- **MonkeyClaw**: 1st place NVIDIA x ASUS Hackathon multi-agent AI security system.
- **FlowE**: solo-built 300K+ line iOS student productivity app.
- **Argyph**: local-first Rust MCP server for AI coding agents.

## Deployment

The project is configured for standalone Next output:

```bash
bun run build
bun run start
```

Before deploying, run lint and build locally. The WebGL fallback path should remain enabled for browsers without WebGPU support or for users with reduced motion enabled.
