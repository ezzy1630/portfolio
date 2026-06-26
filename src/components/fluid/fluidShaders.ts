/**
 * THE KINETIC FLUID CANVAS — GLSL Shaders (Expanded Vision)
 *
 * Ping-pong FBO fluid sim. Velocity (RG) + ink (B) packed in one RGBA
 * HalfFloat texture. Each frame: advect -> splat -> display.
 *
 * Display shader adds per-act effects driven by scroll progress:
 *   - Act 1 (0-0.08): fluid rushes in; central codebase-character vortex.
 *   - Act 2 (0.08-0.25): upward current; neural lattice on scroll-stop.
 *   - Act 3 (0.25-0.75): fluid gathers into accent-tinted sphere per project.
 *   - Act 4 (0.75-0.90): drains to bottom; magnetic geometric shapes.
 *   - Act 5 (0.90-1.0): implodes to a single glowing dot.
 *
 * Per-project accent color is a uniform (uAccent / uAccentHigh).
 */

export const baseVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* ---------- Step 1: Advection ---------- */
export const advectFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uSim;
  uniform vec2 uTexelSize;
  uniform float uDt;
  uniform float uVelocityDissipation;
  uniform float uInkDissipation;
  uniform float uScrollForce;     // upward current (Act 2)
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 vel = texture2D(uSim, vUv).xy;
    vec2 coord = vUv - uDt * vel * uTexelSize * 1.2;
    vec4 sampled = texture2D(uSim, coord);

    sampled.y += uScrollForce * 0.0009;

    float a = uTime * 0.15;
    sampled.x += sin(vUv.y * 6.0 + a) * 0.00006;
    sampled.y += cos(vUv.x * 6.0 - a) * 0.00006;

    vec2 newVel = sampled.xy * uVelocityDissipation;
    float newInk = sampled.z * uInkDissipation;
    gl_FragColor = vec4(newVel, newInk, sampled.w);
  }
`;

/* ---------- Step 2: Splat (mouse force + dye) ---------- */
export const splatFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uSim;
  uniform vec2  uPoint;
  uniform vec2  uVelocity;
  uniform float uRadius;
  uniform float uInk;
  uniform float uAspect;
  varying vec2 vUv;

  void main() {
    vec4 base = texture2D(uSim, vUv);
    vec2 p = vUv - uPoint;
    p.x *= uAspect;
    float d = dot(p, p);
    float falloff = exp(-d / uRadius);
    base.xy += uVelocity * falloff;
    base.z  += uInk * falloff;
    gl_FragColor = base;
  }
`;

/* ---------- Step 3: Display (iridescent + per-act effects) ---------- */
export const displayFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uSim;
  uniform float uTime;
  uniform float uPartAmount;    // Act 1 horizontal parting
  uniform float uVortex;        // Act 1 central codebase vortex
  uniform float uLattice;       // Act 2 neural lattice (on rest)
  uniform float uVoidAmount;    // Act 4/5 void
  uniform float uGlassAmount;   // Act 3 glass blur
  uniform float uOrbitAmount;   // Act 3 sphere gather
  uniform float uImplode;       // Act 5 implosion to dot
  uniform float uDrainBottom;   // Act 4 drain to bottom
  uniform vec2  uResolution;
  uniform float uVelocityBoost;
  uniform vec3  uAccent;        // project base accent (0..1)
  uniform vec3  uAccentHigh;    // project highlight accent (0..1)
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }

  // tiny pseudo-character grid (matrix-rain style) for the codebase vortex
  float charBlock(vec2 uv, float t) {
    vec2 g = floor(uv * vec2(8.0, 16.0));
    float r = hash(g + floor(t * 1.5));
    float on = step(0.55, r);
    // brighten the leading row
    float lead = smoothstep(0.0, 1.0, 1.0 - fract(uv.y * 16.0 - t * 2.0));
    return on * (0.25 + 0.75 * lead);
  }

  // neural lattice: nodes at grid points + connecting lines
  float neuralLattice(vec2 uv, float t) {
    vec2 g = uv * vec2(8.0, 6.0);
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float node = smoothstep(0.18, 0.0, length(f));
    // pulse
    node *= 0.6 + 0.4 * sin(t * 2.0 + hash(id) * 6.28);
    // lines toward 2 neighbors
    float line = 0.0;
    for (int dx = 0; dx <= 1; dx++) {
      for (int dy = -1; dy <= 1; dy++) {
        if (dx == 0 && dy < 0) continue;
        vec2 nb = vec2(float(dx), float(dy));
        vec2 a = vec2(0.0);
        vec2 b = nb;
        vec2 pa = f - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float d = length(pa - ba * h);
        line += smoothstep(0.03, 0.0, d) * step(hash(id + nb), 0.5);
      }
    }
    return node + line * 0.25;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.25;

    // Act 3: gather fluid toward center sphere (SDF)
    vec2 c = uv - 0.5;
    c.x *= uResolution.x / uResolution.y;
    float dist = length(c);
    float sphereR = 0.22 + 0.05 * sin(uTime * 0.6);
    float insideSphere = smoothstep(sphereR, sphereR - 0.02, dist);
    uv = mix(uv, 0.5 + (uv - 0.5) * (0.4 + 0.2 * sin(uTime * 0.8)), uOrbitAmount * insideSphere);

    // Act 4: drain downward (bias UV sampling upward so fluid pools at bottom)
    uv.y = mix(uv.y, uv.y + 0.15, uDrainBottom);

    // Act 5: implode — pull all UVs toward center
    uv = mix(uv, vec2(0.5), uImplode);

    vec4 sim = texture2D(uSim, uv);
    vec2 vel = sim.xy;
    float ink = sim.z;
    float speed = length(vel) * (1.0 + uVelocityBoost);

    // baseline iridescent ambient flow
    vec2 flow = vec2(
      sin(uv.y * 3.2 + t * 0.6) + sin(uv.y * 7.0 - t * 0.9) * 0.5,
      cos(uv.x * 3.2 - t * 0.5) + cos(uv.x * 7.0 + t * 0.8) * 0.5
    );
    float band = 0.5 + 0.5 * sin((uv.x * 4.0 + uv.y * 2.0) + t * 1.2 + flow.x * 2.0);
    float band2 = 0.5 + 0.5 * sin((uv.x * 2.0 - uv.y * 5.0) - t * 0.8 + flow.y * 2.0);
    float field = band * 0.6 + band2 * 0.4;

    // ambient uses the accent color: deep accent -> highlight accent
    vec3 ambA = uAccent * 0.7;
    vec3 ambB = uAccentHigh * 0.8;
    vec3 ambient = mix(ambA, ambB, field);

    float glow = smoothstep(0.9, 0.0, dist);
    ambient += uAccentHigh * 0.18 * glow;

    vec3 col = vec3(0.02, 0.02, 0.03) + ambient * 0.9;

    // iridescence from fluid velocity, tinted by accent
    vec3 ir = mix(uAccent, uAccentHigh, clamp(speed * 12.0, 0.0, 0.7));
    ir = mix(ir, vec3(1.0), smoothstep(0.0, 0.55, ink));
    col += ir * (ink * 1.8 + speed * 9.0);

    float caustic  = sin(uv.x * 28.0 + t * 3.0 + vel.y * 50.0) * 0.5 + 0.5;
    caustic       *= sin(uv.y * 22.0 - t * 2.0 + vel.x * 50.0) * 0.5 + 0.5;
    col += ir * caustic * 0.06 * (ink + 0.4);

    float streak = pow(max(0.0, dot(normalize(vel + 1e-5), vec2(1.0, 0.0))), 2.0);
    col += ir * streak * speed * 4.0;

    // ---- Act 1: codebase-character vortex in the center ----
    if (uVortex > 0.001) {
      vec2 vp = uv - 0.5;
      vp.x *= uResolution.x / uResolution.y;
      float ang = atan(vp.y, vp.x);
      float rad = length(vp);
      // swirl coordinate
      vec2 sUv = vec2(rad * 3.0, ang / 6.2832 + uTime * 0.4);
      float chars = charBlock(sUv, uTime);
      float vortexMask = smoothstep(0.28, 0.05, rad) * uVortex;
      col += uAccentHigh * chars * vortexMask * 0.6;
      // vortex edge ring
      col += uAccent * smoothstep(0.30, 0.26, rad) * smoothstep(0.24, 0.28, rad) * uVortex * 0.5;
    }

    // ---- Act 2: neural lattice on scroll-stop ----
    if (uLattice > 0.001) {
      float lat = neuralLattice(uv, uTime);
      col += uAccentHigh * lat * uLattice * 0.35;
    }

    // ---- Act 1: horizontal parting ----
    float seam = abs(uv.y - 0.5);
    float partMask = smoothstep(uPartAmount * 0.42, uPartAmount * 0.42 + 0.18, seam);
    col = mix(col, vec3(0.012, 0.012, 0.02), partMask * uPartAmount);

    // ---- Act 3: glass blur toward sphere edges ----
    col = mix(col, vec3(0.02, 0.02, 0.03) + ir * 0.03, uGlassAmount * (1.0 - insideSphere));

    // ---- Act 4/5: void ----
    vec3 voidCol = vec3(0.006, 0.006, 0.01);
    col = mix(col, voidCol, uVoidAmount);
    float speck = step(0.9975, fract(sin(dot(uv * 240.0 + uTime * 0.3, vec2(12.9898,78.233))) * 43758.5453));
    col += uAccentHigh * speck * uVoidAmount * (0.6 + 0.4 * sin(uTime * 2.0 + uv.y * 40.0));

    // ---- Act 5: implosion central dot ----
    if (uImplode > 0.001) {
      float dotGlow = smoothstep(0.06, 0.0, dist);
      col += uAccentHigh * dotGlow * uImplode * 2.0;
      col *= mix(1.0, 0.2, uImplode * (1.0 - dotGlow));
    }

    // vignette
    float vig = smoothstep(1.1, 0.2, dist);
    col *= 0.6 + 0.4 * vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;
