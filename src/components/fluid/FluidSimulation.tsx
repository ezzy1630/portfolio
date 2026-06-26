"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { advectFrag, baseVert, displayFrag, splatFrag } from "./fluidShaders";
import { useFluidStore } from "@/lib/store";

interface Props {
  /** 0.25 | 0.35 | 0.5 — sim resolution scale */
  resolutionScale: number;
}

/**
 * Ping-pong FBO fluid simulation rendered on a full-screen quad.
 *
 * Architecture:
 *  - An OFFSCREEN scene + ortho camera + two ping-pong render targets
 *    run the advect & splat passes (writing velocity/ink into the RTs).
 *  - A DISPLAY mesh with the iridescent display shader is added to
 *    R3F's own scene, so R3F's render loop composites it to the canvas
 *    each frame (we only update its uniforms in useFrame).
 */
export default function FluidSimulation({ resolutionScale }: Props) {
  const { gl, size, scene: r3fScene } = useThree();

  const rtA = useRef<THREE.WebGLRenderTarget | null>(null);
  const rtB = useRef<THREE.WebGLRenderTarget | null>(null);
  const readIdx = useRef(0);

  // offscreen scene for sim passes
  const offSceneRef = useRef<THREE.Scene | null>(null);
  const offCamRef = useRef<THREE.OrthographicCamera | null>(null);
  const advectMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const splatMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const displayMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const advectMeshRef = useRef<THREE.Mesh | null>(null);
  const splatMeshRef = useRef<THREE.Mesh | null>(null);
  const displayMeshRef = useRef<THREE.Mesh | null>(null);

  const localVel = useRef(new THREE.Vector2());
  const cssAcc = useRef(0);

  // ---- One-time creation ----
  useEffect(() => {
    const offScene = new THREE.Scene();
    const offCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.PlaneGeometry(2, 2);

    const advectMat = new THREE.ShaderMaterial({
      vertexShader: baseVert,
      fragmentShader: advectFrag,
      uniforms: {
        uSim: { value: null as THREE.Texture | null },
        uTexelSize: { value: new THREE.Vector2() },
        uDt: { value: 0.016 },
        uVelocityDissipation: { value: 0.985 },
        uInkDissipation: { value: 0.972 },
        uScrollForce: { value: 0 },
        uTime: { value: 0 },
      },
    });
    const splatMat = new THREE.ShaderMaterial({
      vertexShader: baseVert,
      fragmentShader: splatFrag,
      uniforms: {
        uSim: { value: null as THREE.Texture | null },
        uPoint: { value: new THREE.Vector2(0.5, 0.5) },
        uVelocity: { value: new THREE.Vector2(0, 0) },
        uRadius: { value: 0.0009 },
        uInk: { value: 0.45 },
        uAspect: { value: 1 },
      },
    });
    const displayMat = new THREE.ShaderMaterial({
      vertexShader: baseVert,
      fragmentShader: displayFrag,
      uniforms: {
        uSim: { value: null as THREE.Texture | null },
        uTime: { value: 0 },
        uPartAmount: { value: 0 },
        uVoidAmount: { value: 0 },
        uGlassAmount: { value: 0 },
        uOrbitAmount: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uVelocityBoost: { value: 0 },
      },
    });

    const advectMesh = new THREE.Mesh(quad, advectMat);
    const splatMesh = new THREE.Mesh(quad, splatMat);
    advectMesh.frustumCulled = false;
    splatMesh.frustumCulled = false;
    advectMesh.visible = false;
    splatMesh.visible = false;
    offScene.add(advectMesh, splatMesh);

    // display mesh -> added to R3F scene so R3F composites it
    const displayMesh = new THREE.Mesh(quad, displayMat);
    displayMesh.frustumCulled = false;
    displayMesh.renderOrder = -1;
    r3fScene.add(displayMesh);

    offSceneRef.current = offScene;
    offCamRef.current = offCam;
    advectMatRef.current = advectMat;
    splatMatRef.current = splatMat;
    displayMatRef.current = displayMat;
    advectMeshRef.current = advectMesh;
    splatMeshRef.current = splatMesh;
    displayMeshRef.current = displayMesh;

    return () => {
      offScene.remove(advectMesh, splatMesh);
      r3fScene.remove(displayMesh);
      advectMat.dispose();
      splatMat.dispose();
      displayMat.dispose();
      quad.dispose();
      offSceneRef.current = null;
      offCamRef.current = null;
      advectMatRef.current = null;
      splatMatRef.current = null;
      displayMatRef.current = null;
      advectMeshRef.current = null;
      splatMeshRef.current = null;
      displayMeshRef.current = null;
    };
  }, [r3fScene]);

  // ---- (Re)create render targets when size or scale changes ----
  useEffect(() => {
    const w = Math.max(2, Math.floor(size.width * resolutionScale));
    const h = Math.max(2, Math.floor(size.height * resolutionScale));
    rtA.current?.dispose();
    rtB.current?.dispose();
    const opts: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
    };
    rtA.current = new THREE.WebGLRenderTarget(w, h, opts);
    rtB.current = new THREE.WebGLRenderTarget(w, h, opts);
    if (advectMatRef.current) {
      advectMatRef.current.uniforms.uTexelSize.value.set(1 / w, 1 / h);
    }
    if (displayMatRef.current) {
      displayMatRef.current.uniforms.uResolution.value.set(size.width, size.height);
    }
    if (splatMatRef.current) {
      splatMatRef.current.uniforms.uAspect.value = size.width / size.height;
    }
    readIdx.current = 0;
  }, [size, resolutionScale]);

  useFrame((_, delta) => {
    const offScene = offSceneRef.current;
    const offCam = offCamRef.current;
    const advectMat = advectMatRef.current;
    const splatMat = splatMatRef.current;
    const displayMat = displayMatRef.current;
    const advectMesh = advectMeshRef.current;
    const splatMesh = splatMeshRef.current;
    if (!offScene || !offCam || !advectMat || !splatMat || !displayMat || !advectMesh || !splatMesh)
      return;

    const dt = Math.min(delta, 0.033);
    const state = useFluidStore.getState();
    let read = readIdx.current === 0 ? rtA.current : rtB.current;
    let write = readIdx.current === 0 ? rtB.current : rtA.current;
    if (!read || !write) return;

    const time = performance.now() / 1000;

    localVel.current.x = localVel.current.x * 0.86 + state.mouseDX * 0.14;
    localVel.current.y = localVel.current.y * 0.86 + state.mouseDY * 0.14;

    // ---------- 1. ADVECT (offscreen -> RT) ----------
    advectMesh.visible = true;
    splatMesh.visible = false;
    advectMat.uniforms.uSim.value = read.texture;
    advectMat.uniforms.uDt.value = dt;
    advectMat.uniforms.uTime.value = time;
    advectMat.uniforms.uScrollForce.value = state.scrollVelocity * 0.05;
    gl.setRenderTarget(write);
    gl.render(offScene, offCam);
    [read, write] = [write, read];
    readIdx.current = 1 - readIdx.current;

    // ---------- 2. SPLAT (offscreen -> RT) ----------
    const mag = localVel.current.length();
    if (state.mouseActive && mag > 0.0008) {
      advectMesh.visible = false;
      splatMesh.visible = true;
      splatMat.uniforms.uSim.value = read.texture;
      splatMat.uniforms.uPoint.value.set(
        state.mouseX * 0.5 + 0.5,
        state.mouseY * 0.5 + 0.5
      );
      splatMat.uniforms.uVelocity.value.set(
        localVel.current.x * 55,
        localVel.current.y * 55
      );
      gl.setRenderTarget(write);
      gl.render(offScene, offCam);
      [read, write] = [write, read];
      readIdx.current = 1 - readIdx.current;
    }

    // hide offscreen meshes, reset target to canvas
    advectMesh.visible = false;
    splatMesh.visible = false;
    gl.setRenderTarget(null);

    // ---------- 3. Update DISPLAY uniforms (R3F renders the mesh) ----------
    const p = state.scrollProgress;
    let part = 0;
    if (p < 0.08) part = p / 0.08;
    else if (p < 0.14) part = 1 - (p - 0.08) / 0.06;
    let orbit = 0;
    if (p > 0.38 && p < 0.45) orbit = (p - 0.38) / 0.07;
    else if (p >= 0.45 && p < 0.78) orbit = 1;
    else if (p >= 0.78 && p < 0.82) orbit = 1 - (p - 0.78) / 0.04;
    let voidAmt = 0;
    if (p > 0.8) voidAmt = Math.min(1, (p - 0.8) / 0.08);
    const glass = state.activeProject !== null ? 1 : 0;

    displayMat.uniforms.uSim.value = read.texture;
    displayMat.uniforms.uTime.value = time;
    const du = displayMat.uniforms;
    du.uPartAmount.value += (part - du.uPartAmount.value) * 0.12;
    du.uOrbitAmount.value += (orbit - du.uOrbitAmount.value) * 0.1;
    du.uVoidAmount.value += (voidAmt - du.uVoidAmount.value) * 0.1;
    du.uGlassAmount.value += (glass - du.uGlassAmount.value) * 0.18;
    du.uVelocityBoost.value = Math.min(1, state.scrollVelocity / 50);

    // ---------- Drive DOM typography CSS vars ----------
    cssAcc.current += dt;
    if (cssAcc.current > 0.05) {
      cssAcc.current = 0;
      const v = Math.min(1, state.scrollVelocity / 55);
      const root = document.documentElement;
      root.style.setProperty("--fluid-velocity", v.toFixed(3));
      root.style.setProperty("--font-stretch", `${100 - v * 25}%`);
      root.style.setProperty(
        "--font-weight-var",
        `${400 + Math.round(v * 500)}`
      );
    }
  });

  // Dispose render targets on unmount
  useEffect(() => {
    return () => {
      rtA.current?.dispose();
      rtB.current?.dispose();
    };
  }, []);

  return null;
}
