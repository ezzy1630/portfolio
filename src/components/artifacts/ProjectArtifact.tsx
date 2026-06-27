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
