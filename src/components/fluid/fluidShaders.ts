/**
 * THE KINETIC FLUID CANVAS — GLSL Shaders
 *
 * A GPU fluid simulation using a ping-pong FBO. We pack velocity (RG)
 * and ink/dye (B) into a single RGBA texture. Each frame we:
 *   1. Advect the packed field by its own velocity (semi-Lagrangian).
 *   2. Splat mouse + scroll forces & dye at the pointer.
 *   3. Display: map velocity magnitude -> iridescent violet->cyan gradient.
 *
 * Pressure projection is omitted intentionally — pure advection + splats
 * + dissipation produces a beautiful, stable, cheap fluid look.
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
    // semi-Lagrangian back-trace
    vec2 coord = vUv - uDt * vel * uTexelSize * 1.2;
    vec4 sampled = texture2D(uSim, coord);

    // gentle global upward current driven by scroll velocity (Act 2)
    sampled.y += uScrollForce * 0.0009;

    // ambient swirl so the canvas never feels dead
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
  uniform vec2  uPoint;       // 0..1 (aspect corrected)
  uniform vec2  uVelocity;    // force direction (already scaled)
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

/* ---------- Step 3: Display (iridescent) ---------- */
export const displayFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uSim;
  uniform float uTime;
  uniform float uPartAmount;    // Act 1 horizontal parting 0..1
  uniform float uVoidAmount;    // Act 4 void 0..1
  uniform float uGlassAmount;   // Act 3 glass blur 0..1
  uniform float uOrbitAmount;   // Act 3 sphere gather 0..1
  uniform vec2  uResolution;
  uniform float uVelocityBoost;
  varying vec2 vUv;

  vec3 irid(float speed) {
    vec3 violet = vec3(0.29, 0.0, 0.88);
    vec3 cyan   = vec3(0.0, 0.94, 1.0);
    vec3 hot    = vec3(0.95, 0.97, 1.0);
    vec3 c = mix(violet, cyan, clamp(speed, 0.0, 0.7));
    return mix(c, hot, smoothstep(0.7, 1.3, speed));
  }

  void main() {
    vec2 uv = vUv;

    // Act 3: gather fluid toward center sphere (SDF)
    vec2 c = uv - 0.5;
    c.x *= uResolution.x / uResolution.y;
    float dist = length(c);
    float sphereR = 0.22 + 0.05 * sin(uTime * 0.6);
    float insideSphere = smoothstep(sphereR, sphereR - 0.02, dist);
    // pull UV inward near sphere
    uv = mix(uv, 0.5 + (uv - 0.5) * (0.4 + 0.2 * sin(uTime * 0.8)), uOrbitAmount * insideSphere);

    vec4 sim = texture2D(uSim, uv);
    vec2 vel = sim.xy;
    float ink = sim.z;
    float speed = length(vel) * (1.0 + uVelocityBoost);

    float t = uTime * 0.25;

    // ---- Baseline iridescent ambient flow (ALWAYS visible) ----
    // procedural flowing bands so the canvas is vivid even at rest
    vec2 flow = vec2(
      sin(uv.y * 3.2 + t * 0.6) + sin(uv.y * 7.0 - t * 0.9) * 0.5,
      cos(uv.x * 3.2 - t * 0.5) + cos(uv.x * 7.0 + t * 0.8) * 0.5
    );
    float band = 0.5 + 0.5 * sin((uv.x * 4.0 + uv.y * 2.0) + t * 1.2 + flow.x * 2.0);
    float band2 = 0.5 + 0.5 * sin((uv.x * 2.0 - uv.y * 5.0) - t * 0.8 + flow.y * 2.0);
    float field = band * 0.6 + band2 * 0.4;
    // violet -> cyan gradient across the field (bright, saturated)
    vec3 ambA = vec3(0.22, 0.02, 0.55);   // violet
    vec3 ambB = vec3(0.0, 0.45, 0.62);    // cyan
    vec3 ambient = mix(ambA, ambB, field);

    // central radial glow so the middle reads as luminous liquid metal
    float glow = smoothstep(0.9, 0.0, dist);
    ambient += vec3(0.10, 0.14, 0.22) * glow;

    // base liquid metal (near black, slightly reflective)
    vec3 col = vec3(0.02, 0.02, 0.03) + ambient * 0.9;

    vec3 ir = irid(speed * 12.0);
    ir = mix(ir, vec3(1.0), smoothstep(0.0, 0.55, ink));

    col += ir * (ink * 1.8 + speed * 9.0);

    // caustic ripples driven by velocity
    float caustic  = sin(uv.x * 28.0 + t * 3.0 + vel.y * 50.0) * 0.5 + 0.5;
    caustic       *= sin(uv.y * 22.0 - t * 2.0 + vel.x * 50.0) * 0.5 + 0.5;
    col += ir * caustic * 0.06 * (ink + 0.4);

    // flowing streaks along velocity
    float streak = pow(max(0.0, dot(normalize(vel + 1e-5), vec2(1.0, 0.0))), 2.0);
    col += ir * streak * speed * 4.0;

    // Act 1: horizontal parting — drain the center seam
    float seam = abs(uv.y - 0.5);
    float partMask = smoothstep(uPartAmount * 0.42, uPartAmount * 0.42 + 0.18, seam);
    col = mix(col, vec3(0.012, 0.012, 0.02), partMask * uPartAmount);

    // Act 3: glass blur toward edges of sphere
    col = mix(col, vec3(0.02, 0.02, 0.03) + ir * 0.03, uGlassAmount * (1.0 - insideSphere));

    // Act 4: void — drain color, keep faint bioluminescent glow
    vec3 voidCol = vec3(0.006, 0.006, 0.01);
    col = mix(col, voidCol, uVoidAmount);
    // bioluminescent specks appear in the void
    float speck = step(0.9975, fract(sin(dot(uv * 240.0 + uTime * 0.3, vec2(12.9898,78.233))) * 43758.5453));
    col += vec3(0.0, 0.7, 0.9) * speck * uVoidAmount * (0.6 + 0.4 * sin(uTime * 2.0 + uv.y * 40.0));

    // vignette
    float vig = smoothstep(1.1, 0.2, dist);
    col *= 0.6 + 0.4 * vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;
