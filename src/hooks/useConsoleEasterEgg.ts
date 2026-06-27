"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { CONTACT } from "@/lib/content";
import { useFluidStore } from "@/lib/store";

type ConsoleCommand = "help" | "hire" | "monkeyclaw" | "flowe" | "clear";
type ConsoleFn = (command?: string) => void;

declare global {
  interface Window {
    run?: ConsoleFn;
    ezzy?: ConsoleFn;
  }
}

const RESUME_URL = "/Ezzy-Rappeport-Resume.docx";

const banner = String.raw`
███████╗███████╗███████╗██╗   ██╗
██╔════╝╚══███╔╝╚══███╔╝╚██╗ ██╔╝
█████╗    ███╔╝   ███╔╝  ╚████╔╝
██╔══╝   ███╔╝   ███╔╝    ╚██╔╝
███████╗███████╗███████╗   ██║
╚══════╝╚══════╝╚══════╝   ╚═╝
`;

const bannerStyle = [
  "color:#00ff66",
  "background:#050507",
  "font-family:JetBrains Mono,Fira Code,ui-monospace,monospace",
  "font-size:12px",
  "line-height:1.15",
  "text-shadow:0 0 12px rgba(0,255,102,.45)",
].join(";");

const promptStyle = [
  "color:#f5f5f7",
  "background:#050507",
  "font-family:JetBrains Mono,Fira Code,ui-monospace,monospace",
  "font-weight:700",
].join(";");

function printBanner(log: Console["log"]) {
  log("%c%s", bannerStyle, banner);
  log(
    "%c> EzzyOS v1.0. Type run('help') for commands.",
    promptStyle,
  );
}

function normalizeCommand(command?: string): ConsoleCommand | "unknown" {
  const normalized = (command ?? "help").trim().toLowerCase();
  if (
    normalized === "help" ||
    normalized === "hire" ||
    normalized === "monkeyclaw" ||
    normalized === "flowe" ||
    normalized === "clear"
  ) {
    return normalized;
  }
  return "unknown";
}

function scrollToContact() {
  const contact = document.getElementById("contact");
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight;

  window.scrollTo({ top: maxScroll, behavior: "smooth" });

  if (!contact) return;
  window.setTimeout(() => {
    gsap.fromTo(
      contact,
      { filter: "brightness(1.8)", scale: 1.01 },
      {
        filter: "brightness(1)",
        scale: 1,
        duration: 0.9,
        ease: "power2.out",
      },
    );
  }, 650);
}

function pulseFlowE() {
  const canvas = document.querySelector<HTMLElement>("[data-fluid-canvas]");
  const previousAccent = useFluidStore.getState().projectAccent;

  canvas?.classList.add("fluid-flowe-easter");
  useFluidStore.getState().set({
    projectAccent: {
      r: 0.04,
      g: 0.52,
      b: 1,
      hr: 0.37,
      hg: 0.36,
      hb: 0.9,
    },
  });

  window.setTimeout(() => {
    canvas?.classList.remove("fluid-flowe-easter");
    useFluidStore.getState().set({ projectAccent: previousAccent });
  }, 3000);
}

function commandRunner(log: Console["log"], clear: Console["clear"]): ConsoleFn {
  return (command = "help") => {
    switch (normalizeCommand(command)) {
      case "help":
        log(
          "%cEzzyOS commands\n%c  hire       Download resume + jump to contact\n  monkeyclaw  Print the 5-stage AI security loop\n  flowe      Tint the fluid canvas Apple Blue for 3s\n  clear      Clear and redraw this console",
          promptStyle,
          "color:#00ff66;font-family:JetBrains Mono,Fira Code,ui-monospace,monospace",
        );
        break;
      case "hire":
        log(
          "%cResume:%c %s\n%cContact:%c %s",
          promptStyle,
          "color:#00ff66",
          `${window.location.origin}${RESUME_URL}`,
          promptStyle,
          "color:#00ff66",
          CONTACT.email,
        );
        scrollToContact();
        break;
      case "monkeyclaw":
        log(
          "%cMonkeyClaw security loop\n%c├── 1. Red Team: LoRA Nemotron attacker probes NemoClaw\n├── 2. Judge: LLM scorer validates exploit severity\n├── 3. Repro: deterministic harness locks the failure\n├── 4. Blue Team: patch agent targets root cause\n└── 5. Purple Team: 8-gate verifier checks regression + telemetry",
          promptStyle,
          "color:#00ff66;font-family:JetBrains Mono,Fira Code,ui-monospace,monospace",
        );
        break;
      case "flowe":
        log("%cFlowE mode engaged: #0A84FF for 3 seconds.", promptStyle);
        pulseFlowE();
        break;
      case "clear":
        clear();
        printBanner(log);
        break;
      default:
        log(
          "%cUnknown command. Try run('help').",
          "color:#ff375f;font-family:JetBrains Mono,Fira Code,ui-monospace,monospace",
        );
    }
  };
}

function installGlobalCommand(name: "run" | "ezzy", run: ConsoleFn) {
  Object.defineProperty(window, name, {
    value: run,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, name, {
    value: run,
    configurable: true,
    writable: true,
  });
}

export function useConsoleEasterEgg() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const original = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      clear: console.clear.bind(console),
    };

    console.log = () => undefined;
    console.warn = () => undefined;
    console.error = () => undefined;
    console.info = () => undefined;
    let activeRun: ConsoleFn | undefined;

    const timer = window.setTimeout(() => {
      console.log = original.log;
      console.warn = original.warn;
      console.error = original.error;
      console.info = original.info;

      const run = commandRunner(original.log, original.clear);
      activeRun = run;
      installGlobalCommand("run", run);
      installGlobalCommand("ezzy", run);
      document.documentElement.dataset.ezzyCli = "ready";
      printBanner(original.log);
    }, 140);

    return () => {
      window.clearTimeout(timer);
      console.log = original.log;
      console.warn = original.warn;
      console.error = original.error;
      console.info = original.info;
      if (window.run === activeRun) delete window.run;
      if (window.ezzy === activeRun) delete window.ezzy;
      if (document.documentElement.dataset.ezzyCli === "ready") {
        delete document.documentElement.dataset.ezzyCli;
      }
    };
  }, []);
}
