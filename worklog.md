# Worklog — The Kinetic Fluid Canvas

---
Task ID: 1
Agent: main (Z.ai Code orchestrator)
Task: Build the complete "Kinetic Fluid Canvas" portfolio — a real-time WebGL fluid simulation with 4 scroll-actuated "Acts", custom cursor, progress nav, audio toggle, and full fallbacks.

Work Log:
- Installed: three, @react-three/fiber, @react-three/drei, gsap, lenis, @types/three.
- Set up dark fluid design tokens in globals.css (abyss #030303, liquid metal, iridescent violet→cyan, Apple white/gray) + Space Grotesk variable font in layout.
- Built global zustand store (`src/lib/store.ts`) tracking scroll progress/velocity, pointer, gpu-tier, render-mode, reduced-motion, audio, active-project.
- Built device-capability hook (`useDeviceCapabilities`) with GPU benchmarking → tier (high/medium/low) + renderMode (webgl/fallback) + reduced-motion/touch detection, written to store.
- Built the GLSL fluid sim (`fluidShaders.ts` + `FluidSimulation.tsx`): ping-pong FBO packing velocity(RG)+ink(B) in HalfFloat render targets; semi-Lagrangian advection + mouse splat forces + scroll-driven upward current + iridescent display pass (violet→cyan by velocity, caustics, streaks, Act1 parting, Act3 sphere SDF gather, Act3 glass, Act4 void + bioluminescent specks). Display mesh lives in R3F's scene (R3F composites it); offscreen scene runs the sim passes.
- Built `FluidCanvas` R3F wrapper with `preserveDrawingBuffer` (so previews/screenshots capture the canvas), DPR clamping, and a CSS-only liquid-gradient fallback for low-end/touch/reduced-motion.
- Built Lenis smooth scroll (`useLenisScroll`) tied to GSAP ticker + ScrollTrigger, streaming progress+velocity to the store; reduced-motion path uses native scroll. Singleton lenis accessor (`src/lib/lenis.ts`) for the Act-4 implosion reset.
- Mouse tracker (`useMouseTracker`) streams normalized position + per-frame delta.
- Four Acts:
  - Act 1 Genesis: hero name "ALEX RIVERA" revealed via clip-path curtain synced to the fluid's horizontal parting.
  - Act 2 Current: philosophical statements crossfade; typography uses velocity-driven CSS vars (--font-stretch / --font-weight) so fast scroll = condensed+bold, rest = relaxed+light.
  - Act 3 Islands: central clickable sphere (fluid gathers via SDF); click expands a glass case-study overlay (title, summary, tech-stack pills, View Live link) and flips the fluid to glass mode; pointer-events gated on act visibility.
  - Act 4 Abyss: "LET'S BUILD" + magnetic-snap email button; click copies email, spikes fluid velocity (implosion), then smooth-scrolls back to top.
- UI chrome: CustomCursor (3 states — default 12px difference-blend, fluid 80px blur orb, link 4px dot + label) hidden on touch/reduced-motion; ProgressNav (right-side liquid-metal rail with section tooltips + click-to-jump); AudioToggle (Web Audio 60Hz sine rumble, gain modulated by fluid scroll velocity, EQ bars); Preloader (vortex + staged messages).
- Fallbacks: mobile/low-GPU → CSS gradient fluid; reduced-motion → native scroll + static blocks; GPU tiering → sim resolution scale 0.5/0.35/0.25.

Debugging highlights:
- Lint: refactored away from useMemo (react-hooks/immutability on uniform mutation) and useState-in-effect; moved three.js objects into a mount effect with refs.
- Canvas was black on first verification: root causes were (a) `-z-10` hid the background behind the body bg, (b) R3F's own render loop overwrote a manual `gl.render(scene,camera)` to the default framebuffer — fixed by moving the display mesh into R3F's scene, (c) `preserveDrawingBuffer:false` prevented screenshot/readback capture — enabled it. Also boosted the display shader's baseline iridescent ambient so the fluid is vivid at rest.

Stage Summary:
- Lint clean; dev server healthy (200s, no errors); all four Acts verified end-to-end via Agent Browser + VLM (fluid renders violet/cyan, hero reveals, statements cycle, sphere→case-study opens, LET'S BUILD + email implosion resets scroll, mobile layout clean, cursor/nav/audio present).
- Artifacts: `src/components/fluid/*`, `src/components/acts/Act{1,2,3,4}.tsx`, `src/components/{cursor,nav,audio,preloader}/*`, `src/hooks/{useDeviceCapabilities,useMouseTracker,useLenisScroll}.ts`, `src/lib/{store,lenis,content}.ts`, `src/components/Portfolio.tsx`.
- Content is demo data (`src/lib/content.ts`) — user can swap in real name/projects/email later.
