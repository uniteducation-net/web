import { ImageResponse } from "next/og";

export const alt = "UnitEd Resources — open teaching-resources collection";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social card for the resources subtree, generated at build time.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0d416f",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#4fcfbd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
              color: "#0d416f",
            }}
          >
            U
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#ffffff" }}>
            UnitEd
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: -2,
            }}
          >
            Open Teaching Resources
          </div>
          <div style={{ fontSize: 30, color: "#4fcfbd", lineHeight: 1.35 }}>
            Explore the UnitEd resource collection as an interactive graph.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
