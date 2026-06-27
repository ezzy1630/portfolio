"use client";

/**
 * Argyph Case Study — Act 3 Execution Island #03
 *
 * Local-First MCP Server for AI Coding Agents (Rust).
 * - 3D "The Living Protocol" dendritic network scene
 * - Recursive branching growth animation (~5s)
 * - Pulsing golden core with nested wireframe icosahedra
 * - Data particles + inward/outward flow
 * - Pulse rings + bloom + scan line + HUD overlays
 *
 * Accent: #FF9F0A (Rust orange).
 */

import { CSSProperties, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Box,
  Code,
  Cpu,
  GitBranch,
  Network,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ARGYPH_STATS, PROJECTS } from "@/lib/content";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const project = PROJECTS[2];
const ACCENT = project.accent.hex;
const GOLD = 0xc9943e;
const GOLD_BRIGHT = 0xffd700;

interface Branch {
  start: THREE.Vector3;
  end: THREE.Vector3;
  depth: number;
}

interface NodePoint {
  pos: THREE.Vector3;
  depth: number;
  isLeaf: boolean;
  bIdx: number;
}

interface Particle {
  bIdx: number;
  t: number;
  spd: number;
  dir: 1 | -1;
}

interface Ring {
  mesh: THREE.Mesh;
  phase: number;
  speed: number;
}

const title = "ARGYPH";

function seededRandom(seed = 42) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export default function ArgyphCaseStudy() {
  return (
    <div className="case-study-content p-5 sm:p-6 md:p-10" style={{ "--accent": ACCENT } as CSSProperties}>
      <div className="space-y-12">
        {/* ───────────── HEADER ───────────── */}
        <header className="space-y-4">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <span className="font-ui text-[var(--accent)]">/ {project.index}</span>
            <Badge
              variant="outline"
              className="max-w-full whitespace-normal text-left font-ui leading-relaxed border-[rgba(255,159,10,0.4)] bg-[rgba(255,159,10,0.08)] text-[var(--text-primary)]"
            >
              <Box className="h-3 w-3 text-[var(--accent)]" />
              {project.badge}
            </Badge>
          </div>
          <h2
            className="font-h2 !text-[clamp(2.5rem,7vw,5rem)] text-[var(--text-primary)]"
            style={{ textShadow: `0 0 48px ${ACCENT}33` }}
          >
            Argyph
          </h2>
          <p className="font-body text-[var(--text-secondary)] max-w-2xl">{project.summary}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-ui text-[var(--text-secondary)]">
            <span>{project.category}</span>
            <span aria-hidden>·</span>
            <span>{project.year}</span>
            <span aria-hidden>·</span>
            <span>Rust · tree-sitter · MCP</span>
          </div>
        </header>

        <Separator className="bg-[rgba(255,159,10,0.15)]" />

        {/* ───────────── THE LIVING PROTOCOL VISUAL ───────────── */}
        <section className="space-y-5">
          <SectionLabel icon={Network} label="The Living Protocol" />
          <LivingProtocolCanvas />
        </section>

        {/* ───────────── HOW IT WORKS ───────────── */}
        <section className="space-y-5">
          <SectionLabel icon={Network} label="How It Works" />
          <div className="grid md:grid-cols-3 gap-3">
            {[
              {
                step: "01",
                icon: GitBranch,
                title: "Tree-Sitter Symbol Graph",
                detail:
                  "Parse any language into a typed AST. Extract symbols, scopes, and call edges into a queryable graph.",
              },
              {
                step: "02",
                icon: Box,
                title: "Hybrid BM25 + Vector",
                detail:
                  "Lexical BM25 catches exact identifiers; a bundled local embedder captures semantic intent. Rerank by distance.",
              },
              {
                step: "03",
                icon: Zap,
                title: "MCP Serves Context",
                detail:
                  "Expose the graph over the Model Context Protocol. AI coding agents pull structured, scoped context on demand.",
              },
            ].map(({ step, icon: Icon, title, detail }, i) => (
              <div key={step} className="flex items-stretch gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex-1 rounded-xl p-5 border border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.5)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="font-mono text-2xl font-bold"
                      style={{ color: ACCENT }}
                    >
                      {step}
                    </span>
                    <Icon className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                  <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">{title}</div>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{detail}</p>
                </motion.div>

                {i < 2 && (
                  <div
                    className="hidden md:flex items-center justify-center shrink-0"
                    aria-hidden
                  >
                    <ArrowRight className="h-4 w-4" style={{ color: ACCENT }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ───────────── STATS GRID ───────────── */}
        <section className="space-y-5">
          <SectionLabel icon={Cpu} label="Local-First by Design" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ARGYPH_STATS.map((stat) => {
              const highlight =
                stat.value === "0" || stat.label === "Cloud" || stat.label === "API Keys";
              return (
                <div
                  key={stat.label}
                  className="rounded-xl p-4 border bg-[rgba(10,10,15,0.5)]"
                  style={{
                    borderColor: highlight ? `${ACCENT}40` : "rgba(255,255,255,0.06)",
                    boxShadow: highlight ? `0 0 18px ${ACCENT}14` : "none",
                  }}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="font-mono text-3xl md:text-4xl font-bold"
                      style={{ color: highlight ? ACCENT : "var(--text-primary)" }}
                    >
                      {stat.value}
                    </span>
                    {stat.unit && (
                      <span className="font-ui text-[10px] text-[var(--text-secondary)]">{stat.unit}</span>
                    )}
                  </div>
                  <div className="font-ui text-[10px] text-[var(--text-secondary)] mt-2">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ───────────── TECH STACK ───────────── */}
        <section className="space-y-4 pb-4">
          <SectionLabel icon={Code} label="Tech Stack" />
          <div className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <span
                key={s}
                className="rounded-full px-3 py-1.5 font-ui text-[var(--text-primary)] text-[11px]"
                style={{ background: `${ACCENT}0c`, border: `1px solid ${ACCENT}33` }}
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ───────────── The Living Protocol scene ───────────── */

function LivingProtocolCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const container = mount;

    const rand = seededRandom(42);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060610, 0.022);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 120);
    camera.position.set(0, 1.8, 10);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    renderer.setClearColor(0x060610, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.setAnimationLoop(null);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      1.45,
      0.55,
      0.16,
    );
    composer.addPass(bloom);

    const mouse = { x: 0, y: 0 };
    let bloomTarget = 1.45;

    const branches: Branch[] = [];
    const nodes: NodePoint[] = [];

    function grow(origin: THREE.Vector3, dir: THREE.Vector3, len: number, depth: number, maxDepth: number) {
      if (depth > maxDepth || len < 0.035) return;
      const direction = dir.clone().normalize();
      const end = origin.clone().add(direction.clone().multiplyScalar(len));
      const index = branches.length;
      branches.push({ start: origin.clone(), end: end.clone(), depth });
      const isLeaf = depth >= maxDepth - 1 || len * 0.5 < 0.05;
      nodes.push({ pos: end.clone(), depth, isLeaf, bIdx: index });

      if (isLeaf) return;

      const n = depth === 0 ? 5 : rand() > 0.5 ? 3 : 2;
      const base = rand() * Math.PI * 2;
      for (let i = 0; i < n; i++) {
        const next = direction.clone();
        const up = Math.abs(direction.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        const axis = new THREE.Vector3().crossVectors(direction, up).normalize();
        const phi = base + (Math.PI * 2) / n * i + (rand() - 0.5) * 0.45;
        axis.applyAxisAngle(direction, phi);
        const spread = 0.32 + rand() * 0.52;
        next.add(axis.multiplyScalar(spread * 0.5));
        next.x += (rand() - 0.5) * 0.08;
        next.y += (rand() - 0.5) * 0.08;
        next.z += (rand() - 0.5) * 0.08;
        next.normalize();
        grow(end, next, len * (0.52 + rand() * 0.16), depth + 1, maxDepth);
      }
    }

    const mainDirs = [
      new THREE.Vector3(0.12, 1, 0.08),
      new THREE.Vector3(0.92, 0.35, 0.22),
      new THREE.Vector3(-0.78, 0.52, -0.38),
      new THREE.Vector3(0.38, 0.12, 0.88),
      new THREE.Vector3(-0.48, -0.18, -0.82),
      new THREE.Vector3(-0.88, 0.12, 0.32),
    ];

    for (const dir of mainDirs) {
      grow(new THREE.Vector3(0, 0, 0), dir.normalize(), 1.65 + rand() * 0.45, 0, 5);
    }

    const branchGeo = new THREE.BufferGeometry();
    const branchPos = new Float32Array(branches.length * 6);
    const branchCol = new Float32Array(branches.length * 6);

    for (let i = 0; i < branches.length; i++) {
      const b = branches[i];
      branchPos[i * 6] = b.start.x;
      branchPos[i * 6 + 1] = b.start.y;
      branchPos[i * 6 + 2] = b.start.z;
      branchPos[i * 6 + 3] = b.start.x;
      branchPos[i * 6 + 4] = b.start.y;
      branchPos[i * 6 + 5] = b.start.z;

      const br = Math.max(0.25, 1 - b.depth * 0.14);
      branchCol[i * 6] = br * 0.88;
      branchCol[i * 6 + 1] = br * 0.62;
      branchCol[i * 6 + 2] = br * 0.22;
      branchCol[i * 6 + 3] = br * 0.78;
      branchCol[i * 6 + 4] = br * 0.54;
      branchCol[i * 6 + 5] = br * 0.18;
    }

    branchGeo.setAttribute("position", new THREE.BufferAttribute(branchPos, 3));
    branchGeo.setAttribute("color", new THREE.BufferAttribute(branchCol, 3));

    const branchMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const branchMesh = new THREE.LineSegments(branchGeo, branchMat);
    scene.add(branchMesh);

    const nodeGeo = new THREE.SphereGeometry(0.055, 8, 6);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: GOLD_BRIGHT,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const nodeMesh = new THREE.InstancedMesh(nodeGeo, nodeMat, nodes.length);
    const nodeDummy = new THREE.Object3D();
    for (let i = 0; i < nodes.length; i++) {
      nodeDummy.position.set(0, -200, 0);
      nodeDummy.scale.setScalar(0);
      nodeDummy.updateMatrix();
      nodeMesh.setMatrixAt(i, nodeDummy.matrix);
    }
    nodeMesh.instanceMatrix.needsUpdate = true;
    scene.add(nodeMesh);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const coreInner = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 32, 32),
      new THREE.MeshBasicMaterial({ color: GOLD_BRIGHT, transparent: true, opacity: 0.55 }),
    );

    const coreOuter = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55, 1),
      new THREE.MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.2 }),
    );

    const coreOuter2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.8, 0),
      new THREE.MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.08 }),
    );

    const coreLight = new THREE.PointLight(GOLD, 4, 18);

    coreGroup.add(coreInner);
    coreGroup.add(coreOuter);
    coreGroup.add(coreOuter2);
    coreGroup.add(coreLight);

    const pulseRings: Ring[] = [];
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.TorusGeometry(0.55, 0.008, 12, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(ringGeo, ringMat);
      mesh.rotation.x = Math.PI / 2 + (rand() - 0.5) * 0.6;
      mesh.rotation.y = rand() * Math.PI;
      scene.add(mesh);
      pulseRings.push({ mesh, phase: i / 4, speed: 0.2 + rand() * 0.12 });
    }

    const particleCount = reducedMotion ? 90 : 160;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleCol = new Float32Array(particleCount * 3);
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleCol, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const particles = new Array<Particle>(particleCount);
    for (let i = 0; i < particleCount; i++) {
      particles[i] = {
        bIdx: Math.floor(rand() * branches.length),
        t: rand(),
        spd: 0.14 + rand() * 0.45,
        dir: rand() < 0.7 ? 1 : -1,
      };
    }
    const particleSys = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSys);

    const starCount = reducedMotion ? 240 : 520;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 50;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starSys = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0x555577,
        size: 0.035,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    );
    scene.add(starSys);
    scene.add(new THREE.AmbientLight(0x111122, 0.25));

    const clock = new THREE.Clock();
    let running = true;
    let raf = 0;

    function onPointerMove(event: PointerEvent) {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouse.x = (event.clientX / rect.width - 0.5) * 2;
      mouse.y = (event.clientY / rect.height - 0.5) * 2;
    }

    function onClick() {
      bloomTarget = 3.6;
    }

    function setSize() {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      bloom.resolution.set(width, height);
    }

    function resizeObserver() {
      setSize();
    }

    function tick() {
      if (!running) return;
      raf = requestAnimationFrame(tick);

      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();
      const growth = Math.min(1, elapsed / 5);

      camera.position.x += (mouse.x * 2.6 - camera.position.x) * 0.035;
      camera.position.y += (1.85 - mouse.y * 1.2 - camera.position.y) * 0.035;
      camera.lookAt(0, 0.25, 0);

      bloom.strength += (bloomTarget - bloom.strength) * 0.04;
      bloomTarget += (1.45 - bloomTarget) * 0.015;

      const pos = branchGeo.getAttribute("position").array as Float32Array;
      const col = branchGeo.getAttribute("color").array as Float32Array;

      for (let i = 0; i < branches.length; i++) {
        const branch = branches[i];
        const segment = Math.min(1, Math.max(0, (growth - branch.depth * 0.16) / 0.86));

        pos[i * 6] = branch.start.x;
        pos[i * 6 + 1] = branch.start.y;
        pos[i * 6 + 2] = branch.start.z;
        pos[i * 6 + 3] = branch.start.x + (branch.end.x - branch.start.x) * segment;
        pos[i * 6 + 4] = branch.start.y + (branch.end.y - branch.start.y) * segment;
        pos[i * 6 + 5] = branch.start.z + (branch.end.z - branch.start.z) * segment;

        const shimmer = reducedMotion ? 0.88 : 0.82 + Math.sin(elapsed * 1.8 + i * 0.4) * 0.18;
        const brightness = Math.max(0.15, (1 - branch.depth * 0.13) * shimmer) * segment;
        col[i * 6] = brightness * 0.88;
        col[i * 6 + 1] = brightness * 0.62;
        col[i * 6 + 2] = brightness * 0.22;
        col[i * 6 + 3] = brightness * 0.78;
        col[i * 6 + 4] = brightness * 0.54;
        col[i * 6 + 5] = brightness * 0.18;
      }

      branchGeo.attributes.position.needsUpdate = true;
      branchGeo.attributes.color.needsUpdate = true;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const branch = branches[node.bIdx];
        const g = Math.min(1, Math.max(0, (growth - branch.depth * 0.16) / 0.86));

        if (g > 0.85) {
          nodeDummy.position.copy(node.pos);
          const scale = (node.isLeaf ? 1.55 : 1.0) * Math.min(1, (g - 0.85) / 0.15);
          nodeDummy.scale.setScalar(scale * 0.55);
        } else {
          nodeDummy.position.set(0, -200, 0);
          nodeDummy.scale.setScalar(0);
        }

        nodeDummy.updateMatrix();
        nodeMesh.setMatrixAt(i, nodeDummy.matrix);
      }

      nodeMesh.instanceMatrix.needsUpdate = true;

      const corePulse = 1 + Math.sin(elapsed * 2.0) * 0.08;
      coreInner.scale.setScalar(corePulse);
      (coreInner.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(elapsed * 2) * 0.12;
      coreOuter.rotation.x = elapsed * 0.12;
      coreOuter.rotation.y = elapsed * 0.08;
      coreOuter2.rotation.x = -elapsed * 0.07;
      coreOuter2.rotation.z = elapsed * 0.05;
      coreLight.intensity = 3.5 + Math.sin(elapsed * 3) * 1.5;

      if (!reducedMotion) {
        for (const ring of pulseRings) {
          const cycle = (elapsed * ring.speed + ring.phase) % 1;
          ring.mesh.scale.setScalar(1 + cycle * 7);
          (ring.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.18 * (1 - cycle));
        }
      }

      if (!reducedMotion) {
        starSys.rotation.y = elapsed * 0.006;
      }

      const pPos = particleGeo.getAttribute("position").array as Float32Array;
      const pCol = particleGeo.getAttribute("color").array as Float32Array;
      if (!reducedMotion) {
        for (let i = 0; i < particleCount; i++) {
          const p = particles[i];
          const branch = branches[p.bIdx];
          const branchGrowth = Math.min(1, Math.max(0, (growth - branch.depth * 0.16) / 0.86));

          if (branchGrowth < 0.35) {
            pPos[i * 3 + 1] = -200;
            continue;
          }

          p.t += p.spd * p.dir * delta * 0.007;
          if (p.t > 1) {
            p.t = 0;
            p.bIdx = Math.floor(rand() * branches.length);
          }
          if (p.t < 0) {
            p.t = 1;
            p.bIdx = Math.floor(rand() * branches.length);
          }

          const pt = Math.min(branchGrowth, Math.max(0, p.t));
          pPos[i * 3] = branch.start.x + (branch.end.x - branch.start.x) * pt;
          pPos[i * 3 + 1] = branch.start.y + (branch.end.y - branch.start.y) * pt;
          pPos[i * 3 + 2] = branch.start.z + (branch.end.z - branch.start.z) * pt;

          const bright = 0.5 + (1 - pt) * 0.5;
          pCol[i * 3] = bright;
          pCol[i * 3 + 1] = bright * 0.72;
          pCol[i * 3 + 2] = bright * 0.22;
        }
        particleGeo.attributes.position.needsUpdate = true;
        particleGeo.attributes.color.needsUpdate = true;
      } else {
        for (let i = 0; i < particleCount; i++) {
          pPos[i * 3 + 1] = -200;
        }
      }

      if (!reducedMotion) {
        particleGeo.attributes.position.needsUpdate = true;
        particleGeo.attributes.color.needsUpdate = true;
      }

      composer.render();
    }

    const observer = new ResizeObserver(resizeObserver);
    observer.observe(container);
    setSize();
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerdown", onClick);
    tick();

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);

      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onClick);
      observer.disconnect();

      nodeMesh.geometry.dispose();
      nodeMat.dispose();
      branchGeo.dispose();
      branchMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      starSys.geometry.dispose();
      starSys.material.dispose();
      coreInner.geometry.dispose();
      coreOuter.geometry.dispose();
      coreOuter2.geometry.dispose();
      coreInner.material.dispose();
      (coreOuter.material as THREE.Material).dispose();
      (coreOuter2.material as THREE.Material).dispose();
      for (const ring of pulseRings) {
        ring.mesh.geometry.dispose();
        (ring.mesh.material as THREE.Material).dispose();
      }
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-[460px] w-full overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#060610]" style={{ touchAction: "none" }}>
      <div
        ref={mountRef}
        className="absolute inset-0"
        style={{ cursor: "crosshair", isolation: "isolate" }}
      />

      <motion.div
        className="pointer-events-none absolute left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, rgba(201,148,62,0.12) 35%, rgba(201,148,62,0.28) 50%, rgba(201,148,62,0.12) 65%, transparent 95%)",
          opacity: 0,
          zIndex: 30,
          top: 0,
        }}
        animate={{ y: ["-2%", "102%"], opacity: [0, 1, 0] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />

      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-start justify-between text-[9px] uppercase tracking-[0.5em] text-[rgba(255,255,255,0.35)]">
        <span>Developer Tools</span>
        <span>Rust</span>
      </div>

      <div className="pointer-events-none absolute left-4 top-4 flex h-4 w-4 items-start border-t border-l border-[rgba(201,148,62,0.3)]" />
      <div className="pointer-events-none absolute right-4 top-4 flex h-4 w-4 items-start justify-end border-t border-r border-[rgba(201,148,62,0.3)]" />
      <div className="pointer-events-none absolute left-4 bottom-4 flex h-4 w-4 items-end border-b border-l border-[rgba(201,148,62,0.3)]" />
      <div className="pointer-events-none absolute right-4 bottom-4 flex h-4 w-4 items-end justify-end border-b border-r border-[rgba(201,148,62,0.3)]" />

      <div className="pointer-events-none absolute inset-x-5 top-5 h-px bg-gradient-to-r from-transparent via-[rgba(201,148,62,0.12)] to-transparent" />
      <div className="pointer-events-none absolute inset-x-5 bottom-5 h-px bg-gradient-to-r from-transparent via-[rgba(201,148,62,0.12)] to-transparent" />
      <div className="pointer-events-none absolute left-5 inset-y-5 w-px bg-gradient-to-b from-transparent via-[rgba(201,148,62,0.12)] to-transparent" />
      <div className="pointer-events-none absolute right-5 inset-y-5 w-px bg-gradient-to-b from-transparent via-[rgba(201,148,62,0.12)] to-transparent" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center">
        <h3 className="font-h2 text-[clamp(2.8rem,12vw,5.5rem)] uppercase tracking-[0.25em] text-white/90">
          {title.split("").map((char, index) => (
            <motion.span
              key={`${char}-${index}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 + index * 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
        </h3>
        <p className="mt-2 font-ui text-[0.72rem] uppercase tracking-[0.55em] text-[rgba(255,255,255,0.45)]">
          LOCAL-FIRST MCP SERVER
        </p>
      </div>

      <div className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 -rotate-90 text-[0.54rem] uppercase tracking-[0.5em] text-[rgba(255,255,255,0.18)]">
        MODEL CONTEXT PROTOCOL
      </div>
      <div className="pointer-events-none absolute right-5 bottom-4 z-10 text-center w-full text-[0.52rem] uppercase tracking-[0.45em] text-[rgba(255,255,255,0.16)]">
        Local-First MCP Hub · Rust + tree-sitter · Data stream simulation
      </div>
      <div className="pointer-events-none absolute left-5 bottom-4 z-10 text-[0.5rem] uppercase tracking-[0.4em] text-[rgba(255,255,255,0.13)]">
        Click pulse
      </div>
    </div>
  );
}

/* ───────────── helpers ───────────── */

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
      <span className="font-ui text-[11px] text-[var(--text-secondary)]">{label}</span>
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
    </div>
  );
}
