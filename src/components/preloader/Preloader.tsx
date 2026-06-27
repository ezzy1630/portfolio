"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useProgress } from "@react-three/drei";
import { useFluidStore } from "@/lib/store";
import BootLoader from "./BootLoader";

function subscribeMounted() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/**
 * Bridges R3F/Drei asset progress into the EzzyOS boot terminal.
 * Shader compilation is not fully visible to THREE.LoadingManager, so a
 * small boot floor keeps the terminal alive long enough to cover first paint.
 */
export default function Preloader() {
  const set = useFluidStore((s) => s.set);
  const { active, progress } = useProgress();
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [visible, setVisible] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setBootProgress((current) => {
        const assetProgress = Number.isFinite(progress) ? progress : 0;
        const increment = active ? 1.4 : 4.8;
        const syntheticFloor = Math.min(100, current + increment);
        return Math.max(assetProgress, syntheticFloor);
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, [active, progress]);

  const onComplete = useCallback(() => {
    set({ isLoaded: true });
    setVisible(false);
  }, [set]);

  if (!mounted || !visible) return null;

  const displayProgress =
    !active && bootProgress >= 100 ? 100 : Math.min(99, bootProgress);

  return <BootLoader progress={displayProgress} onComplete={onComplete} />;
}
