"use client";

/**
 * Argyph Case Study — Act 3 Execution Island #03
 *
 * Local-First MCP Server for AI Coding Agents (Rust).
 * - 3D, draggable tree-sitter syntax tree
 * - Hybrid BM25 + vector search panel with "indexing…" feedback
 * - Local-first stats (0 cloud · 0 API keys)
 * - How-it-works 3-step flow
 *
 * Accent: #FF9F0A (Rust orange).
 */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Box,
  Code,
  Cpu,
  FolderTree,
  GitBranch,
  Network,
  Search,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ARGYPH_STATS, PROJECTS } from "@/lib/content";

const project = PROJECTS[2];
const ACCENT = project.accent.hex; // #FF9F0A

/* ───────────── tree-sitter symbol graph ───────────── */

interface SymbolNode {
  name: string;
  kind: "module" | "fn" | "struct" | "impl" | "field" | "enum";
  children?: SymbolNode[];
}

const TREE: SymbolNode = {
  name: "module argyph",
  kind: "module",
  children: [
    {
      name: "parse_module",
      kind: "fn",
      children: [
        { name: "tokenize", kind: "fn" },
        { name: "build_ast", kind: "fn" },
      ],
    },
    {
      name: "Token",
      kind: "struct",
      children: [
        { name: "kind: TokenKind", kind: "field" },
        { name: "span: Range", kind: "field" },
      ],
    },
    {
      name: "impl Token",
      kind: "impl",
      children: [
        { name: "new()", kind: "fn" },
        { name: "is_ident()", kind: "fn" },
      ],
    },
    {
      name: "SymbolGraph",
      kind: "struct",
      children: [
        { name: "nodes: Vec<Node>", kind: "field" },
        { name: "edges: Vec<Edge>", kind: "field" },
      ],
    },
    {
      name: "impl SymbolGraph",
      kind: "impl",
      children: [
        { name: "search()", kind: "fn" },
        { name: "embed()", kind: "fn" },
      ],
    },
    {
      name: "McpServer",
      kind: "struct",
      children: [{ name: "serve_context()", kind: "fn" }],
    },
  ],
};

const KIND_META: Record<
  SymbolNode["kind"],
  { color: string; label: string }
> = {
  module: { color: ACCENT, label: "mod" },
  fn: { color: "#0A84FF", label: "fn" },
  struct: { color: "#30D158", label: "struct" },
  impl: { color: "#BF5AF2", label: "impl" },
  field: { color: "#86868B", label: "field" },
  enum: { color: "#FF375F", label: "enum" },
};

function countMatches(node: SymbolNode, q: string): number {
  const self = node.name.toLowerCase().includes(q) ? 1 : 0;
  if (!node.children) return self;
  return self + node.children.reduce((a, c) => a + countMatches(c, q), 0);
}

export default function ArgyphCaseStudy() {
  /* ── 3D drag rotation ── */
  const [rot, setRot] = useState({ x: 12, y: -22 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setRot((r) => ({
      x: Math.max(-45, Math.min(45, r.x - dy * 0.4)),
      y: r.y + dx * 0.5,
    }));
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  /* ── search ── */
  const [query, setQuery] = useState("");
  // resolvedQuery lags behind query by the debounce window; the gap between
  // them is what produces the "indexing…" status without synchronous setState.
  const [resolvedQuery, setResolvedQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return; // nothing to schedule; phase derives "ready" below
    const id = setTimeout(() => {
      setResolvedQuery(trimmed);
      setMatchCount(countMatches(TREE, trimmed.toLowerCase()));
    }, 420);
    return () => clearTimeout(id);
  }, [query]);

  const trimmedQuery = query.trim();
  const phase: "ready" | "indexing" | "matched" = !trimmedQuery
    ? "ready"
    : resolvedQuery === trimmedQuery
      ? "matched"
      : "indexing";

  return (
    <div
      className="fluid-scroll overflow-y-auto max-h-[85vh] p-6 md:p-10"
      style={{ "--accent": ACCENT } as CSSProperties}
    >
      <div className="space-y-12">
        {/* ───────────── HEADER ───────────── */}
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-ui text-[var(--accent)]">/ {project.index}</span>
            <Badge
              variant="outline"
              className="font-ui border-[rgba(255,159,10,0.4)] bg-[rgba(255,159,10,0.08)] text-[var(--text-primary)]"
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
          <p className="font-body text-[var(--text-secondary)] max-w-2xl">
            {project.summary}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-ui text-[var(--text-secondary)]">
            <span>{project.category}</span>
            <span aria-hidden>·</span>
            <span>{project.year}</span>
            <span aria-hidden>·</span>
            <span>Rust · tree-sitter · MCP</span>
          </div>
        </header>

        <Separator className="bg-[rgba(255,159,10,0.15)]" />

        {/* ───────────── 3D SYNTAX TREE + SEARCH ───────────── */}
        <section className="space-y-5">
          <SectionLabel icon={FolderTree} label="Tree-Sitter Symbol Graph" />

          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
            {/* draggable tree canvas */}
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="relative rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
              style={{
                background:
                  "radial-gradient(120% 80% at 30% 0%, rgba(255,159,10,0.08), transparent 60%), rgba(10,10,15,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
                minHeight: 380,
                touchAction: "none",
              }}
            >
              {/* hint */}
              <div className="absolute top-3 left-4 z-10 font-ui text-[9px] text-[var(--text-secondary)]">
                DRAG TO ROTATE · TREE-SITTER AST
              </div>
              <div className="absolute top-3 right-4 z-10 font-mono text-[9px] text-[var(--text-secondary)]">
                rotX {rot.x.toFixed(0)}° · rotY {rot.y.toFixed(0)}°
              </div>

              {/* grid floor */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,159,10,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,159,10,0.07) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                  maskImage:
                    "radial-gradient(circle at 50% 50%, black, transparent 75%)",
                  WebkitMaskImage:
                    "radial-gradient(circle at 50% 50%, black, transparent 75%)",
                }}
              />

              {/* the 3D tree */}
              <div
                className="absolute inset-0 flex items-center justify-center p-6"
                style={{ perspective: "1100px" }}
              >
                <motion.div
                  animate={{ rotateX: rot.x, rotateY: rot.y }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 18,
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center center",
                  }}
                >
                  <TreeView node={TREE} query={query} depth={0} />
                </motion.div>
              </div>
            </div>

            {/* search panel */}
            <div
              className="rounded-xl p-5 border border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,15,0.5)] flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-[var(--accent)]" />
                <span className="font-ui text-[11px] text-[var(--text-primary)]">
                  HYBRID SEARCH
                </span>
                <span className="font-ui text-[9px] text-[var(--text-secondary)] ml-auto">
                  BM25 + VECTOR
                </span>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="search symbols… (try “symbol” or “parse”)"
                  className="w-full rounded-lg pl-9 pr-3 py-2.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:bg-[rgba(255,159,10,0.05)] transition-colors"
                  aria-label="Search tree symbols"
                />
              </div>

              {/* status */}
              <div className="flex items-center gap-2 mb-4 min-h-[20px]">
                {phase === "ready" && (
                  <span className="font-ui text-[10px] text-[var(--text-secondary)]">
                    ● INDEX READY · {countTotal(TREE)} SYMBOLS
                  </span>
                )}
                {phase === "indexing" && (
                  <motion.span
                    className="font-ui text-[10px] text-[var(--accent)] flex items-center gap-1.5"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    INDEXING…
                  </motion.span>
                )}
                {phase === "matched" && (
                  <span className="font-ui text-[10px] text-[var(--text-primary)]">
                    <span style={{ color: ACCENT }}>
                      {matchCount > 0 ? `MATCHED ${matchCount}` : "NO MATCHES"}
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {" "}
                      · RERANKED BY EMBEDDING DISTANCE
                    </span>
                  </span>
                )}
              </div>

              {/* legend */}
              <div className="mt-auto space-y-2">
                <div className="font-ui text-[9px] text-[var(--text-secondary)] mb-2">
                  SYMBOL KINDS
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(KIND_META).map(([key, meta]) => (
                    <div
                      key={key}
                      className="flex items-center gap-1.5 font-ui text-[9px] text-[var(--text-secondary)]"
                    >
                      <span
                        className="h-2 w-2 rounded-sm"
                        style={{
                          background: meta.color,
                          boxShadow: `0 0 6px ${meta.color}80`,
                        }}
                      />
                      {meta.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
                icon: Search,
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
                  animate={{ opacity: 1, y: 0 }}
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
                  <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                    {title}
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                    {detail}
                  </p>
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
                    borderColor: highlight
                      ? `${ACCENT}40`
                      : "rgba(255,255,255,0.06)",
                    boxShadow: highlight ? `0 0 18px ${ACCENT}14` : "none",
                  }}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="font-mono text-3xl md:text-4xl font-bold"
                      style={{
                        color: highlight ? ACCENT : "var(--text-primary)",
                      }}
                    >
                      {stat.value}
                    </span>
                    {stat.unit && (
                      <span className="font-ui text-[10px] text-[var(--text-secondary)]">
                        {stat.unit}
                      </span>
                    )}
                  </div>
                  <div className="font-ui text-[10px] text-[var(--text-secondary)] mt-2">
                    {stat.label}
                  </div>
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
                style={{
                  background: `${ACCENT}0c`,
                  border: `1px solid ${ACCENT}33`,
                }}
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

/* ───────────── recursive tree view ───────────── */

function TreeView({
  node,
  query,
  depth,
}: {
  node: SymbolNode;
  query: string;
  depth: number;
}) {
  const meta = KIND_META[node.kind];
  const q = query.trim().toLowerCase();
  const matches = q.length > 0 && node.name.toLowerCase().includes(q);
  const hasChildren = !!node.children?.length;

  return (
    <div className="relative" style={{ transformStyle: "preserve-3d" }}>
      <div
        className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 font-mono text-xs transition-all"
        style={{
          background: matches ? `${meta.color}28` : `${meta.color}10`,
          border: `1px solid ${matches ? meta.color : `${meta.color}44`}`,
          color: "var(--text-primary)",
          boxShadow: matches
            ? `0 0 18px ${meta.color}99, 0 0 4px ${meta.color}`
            : `0 0 8px ${meta.color}22`,
          transform: `translateZ(${Math.max(0, 24 - depth * 4)}px)`,
        }}
      >
        <span
          className="font-ui text-[8px] px-1 rounded"
          style={{
            background: `${meta.color}22`,
            color: meta.color,
          }}
        >
          {meta.label}
        </span>
        <span>{node.name}</span>
      </div>

      {hasChildren && (
        <div
          className="ml-3 mt-2 pl-4 space-y-2"
          style={{
            borderLeft: `1px solid ${meta.color}33`,
          }}
        >
          {node.children!.map((child, i) => (
            <div key={i} className="relative">
              {/* horizontal connector */}
              <span
                className="absolute left-[-1px] top-1/2 -translate-y-1/2 h-px w-3"
                style={{ background: `${meta.color}33` }}
                aria-hidden
              />
              <TreeView node={child} query={query} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────── helpers ───────────── */

function countTotal(node: SymbolNode): number {
  if (!node.children) return 1;
  return 1 + node.children.reduce((a, c) => a + countTotal(c), 0);
}

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
      <span className="font-ui text-[11px] text-[var(--text-secondary)]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[rgba(255,255,255,0.06)]" />
    </div>
  );
}
