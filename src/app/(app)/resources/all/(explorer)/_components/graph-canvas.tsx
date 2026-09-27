"use client";

// The react-force-graph-2d instance — the only file that touches the engine.
// All engine contact follows two React-Compiler-safe rules: the graph ref
// and engine-mutated node positions (x/y) are read inside effects and event
// handlers only, never during render; selection reaches the canvas painter
// through a ref so nodeCanvasObject never closes over stale state.
//
// Graph model: nodes are markdown docs, visible edges are `[[wikilink]]`s.
// Because the repo is still being linked up, each folder's nodes are also
// chained by invisible "spine" links (linkVisibility hides them, but d3's
// link force still clusters the folder) — the zero-edge graph still renders
// as sensible folder clusters instead of a hairball.

import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from "react-force-graph-2d";
import type { ResourcesGraphData } from "@/lib/resources-graph";
import type { FocusRequest } from "./resources-explorer";

interface GNode {
  id: string;
  title: string;
  folder: string;
  topFolder: string;
  type: string | null;
}
interface GLink {
  structural?: boolean;
}
type N = NodeObject<GNode>;
type L = LinkObject<GNode, GLink>;

interface Palette {
  node: (node: N) => string;
  primary: string;
  border: string;
  label: string;
}

/** Resolve the design tokens once per mount — canvas paints with computed
 *  values, so light/dark and theme tweaks apply without hardcoded colors.
 *  Frontmatter `type` colors known resource kinds; everything else falls
 *  back to a per-top-folder chart color. */
function readPalette(sortedTopFolders: string[]): Palette {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    css.getPropertyValue(name).trim() || fallback;
  const primary = token("--primary", "#2aa198");
  const secondary = token("--secondary", "#1d3461");
  const charts = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"].map(
    (name) => token(name, primary),
  );
  const typeColor: Record<string, string> = {
    native: primary,
    link: secondary,
    provider: charts[0],
    logic: charts[1],
    // legacy kinds (pre-ICM repo layout)
    template: primary,
    guide: secondary,
    rubric: charts[0],
    routine: charts[1],
  };
  const folderColor = new Map(
    sortedTopFolders.map((folder, i) => [folder, charts[i % charts.length]]),
  );
  return {
    primary,
    border: token("--border", "#cccccc"),
    label: token("--muted-foreground", "#666666"),
    node: (node) =>
      (node.type && typeColor[node.type]) ||
      folderColor.get(node.topFolder) ||
      charts[0],
  };
}

interface GraphCanvasProps {
  data: ResourcesGraphData;
  selectedPath: string | null;
  focusReq: FocusRequest | null;
  onNodeSelect: (path: string) => void;
  onBackgroundClick: () => void;
}

export function GraphCanvas({
  data,
  selectedPath,
  focusReq,
  onNodeSelect,
  onBackgroundClick,
}: GraphCanvasProps) {
  const fgRef = useRef<ForceGraphMethods<N, L> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Copy nodes/links into the memo — the engine mutates node objects (x/y)
  // and our props must stay pristine. Spine links are appended here.
  // Routing files (CONTEXT/README/CLAUDE) stay in the tree and reader but
  // are not graph nodes — they would flood the canvas with contracts.
  const graphData = useMemo(() => {
    const docs = data.docs.filter((doc) => !doc.routing);
    const nodeIds = new Set(docs.map((doc) => doc.path));
    const nodes: N[] = docs.map((doc) => ({
      id: doc.path,
      title: doc.title,
      folder: doc.folder,
      topFolder: doc.topFolder,
      type: doc.type,
    }));
    const links: L[] = data.links
      .filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target))
      .map((link) => ({
        source: link.source,
        target: link.target,
      }));
    const byFolder = new Map<string, N[]>();
    for (const node of nodes) {
      const group = byFolder.get(node.folder);
      if (group) group.push(node);
      else byFolder.set(node.folder, [node]);
    }
    for (const group of byFolder.values()) {
      for (let i = 1; i < group.length; i++) {
        links.push({
          source: group[i - 1].id,
          target: group[i].id,
          structural: true,
        });
      }
    }
    return { nodes, links };
  }, [data]);

  const palette = useMemo(() => {
    const topFolders = [
      ...new Set(data.docs.filter((d) => !d.routing).map((d) => d.topFolder)),
    ].sort();
    return readPalette(topFolders);
  }, [data]);

  // Selection reaches painters through a ref (the canvas render loop runs
  // continuously, so the next frame picks the change up automatically).
  const selectedRef = useRef<string | null>(null);
  useEffect(() => {
    selectedRef.current = selectedPath;
  }, [selectedPath]);

  // Track the wrapper's pixel size for the canvas.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Dev-only handle for E2E tests (zoom assertions, node positions).
  const canvasMounted = size.width > 0;
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    (window as unknown as { __fg?: unknown }).__fg = fgRef.current;
    return () => {
      delete (window as unknown as { __fg?: unknown }).__fg;
    };
  }, [canvasMounted]);

  // Tighter spacing inside folder clusters, looser between linked docs.
  useEffect(() => {
    const linkForce = fgRef.current?.d3Force("link");
    linkForce?.distance?.((link: L) => (link.structural ? 24 : 90));
  }, [graphData]);

  // Tree → graph zoom. Folder focus frames the whole cluster (zoomToFit's
  // nodeFilter covers nested subfolders too); node focus centers + zooms.
  // Positions may not exist on the very first frames — stash the request
  // and apply it when the engine settles.
  const pendingFocusRef = useRef<FocusRequest | null>(null);
  const framedDataRef = useRef<unknown>(null);
  useEffect(() => {
    if (!focusReq) return;
    const graph = fgRef.current;
    if (!graph) {
      pendingFocusRef.current = focusReq;
      return;
    }
    if (focusReq.kind === "folder") {
      graph.zoomToFit(
        600,
        80,
        (node) =>
          node.folder === focusReq.path ||
          node.folder.startsWith(`${focusReq.path}/`),
      );
      return;
    }
    const node = graphData.nodes.find((n) => n.id === focusReq.path);
    if (node?.x == null || node.y == null) {
      pendingFocusRef.current = focusReq;
      return;
    }
    graph.centerAt(node.x, node.y, 600);
    // Readable-label zoom without zooming out from an already closer view:
    // 2.4 for a zoomed-out overview, capped at 6 for tiny graphs whose
    // initial zoomToFit is already deep.
    graph.zoom(Math.max(2.4, Math.min(graph.zoom(), 6)), 600);
  }, [focusReq, graphData]);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      {size.width > 0 && size.height > 0 && (
        <ForceGraph2D<GNode, GLink>
          ref={fgRef}
          width={size.width}
          height={size.height}
          graphData={graphData}
          backgroundColor="rgba(0,0,0,0)"
          warmupTicks={100}
          cooldownTime={2500}
          nodeRelSize={4}
          nodeLabel={(node) => node.title}
          linkVisibility={(link) => !link.structural}
          linkColor={() => palette.border}
          onEngineStop={() => {
            const graph = fgRef.current;
            if (!graph) return;
            if (pendingFocusRef.current) {
              const pending = pendingFocusRef.current;
              pendingFocusRef.current = null;
              if (pending.kind === "folder") {
                graph.zoomToFit(
                  600,
                  80,
                  (node) =>
                    node.folder === pending.path ||
                    node.folder.startsWith(`${pending.path}/`),
                );
              } else {
                const node = graphData.nodes.find((n) => n.id === pending.path);
                if (node?.x != null && node.y != null) {
                  graph.centerAt(node.x, node.y, 600);
                  graph.zoom(Math.max(2.4, Math.min(graph.zoom(), 6)), 600);
                }
              }
              return;
            }
            // Open fully framed, already settled — once per data load.
            if (framedDataRef.current !== graphData) {
              framedDataRef.current = graphData;
              graph.zoomToFit(500, 48);
            }
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            const selected = node.id === selectedRef.current;
            const r = selected ? 5 : 4;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = palette.node(node);
            ctx.fill();
            if (selected) {
              ctx.beginPath();
              ctx.arc(x, y, r + 2.5, 0, 2 * Math.PI);
              ctx.strokeStyle = palette.primary;
              ctx.lineWidth = 1.6;
              ctx.stroke();
            }
            // Labels only when zoomed in enough to read them (and always for
            // the selected node) — 2k labels at overview zoom is soup.
            if (globalScale >= 1.6 || selected) {
              const fontSize = 10 / globalScale;
              ctx.font = `${fontSize}px Inter, sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillStyle = selected ? palette.primary : palette.label;
              const label =
                node.title.length > 40
                  ? `${node.title.slice(0, 39)}…`
                  : node.title;
              ctx.fillText(label, x, y + r + fontSize * 0.6);
            }
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            // Generous hit area — small nodes stay clickable at 2k scale.
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, 7, 0, 2 * Math.PI);
            ctx.fill();
          }}
          onNodeClick={(node) => {
            if (node.id != null) onNodeSelect(String(node.id));
          }}
          onBackgroundClick={() => onBackgroundClick()}
        />
      )}
    </div>
  );
}
