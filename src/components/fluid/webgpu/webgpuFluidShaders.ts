/**
 * WGSL shader architecture for the next fluid renderer.
 *
 * WebGPU should use double-buffered storage textures for velocity/density:
 * reading and writing the exact same cell in a single dispatch can create
 * undefined hazards across workgroups. The API still uses storage textures,
 * then swaps read/write bindings each frame.
 */

export const fluidComputeWGSL = /* wgsl */ `
struct SimParams {
  resolution: vec2<u32>,
  dt: f32,
  velocityDissipation: f32,
  densityDissipation: f32,
  viscosity: f32,
  forceRadius: f32,
  forceStrength: f32,
  scrollForce: f32,
  mouse: vec2<f32>,
  mouseDelta: vec2<f32>,
  time: f32,
  _pad: f32,
};

@group(0) @binding(0) var prevVelocity: texture_2d<f32>;
@group(0) @binding(1) var prevDensity: texture_2d<f32>;
@group(0) @binding(2) var nextVelocity: texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var nextDensity: texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var<uniform> params: SimParams;

fn clampCoord(coord: vec2<i32>) -> vec2<i32> {
  let maxCoord = vec2<i32>(i32(params.resolution.x) - 1, i32(params.resolution.y) - 1);
  return clamp(coord, vec2<i32>(0), maxCoord);
}

fn loadVelocity(coord: vec2<i32>) -> vec2<f32> {
  return textureLoad(prevVelocity, clampCoord(coord), 0).xy;
}

fn loadDensity(coord: vec2<i32>) -> f32 {
  return textureLoad(prevDensity, clampCoord(coord), 0).x;
}

fn bilinearVelocity(pos: vec2<f32>) -> vec2<f32> {
  let p0 = vec2<i32>(floor(pos));
  let p1 = p0 + vec2<i32>(1);
  let f = fract(pos);
  let a = mix(loadVelocity(vec2<i32>(p0.x, p0.y)), loadVelocity(vec2<i32>(p1.x, p0.y)), f.x);
  let b = mix(loadVelocity(vec2<i32>(p0.x, p1.y)), loadVelocity(vec2<i32>(p1.x, p1.y)), f.x);
  return mix(a, b, f.y);
}

fn bilinearDensity(pos: vec2<f32>) -> f32 {
  let p0 = vec2<i32>(floor(pos));
  let p1 = p0 + vec2<i32>(1);
  let f = fract(pos);
  let a = mix(loadDensity(vec2<i32>(p0.x, p0.y)), loadDensity(vec2<i32>(p1.x, p0.y)), f.x);
  let b = mix(loadDensity(vec2<i32>(p0.x, p1.y)), loadDensity(vec2<i32>(p1.x, p1.y)), f.x);
  return mix(a, b, f.y);
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x >= params.resolution.x || id.y >= params.resolution.y) {
    return;
  }

  let coord = vec2<i32>(id.xy);
  let pixel = vec2<f32>(id.xy);
  let uv = (pixel + vec2<f32>(0.5)) / vec2<f32>(params.resolution);

  let centerVelocity = loadVelocity(coord);
  let backtrace = pixel - centerVelocity * params.dt * 1.35;

  var velocity = bilinearVelocity(backtrace) * params.velocityDissipation;
  var density = bilinearDensity(backtrace) * params.densityDissipation;

  let left = loadVelocity(coord + vec2<i32>(-1, 0));
  let right = loadVelocity(coord + vec2<i32>(1, 0));
  let bottom = loadVelocity(coord + vec2<i32>(0, -1));
  let top = loadVelocity(coord + vec2<i32>(0, 1));
  let laplacian = left + right + bottom + top - 4.0 * centerVelocity;
  velocity += laplacian * params.viscosity * params.dt;

  let mouseVector = uv - params.mouse;
  let radius = max(params.forceRadius, 0.0001);
  let falloff = exp(-dot(mouseVector, mouseVector) / radius);
  velocity += params.mouseDelta * params.forceStrength * falloff;
  velocity.y += params.scrollForce * 0.0009;
  density += falloff * length(params.mouseDelta) * 0.02;

  let shimmer = vec2<f32>(
    sin(uv.y * 6.0 + params.time * 0.15),
    cos(uv.x * 6.0 - params.time * 0.15)
  ) * 0.00006;
  velocity += shimmer;

  let centered = uv - vec2<f32>(0.5);
  let radialSeed = exp(-dot(centered, centered) / 0.18);
  let bandSeed = 0.5 + 0.5 * sin(uv.x * 9.0 + uv.y * 7.0 + params.time * 0.32);
  let ambientDensity = 0.035 + radialSeed * 0.12 + bandSeed * 0.025;
  let swirl = vec2<f32>(-centered.y, centered.x) * radialSeed * 0.018;
  velocity += swirl;
  density = max(density, ambientDensity);

  textureStore(nextVelocity, coord, vec4<f32>(velocity, 0.0, 1.0));
  textureStore(nextDensity, coord, vec4<f32>(clamp(density, 0.0, 8.0), 0.0, 0.0, 1.0));
}
`;

export const textDisplaceWGSL = /* wgsl */ `
struct RenderParams {
  resolution: vec2<f32>,
  displacement: f32,
  inkBoost: f32,
  time: f32,
  _pad: f32,
};

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@group(0) @binding(0) var velocityTexture: texture_2d<f32>;
@group(0) @binding(1) var densityTexture: texture_2d<f32>;
@group(0) @binding(2) var typographyTexture: texture_2d<f32>;
@group(0) @binding(3) var typographySampler: sampler;
@group(0) @binding(4) var<uniform> params: RenderParams;

@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOut {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );

  var out: VertexOut;
  out.position = vec4<f32>(positions[index], 0.0, 1.0);
  out.uv = positions[index] * 0.5 + vec2<f32>(0.5);
  return out;
}

@fragment
fn fragmentMain(in: VertexOut) -> @location(0) vec4<f32> {
  let dims = vec2<f32>(textureDimensions(velocityTexture));
  let sampleCoord = vec2<i32>(clamp(in.uv * dims, vec2<f32>(0.0), dims - 1.0));
  let velocity = textureLoad(velocityTexture, sampleCoord, 0).xy;
  let density = textureLoad(densityTexture, sampleCoord, 0).x;
  let wave = vec2<f32>(
    sin((in.uv.y + velocity.x) * 18.0 + params.time * 0.9),
    cos((in.uv.x + velocity.y) * 16.0 - params.time * 0.8)
  ) * 0.003;
  let warpedUv = clamp(in.uv + velocity * params.displacement + wave * density, vec2<f32>(0.0), vec2<f32>(1.0));

  let typographyUv = vec2<f32>(warpedUv.x, 1.0 - warpedUv.y);
  let text = textureSample(typographyTexture, typographySampler, typographyUv);
  let caustic = 0.5 + 0.5 * sin((in.uv.x + velocity.y) * 36.0 + params.time);
  let liquid = vec3<f32>(0.04, 0.52, 1.0) * density * params.inkBoost;
  let highlight = vec3<f32>(0.96, 0.96, 0.98) * caustic * density * 0.18;
  let vignetteUv = in.uv - vec2<f32>(0.5);
  let vignette = smoothstep(0.9, 0.12, length(vignetteUv));
  let metalBand = 0.5 + 0.5 * sin(in.uv.x * 5.0 + in.uv.y * 3.5 + params.time * 0.3);
  let base = vec3<f32>(0.006, 0.007, 0.01) + vec3<f32>(0.015, 0.055, 0.075) * metalBand * vignette;
  let textGlow = text.rgb * (0.74 + density * 0.45);
  let inkVeil = liquid * (0.28 + caustic * 0.2);

  return vec4<f32>(base + textGlow + inkVeil + highlight, 1.0);
}
`;
