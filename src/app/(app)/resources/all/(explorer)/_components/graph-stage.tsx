"use client";

// Boundary between the explorer shell and the graph engine: the
// react-force-graph-2d chunk is lazy-loaded with ssr:false (canvas is a
// browser-only API) — the same next/dynamic pattern the workspace editor
// uses for Tiptap. Empty/unavailable states render here so the heavy chunk
// never loads for them.

import dynamic from "next/dynamic";
import { Loader } from "@/components/ai-elements/loader";
import type { ResourcesSnapshotState } from "@/lib/resources-graph";
import type { FocusRequest } from "./resources-explorer";

const GraphCanvas = dynamic(
  () => import("./graph-canvas").then((m) => m.GraphCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <Loader size={24} className="text-muted-foreground" />
      </div>
    ),
  },
);

interface GraphStageProps {
  state: ResourcesSnapshotState;
  selectedPath: string | null;
  focusReq: FocusRequest | null;
  onNodeSelect: (path: string) => void;
  onBackgroundClick: () => void;
}

export function GraphStage({
  state,
  selectedPath,
  focusReq,
  onNodeSelect,
  onBackgroundClick,
}: GraphStageProps) {
  return (
    <div className="absolute inset-0">
      {state.status === "ready" && state.data.docs.length > 0 ? (
        <GraphCanvas
          data={state.data}
          selectedPath={selectedPath}
          focusReq={focusReq}
          onNodeSelect={onNodeSelect}
          onBackgroundClick={onBackgroundClick}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-6 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            Resources are being prepared — check back soon.
          </p>
        </div>
      )}
    </div>
  );
}
