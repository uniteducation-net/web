// Static, zero-JS miniature of the /resources/all force graph — the real one
// is a lazy-loaded canvas engine built for ~2k nodes, so the landing card
// gets a hand-placed SVG echo of it: same cluster palette (guide/template/
// rubric/routine → secondary/primary/chart-1/chart-2, mirroring
// graph-canvas.tsx), chained intra-cluster edges, a few cross-cluster
// wikilinks, and one "selected" ring. Scales at any width via viewBox.

interface DemoNode {
  x: number;
  y: number;
  fill: string;
  pulseDelay?: string;
}

interface DemoEdge {
  from: number;
  to: number;
}

const NODES: DemoNode[] = [
  // guides — top-left
  { x: 60, y: 50, fill: "fill-secondary" },
  { x: 95, y: 35, fill: "fill-secondary", pulseDelay: "0s" },
  { x: 110, y: 65, fill: "fill-secondary" },
  { x: 80, y: 85, fill: "fill-secondary" },
  // templates — top-right
  { x: 215, y: 45, fill: "fill-primary" },
  { x: 250, y: 60, fill: "fill-primary" },
  { x: 235, y: 90, fill: "fill-primary" },
  // rubrics — bottom-left
  { x: 55, y: 135, fill: "fill-chart-1" },
  { x: 90, y: 120, fill: "fill-chart-1" },
  { x: 105, y: 150, fill: "fill-chart-1", pulseDelay: "0.7s" },
  // routines — bottom-right
  { x: 200, y: 130, fill: "fill-chart-2", pulseDelay: "1.4s" },
  { x: 240, y: 125, fill: "fill-chart-2" },
  { x: 225, y: 155, fill: "fill-chart-2" },
];

const EDGES: DemoEdge[] = [
  // intra-cluster chains (the real graph's folder "spines")
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 4, to: 5 },
  { from: 5, to: 6 },
  { from: 7, to: 8 },
  { from: 8, to: 9 },
  { from: 10, to: 11 },
  { from: 11, to: 12 },
  // cross-cluster wikilinks
  { from: 2, to: 4 },
  { from: 3, to: 8 },
  { from: 8, to: 12 },
];

// The ringed "selected" node, like the explorer's selection rendering.
const SELECTED = 5;

const GraphDemo = () => {
  return (
    <div className="aspect-video max-h-72 w-full px-4 py-2">
      <svg viewBox="0 0 320 180" className="h-full w-full">
        {EDGES.map((edge) => (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={NODES[edge.from].x}
            y1={NODES[edge.from].y}
            x2={NODES[edge.to].x}
            y2={NODES[edge.to].y}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        {NODES.map((node, index) => (
          <g key={`${node.x}-${node.y}`}>
            {index === SELECTED && (
              <circle
                cx={node.x}
                cy={node.y}
                r={8}
                fill="none"
                stroke="var(--primary)"
                strokeWidth={1.6}
              />
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r={5}
              className={
                node.pulseDelay !== undefined
                  ? `${node.fill} motion-safe:animate-pulse`
                  : node.fill
              }
              style={
                node.pulseDelay !== undefined
                  ? { animationDelay: node.pulseDelay }
                  : undefined
              }
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

export { GraphDemo };
