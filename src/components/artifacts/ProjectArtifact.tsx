"use client";

/* eslint-disable react-hooks/immutability -- Three.js uniforms and object transforms are mutated inside useFrame. */

import { Canvas, useFrame } from "@react-three/fiber";
import { Cylinder, Icosahedron, Sphere } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { useFluidStore } from "@/lib/store";

export type ProjectArtifactType = "monkeyclaw" | "flowe" | "argyph";

interface ProjectArtifactProps {
  type: ProjectArtifactType;
  hovered?: boolean;
  expanded?: boolean;
}

const artifactVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const raymarchFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uHover;
  uniform float uScroll;
  uniform float uShatter;
  uniform float uMode;
  uniform float uSteps;
  varying vec2 vUv;

  #define FAR 9.0
  #define SURF 0.0028

  mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
  }

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float sdSphere(vec3 p, float r) {
    return length(p) - r;
  }

  float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a;
    vec3 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
  }

  float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
  }

  float sdTorusXY(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xy) - t.x, p.z);
    return length(q) - t.y;
  }

  float opUnion(float a, float b) {
    return min(a, b);
  }

  vec3 opTwist(vec3 p, float k) {
    float c = cos(k * p.y);
    float s = sin(k * p.y);
    mat2 m = mat2(c, -s, s, c);
    p.xz = m * p.xz;
    return p;
  }

  vec3 opRep(vec3 p, vec3 c) {
    return mod(p + 0.5 * c, c) - 0.5 * c;
  }

  float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
  }

  float particleTorus(vec3 p) {
    p.xy *= rot(uTime * 0.26 + uScroll * 2.4);
    p.xz *= rot(sin(uTime * 0.18) * 0.18);

    float ring = sdTorusXY(p, vec2(0.86, 0.048));
    float d = ring;

    vec3 q = p;
    float ang = atan(q.y, q.x);
    float sector = 48.0;
    float id = floor((ang + 3.14159265) / 6.2831853 * sector);
    float cell = (id + 0.5) / sector * 6.2831853 - 3.14159265;
    vec3 center = vec3(cos(cell) * 0.86, sin(cell) * 0.86, sin(id * 7.17 + uTime * 0.8) * 0.13);
    float pulse = 0.02 * sin(uTime * 3.0 + id * 1.37);
    float orbital = sdSphere(q - center, 0.043 + pulse);

    q = opTwist(p, 1.35 + uShatter * 1.8);
    vec3 chips = opRep(q, vec3(0.26));
    float grit = sdOctahedron(chips, 0.042 + hash(floor(q / 0.26)) * 0.018);
    float torusShell = abs(sdTorusXY(p, vec2(0.86, 0.18))) - 0.014;

    d = opUnion(d, orbital);
    d = opUnion(d, max(grit, torusShell));
    return d;
  }

  float branch(vec3 p, vec3 a, vec3 b, float r) {
    return sdCapsule(p, a, b, r);
  }

  float fractalTree(vec3 p) {
    p.xz *= rot(sin(uTime * 0.75) * 0.1 + uScroll * 0.8);
    p.x += sin(p.y * 2.8 + uTime * 1.2) * 0.045;

    float d = branch(p, vec3(0.0, -1.15, 0.0), vec3(0.0, 0.0, 0.0), 0.075);
    float radius = 0.052;
    vec3 base = vec3(0.0);

    for (int layer = 0; layer < 5; layer++) {
      float lf = float(layer);
      float count = 3.0 + lf;
      for (int i = 0; i < 8; i++) {
        if (float(i) >= count) continue;
        float fi = float(i);
        float a = fi / count * 6.2831853 + lf * 1.17 + sin(uTime * 0.45 + lf) * 0.12;
        float len = 0.54 / (1.0 + lf * 0.34);
        float y = 0.10 + lf * 0.30;
        vec3 start = base + vec3(cos(a) * 0.07 * lf, y - 0.18, sin(a) * 0.07 * lf);
        vec3 end = start + vec3(cos(a) * len, 0.34 / (1.0 + lf * 0.18), sin(a) * len);
        d = opUnion(d, branch(p, start, end, radius / (1.0 + lf * 0.4)));
        d = opUnion(d, sdSphere(p - end, 0.045 / (1.0 + lf * 0.18)));
      }
    }

    return d;
  }

  float map(vec3 p) {
    float shatter = uShatter * (0.18 + 0.12 * sin(uTime * 6.0 + p.y * 8.0));
    p += normalize(p + 0.001) * shatter;
    if (uMode < 0.5) {
      return particleTorus(p);
    }
    vec3 tp = p * 1.22;
    return fractalTree(tp) / 1.22;
  }

  vec3 normalAt(vec3 p) {
    vec2 e = vec2(0.0025, 0.0);
    float d = map(p);
    return normalize(vec3(
      map(p + e.xyy) - d,
      map(p + e.yxy) - d,
      map(p + e.yyx) - d
    ));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * vec2(1.0, 1.0);
    vec3 ro = vec3(0.0, 0.0, 3.35);
    vec3 rd = normalize(vec3(uv * 2.35, -2.45));

    float t = 0.0;
    float hit = 0.0;
    float steps = 0.0;
    for (int i = 0; i < 88; i++) {
      if (float(i) >= uSteps) break;
      vec3 p = ro + rd * t;
      float d = map(p);
      if (d < SURF) {
        hit = 1.0;
        break;
      }
      t += d * 0.72;
      steps += 1.0;
      if (t > FAR) break;
    }

    if (hit < 0.5) {
      discard;
    }

    vec3 p = ro + rd * t;
    vec3 n = normalAt(p);
    vec3 lightDir = normalize(vec3(-0.35, 0.62, 0.7));
    float diff = max(dot(n, lightDir), 0.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.4);
    float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 4.0);

    float orbitColor = fract(atan(p.y, p.x) / 6.2831853 + 0.5 + uTime * 0.08);
    vec3 red = vec3(1.0, 0.08, 0.22);
    vec3 cyan = vec3(0.0, 0.94, 1.0);
    vec3 rust = vec3(1.0, 0.47, 0.04);
    vec3 gold = vec3(1.0, 0.78, 0.28);
    vec3 base = uMode < 0.5 ? mix(red, cyan, orbitColor) : mix(rust, gold, clamp(p.y * 0.55 + 0.55, 0.0, 1.0));
    vec3 metal = mix(vec3(0.025), base, 0.78);
    vec3 col = metal * (0.38 + diff * 1.45) + base * rim * (0.95 + uHover * 0.85) + vec3(1.0) * fresnel * 0.32;

    float fade = smoothstep(FAR, 1.0, t);
    float alpha = clamp((0.78 + rim * 0.35 + uHover * 0.14) * fade, 0.0, 1.0);
    col += base * uShatter * hash(floor(p * 9.0 + uTime)) * 0.7;

    gl_FragColor = vec4(col, alpha);
  }
`;

type RaymarchMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uTime: { value: number };
    uHover: { value: number };
    uScroll: { value: number };
    uShatter: { value: number };
    uMode: { value: number };
    uSteps: { value: number };
  };
};

interface DendriteBranch {
  start: THREE.Vector3;
  end: THREE.Vector3;
  depth: number;
}

interface DendriteNode {
  pos: THREE.Vector3;
  depth: number;
  branchIndex: number;
}

interface DendriteParticle {
  branchIndex: number;
  t: number;
  speed: number;
  dir: 1 | -1;
}

function seededRandom(seed = 42) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function OrbitParticleBand({
  hovered,
  count,
  color,
  phaseOffset,
}: {
  hovered: boolean;
  count: number;
  color: string;
  phaseOffset: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = state.clock.elapsedTime;
    const radius = 0.92;
    for (let i = 0; i < count; i++) {
      const phase = i / count;
      const angle = phase * Math.PI * 2 + t * 0.48 + phaseOffset;
      const wobble = Math.sin(t * 1.8 + i * 1.73) * 0.07;
      dummy.position.set(
        Math.cos(angle) * (radius + wobble * 0.32),
        Math.sin(angle) * (radius + wobble * 0.32),
        Math.sin(t * 2.1 + i * 0.61) * 0.13
      );
      const size = (hovered ? 0.044 : 0.034) * (0.8 + Math.sin(t * 2.6 + i) * 0.18);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false} renderOrder={5}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial
        color={color}
        toneMapped={false}
        transparent
        depthTest={false}
        opacity={hovered ? 0.96 : 0.82}
      />
    </instancedMesh>
  );
}

function buildDendriteNetwork() {
  const rand = seededRandom(91);
  const branches: DendriteBranch[] = [];
  const nodes: DendriteNode[] = [];

  function grow(origin: THREE.Vector3, direction: THREE.Vector3, length: number, depth: number, maxDepth: number) {
    if (depth > maxDepth || length < 0.035) return;

    const dir = direction.clone().normalize();
    const end = origin.clone().add(dir.clone().multiplyScalar(length));
    const branchIndex = branches.length;
    branches.push({ start: origin.clone(), end: end.clone(), depth });
    nodes.push({ pos: end.clone(), depth, branchIndex });

    if (depth >= maxDepth) return;

    const splitCount = depth === 0 ? 3 : rand() > 0.62 ? 3 : 2;
    const baseAngle = rand() * Math.PI * 2;

    for (let i = 0; i < splitCount; i++) {
      const next = dir.clone();
      const up = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const axis = new THREE.Vector3().crossVectors(dir, up).normalize();
      const angle = baseAngle + (Math.PI * 2 * i) / splitCount + (rand() - 0.5) * 0.42;
      axis.applyAxisAngle(dir, angle);
      next.add(axis.multiplyScalar(0.34 + rand() * 0.44));
      next.x += (rand() - 0.5) * 0.12;
      next.y += (rand() - 0.5) * 0.08;
      next.z += (rand() - 0.5) * 0.1;
      next.normalize();
      grow(end, next, length * (0.52 + rand() * 0.14), depth + 1, maxDepth);
    }
  }

  [
    new THREE.Vector3(1, 0.08, 0.02),
    new THREE.Vector3(-1, 0.1, -0.03),
    new THREE.Vector3(0.18, 0.96, 0.08),
    new THREE.Vector3(-0.22, 0.92, -0.06),
    new THREE.Vector3(0.58, -0.54, 0.16),
    new THREE.Vector3(-0.58, -0.48, -0.18),
  ].forEach((dir) => grow(new THREE.Vector3(0, 0, 0), dir, 0.82 + rand() * 0.14, 0, 4));

  return { branches, nodes };
}

function argyphScrollEnvelope(scrollProgress: number) {
  const actLocal = clamp01((scrollProgress - 0.25) / 0.5);
  const argyphLocal = clamp01((actLocal - 2 / 3) * 3);
  const grow = clamp01(argyphLocal / 0.58);
  const retract = clamp01((1 - argyphLocal) / 0.28);
  return Math.min(grow, retract);
}

function ArgyphDendriticArtifact({ hovered, expanded }: { hovered: boolean; expanded: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const branchRef = useRef<THREE.LineSegments>(null);
  const nodeRef = useRef<THREE.InstancedMesh>(null);
  const particleRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const wireOuterRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const growthRef = useRef(0);

  const { branches, nodes } = useMemo(() => buildDendriteNetwork(), []);
  const particles = useMemo<DendriteParticle[]>(() => {
    const rand = seededRandom(117);
    return Array.from({ length: 72 }, () => ({
      branchIndex: Math.floor(rand() * branches.length),
      t: rand(),
      speed: 0.12 + rand() * 0.34,
      dir: rand() > 0.28 ? 1 : -1,
    }));
  }, [branches.length]);

  const branchGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(branches.length * 6), 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(branches.length * 6), 3));
    return geometry;
  }, [branches.length]);

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(particles.length * 3), 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(particles.length * 3), 3));
    return geometry;
  }, [particles.length]);

  useEffect(() => {
    return () => {
      branchGeometry.dispose();
      particleGeometry.dispose();
    };
  }, [branchGeometry, particleGeometry]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    gsap.killTweensOf(group.scale);
    gsap.to(group.scale, {
      x: expanded ? 1.24 : 1,
      y: expanded ? 1.24 : 1,
      z: expanded ? 1.24 : 1,
      duration: 0.45,
      ease: "power3.out",
    });
  }, [expanded]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const branchMesh = branchRef.current;
    const nodeMesh = nodeRef.current;
    const particleMesh = particleRef.current;
    if (!group || !branchMesh || !nodeMesh || !particleMesh) return;

    const fluid = useFluidStore.getState();
    const elapsed = state.clock.elapsedTime;
    const target = fluid.reducedMotion ? 1 : argyphScrollEnvelope(fluid.scrollProgress);
    growthRef.current += (target - growthRef.current) * (fluid.reducedMotion ? 1 : 0.055);
    const growth = growthRef.current;

    group.rotation.y = Math.sin(elapsed * 0.12) * 0.035 + fluid.scrollVelocity * 0.000025;
    group.rotation.x = -0.06 + Math.sin(elapsed * 0.1) * 0.025;
    group.rotation.z = -0.08 + (growth - 0.5) * 0.12;

    const positions = branchMesh.geometry.getAttribute("position").array as Float32Array;
    const colors = branchMesh.geometry.getAttribute("color").array as Float32Array;

    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      const segment = clamp01((growth - branch.depth * 0.13) / 0.62);
      const shimmer = fluid.reducedMotion ? 0.78 : 0.72 + Math.sin(elapsed * 1.35 + i * 0.37) * 0.18;
      const brightness = Math.max(0, (1 - branch.depth * 0.14) * shimmer * segment);

      positions[i * 6] = branch.start.x;
      positions[i * 6 + 1] = branch.start.y;
      positions[i * 6 + 2] = branch.start.z;
      positions[i * 6 + 3] = branch.start.x + (branch.end.x - branch.start.x) * segment;
      positions[i * 6 + 4] = branch.start.y + (branch.end.y - branch.start.y) * segment;
      positions[i * 6 + 5] = branch.start.z + (branch.end.z - branch.start.z) * segment;

      colors[i * 6] = brightness * 1.0;
      colors[i * 6 + 1] = brightness * 0.68;
      colors[i * 6 + 2] = brightness * 0.22;
      colors[i * 6 + 3] = brightness * 1.0;
      colors[i * 6 + 4] = brightness * 0.78;
      colors[i * 6 + 5] = brightness * 0.34;
    }

    branchMesh.geometry.attributes.position.needsUpdate = true;
    branchMesh.geometry.attributes.color.needsUpdate = true;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const branch = branches[node.branchIndex];
      const nodeGrowth = clamp01((growth - branch.depth * 0.13) / 0.62);
      if (nodeGrowth > 0.86) {
        dummy.position.copy(node.pos);
        dummy.scale.setScalar((0.022 + Math.max(0, 4 - node.depth) * 0.002) * clamp01((nodeGrowth - 0.86) / 0.14));
      } else {
        dummy.position.set(0, -20, 0);
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      nodeMesh.setMatrixAt(i, dummy.matrix);
    }
    nodeMesh.instanceMatrix.needsUpdate = true;

    const particlePositions = particleMesh.geometry.getAttribute("position").array as Float32Array;
    const particleColors = particleMesh.geometry.getAttribute("color").array as Float32Array;
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const branch = branches[particle.branchIndex];
      const branchGrowth = clamp01((growth - branch.depth * 0.13) / 0.62);
      if (branchGrowth < 0.35 || fluid.reducedMotion) {
        particlePositions[i * 3 + 1] = -20;
        continue;
      }

      particle.t += particle.speed * particle.dir * delta * 0.18;
      if (particle.t > 1 || particle.t < 0) {
        particle.t = particle.t > 1 ? 0 : 1;
        particle.branchIndex = Math.floor(Math.random() * branches.length);
      }

      const pt = Math.min(branchGrowth, clamp01(particle.t));
      particlePositions[i * 3] = branch.start.x + (branch.end.x - branch.start.x) * pt;
      particlePositions[i * 3 + 1] = branch.start.y + (branch.end.y - branch.start.y) * pt;
      particlePositions[i * 3 + 2] = branch.start.z + (branch.end.z - branch.start.z) * pt;

      const brightness = 0.52 + (1 - pt) * 0.36;
      particleColors[i * 3] = brightness;
      particleColors[i * 3 + 1] = brightness * 0.72;
      particleColors[i * 3 + 2] = brightness * 0.25;
    }
    particleMesh.geometry.attributes.position.needsUpdate = true;
    particleMesh.geometry.attributes.color.needsUpdate = true;

    const pulse = 1 + Math.sin(elapsed * 1.7) * 0.045 + growth * 0.08 + (hovered ? 0.035 : 0);
    coreRef.current?.scale.setScalar(pulse);
    if (wireRef.current) {
      wireRef.current.rotation.x = elapsed * 0.05;
      wireRef.current.rotation.y = elapsed * 0.035;
    }
    if (wireOuterRef.current) {
      wireOuterRef.current.rotation.x = -elapsed * 0.032;
      wireOuterRef.current.rotation.z = elapsed * 0.026;
    }
  });

  return (
    <group ref={groupRef} scale={1.58}>
      <lineSegments ref={branchRef} geometry={branchGeometry} frustumCulled={false} renderOrder={8}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={hovered ? 0.92 : 0.78}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </lineSegments>

      <points ref={particleRef} geometry={particleGeometry} frustumCulled={false} renderOrder={10}>
        <pointsMaterial
          size={0.025}
          vertexColors
          transparent
          opacity={hovered ? 0.9 : 0.64}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      <instancedMesh ref={nodeRef} args={[undefined, undefined, nodes.length]} frustumCulled={false} renderOrder={9}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial
          color="#ffd64a"
          transparent
          opacity={hovered ? 0.82 : 0.64}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>

      <Sphere ref={coreRef} args={[0.18, 32, 32]} renderOrder={12}>
        <meshBasicMaterial
          color="#ffd21f"
          transparent
          opacity={hovered ? 0.74 : 0.58}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </Sphere>
      <Icosahedron ref={wireRef} args={[0.34, 1]} renderOrder={11}>
        <meshBasicMaterial color="#c9943e" wireframe transparent opacity={0.24} depthWrite={false} toneMapped={false} />
      </Icosahedron>
      <Icosahedron ref={wireOuterRef} args={[0.48, 0]} renderOrder={11}>
        <meshBasicMaterial color="#c9943e" wireframe transparent opacity={0.12} depthWrite={false} toneMapped={false} />
      </Icosahedron>
    </group>
  );
}

function MonkeyParticleHalo({ hovered }: { hovered: boolean }) {
  const gpuTier = useFluidStore((s) => s.gpuTier);
  const count = gpuTier === "high" ? 48 : 32;

  return (
    <>
      <OrbitParticleBand hovered={hovered} count={count} color="#ff3155" phaseOffset={0} />
      <OrbitParticleBand hovered={hovered} count={count} color="#00f0ff" phaseOffset={Math.PI} />
    </>
  );
}

function RaymarchedArtifact({
  mode,
  hovered,
  expanded,
}: {
  mode: "monkeyclaw" | "argyph";
  hovered: boolean;
  expanded: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<RaymarchMaterial>(null);
  const scrollRef = useRef(0);
  const gpuTier = useFluidStore((s) => s.gpuTier);

  const material = useMemo(() => {
    const steps = gpuTier === "high" ? 72 : gpuTier === "medium" ? 54 : 38;
    return new THREE.ShaderMaterial({
      vertexShader: artifactVertex,
      fragmentShader: raymarchFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0 },
        uScroll: { value: 0 },
        uShatter: { value: 0 },
        uMode: { value: mode === "monkeyclaw" ? 0 : 1 },
        uSteps: { value: steps },
      },
    }) as RaymarchMaterial;
  }, [gpuTier, mode]);

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  useEffect(() => {
    const group = groupRef.current;
    const uniforms = materialRef.current?.uniforms;
    if (!group || !uniforms) return;

    gsap.killTweensOf(group.scale);
    gsap.killTweensOf(uniforms.uShatter);

    if (expanded) {
      gsap
        .timeline()
        .to(group.scale, { x: 1.35, y: 1.35, z: 1.35, duration: 0.42, ease: "power3.out" }, 0)
        .to(uniforms.uShatter, { value: 1, duration: 0.5, ease: "power2.inOut" }, 0)
        .to(uniforms.uShatter, { value: 0.25, duration: 0.34, ease: "sine.out" }, 0.5);
      return;
    }

    gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 0.45, ease: "power3.out" });
    gsap.to(uniforms.uShatter, { value: 0, duration: 0.35, ease: "sine.out" });
  }, [expanded]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const uniforms = materialRef.current?.uniforms;
    if (!group || !uniforms) return;

    const state = useFluidStore.getState();
    const p = state.scrollProgress;
    const local = Math.min(1, Math.max(0, (p - 0.25) / 0.5));
    scrollRef.current += (local - scrollRef.current) * 0.08;
    const hoverTarget = hovered ? 1 : 0;

    uniforms.uTime.value += Math.min(delta, 0.033);
    uniforms.uHover.value += (hoverTarget - uniforms.uHover.value) * 0.12;
    uniforms.uScroll.value = scrollRef.current;

    group.rotation.y += delta * (mode === "monkeyclaw" ? 0.42 : 0.2) + state.scrollVelocity * 0.00008;
    group.rotation.x = Math.sin(uniforms.uTime.value * 0.28) * (mode === "monkeyclaw" ? 0.18 : 0.08);
    group.rotation.z = scrollRef.current * 0.7;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <planeGeometry args={[3.25, 3.25, 1, 1]} />
        <primitive ref={materialRef} object={material} attach="material" />
      </mesh>
      {mode === "monkeyclaw" && (
        <>
          <MonkeyParticleHalo hovered={hovered} />
          <Icosahedron args={[0.42, 1]} rotation={[0.6, 0.2, 0.1]}>
            <meshBasicMaterial color="#d8fbff" wireframe transparent opacity={hovered ? 0.58 : 0.34} />
          </Icosahedron>
        </>
      )}
    </group>
  );
}

const floweNodes = [
  [-0.78, 0.28, 0.1],
  [-0.4, -0.35, -0.2],
  [-0.1, 0.45, 0.28],
  [0.28, -0.18, 0.08],
  [0.7, 0.34, -0.24],
  [0.82, -0.45, 0.22],
  [0.02, -0.72, -0.12],
  [-0.72, -0.62, 0.16],
  [0.52, 0.72, 0.08],
] as const;

const floweLinks = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 7],
  [2, 3],
  [2, 4],
  [3, 5],
  [3, 6],
  [4, 8],
  [5, 6],
  [6, 7],
] as const;

function Connection({
  a,
  b,
  hovered,
}: {
  a: THREE.Vector3;
  b: THREE.Vector3;
  hovered: boolean;
}) {
  const midpoint = useMemo(() => a.clone().add(b).multiplyScalar(0.5), [a, b]);
  const length = useMemo(() => a.distanceTo(b), [a, b]);
  const quaternion = useMemo(() => {
    const direction = b.clone().sub(a).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  }, [a, b]);

  return (
    <Cylinder args={[0.008, 0.008, length, 12]} position={midpoint} quaternion={quaternion}>
      <meshPhysicalMaterial
        color="#bfe8ff"
        emissive="#0A84FF"
        emissiveIntensity={hovered ? 1.15 : 0.55}
        roughness={0.12}
        metalness={0.1}
        transparent
        opacity={0.58}
        transmission={0.45}
      />
    </Cylinder>
  );
}

function DataPulse({
  a,
  b,
  delay,
  hovered,
}: {
  a: THREE.Vector3;
  b: THREE.Vector3;
  delay: number;
  hovered: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = (Math.sin(state.clock.elapsedTime * (1.15 + delay * 0.12) + delay) + 1) * 0.5;
    ref.current.position.copy(a).lerp(b, t);
    const scale = hovered ? 1.35 : 1;
    ref.current.scale.setScalar(scale * (0.8 + Math.sin(t * Math.PI) * 0.35));
  });

  return (
    <Sphere ref={ref} args={[0.025, 12, 12]}>
      <meshBasicMaterial color="#9cecff" transparent opacity={hovered ? 0.95 : 0.72} />
    </Sphere>
  );
}

function FlowENodeGraph({ hovered, expanded }: { hovered: boolean; expanded: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const points = useMemo(() => floweNodes.map((p) => new THREE.Vector3(...p)), []);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    gsap.killTweensOf(group.scale);
    gsap.to(group.scale, {
      x: expanded ? 1.28 : 1,
      y: expanded ? 1.28 : 1,
      z: expanded ? 1.28 : 1,
      duration: 0.45,
      ease: "power3.out",
    });
  }, [expanded]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const state = useFluidStore.getState();
    const local = Math.min(1, Math.max(0, (state.scrollProgress - 0.25) / 0.5));
    group.rotation.y += delta * 0.18 + state.scrollVelocity * 0.00006;
    group.rotation.x = Math.sin(local * Math.PI * 2) * 0.16;
    group.rotation.z = local * 0.45;
  });

  return (
    <group ref={groupRef} scale={1.1}>
      {floweLinks.map(([from, to], index) => (
        <group key={`${from}-${to}`}>
          <Connection a={points[from]} b={points[to]} hovered={hovered} />
          <DataPulse a={points[from]} b={points[to]} delay={index * 0.43} hovered={hovered} />
        </group>
      ))}
      {points.map((position, index) => (
        <Sphere key={index} args={[index === 3 ? 0.095 : 0.072, 24, 24]} position={position}>
          <meshStandardMaterial
            color={index === 3 ? "#dff6ff" : "#78c8ff"}
            emissive={index === 3 ? "#5E5CE6" : "#0A84FF"}
            emissiveIntensity={hovered ? 2.1 : 1.2}
            roughness={0.18}
            metalness={0.08}
          />
        </Sphere>
      ))}
    </group>
  );
}

function ArtifactScene({ type, hovered, expanded }: Required<ProjectArtifactProps>) {
  const reducedMotion = useFluidStore((s) => s.reducedMotion);

  if (type === "flowe") {
    return <FlowENodeGraph hovered={hovered && !reducedMotion} expanded={expanded} />;
  }

  if (type === "argyph") {
    return <ArgyphDendriticArtifact hovered={hovered && !reducedMotion} expanded={expanded} />;
  }

  return <RaymarchedArtifact mode={type} hovered={hovered && !reducedMotion} expanded={expanded} />;
}

export default function ProjectArtifact({
  type,
  hovered = false,
  expanded = false,
}: ProjectArtifactProps) {
  const gpuTier = useFluidStore((s) => s.gpuTier);
  const reducedMotion = useFluidStore((s) => s.reducedMotion);
  const dprMax = gpuTier === "high" ? 1.15 : 1;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-[-14%]">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 42, near: 0.1, far: 20 }}
        dpr={[0.8, dprMax]}
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        performance={{ min: 0.45 }}
      >
        <ambientLight intensity={0.9} />
        <pointLight position={[1.8, 1.6, 2.4]} intensity={4.5} color="#bdefff" />
        <pointLight position={[-2.4, -1.6, 1.8]} intensity={2.4} color="#ff6b7d" />
        <ArtifactScene type={type} hovered={hovered} expanded={expanded} />
      </Canvas>
    </div>
  );
}
