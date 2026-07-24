import { ImageResponse } from "next/og";

export const alt = "ExperienceVegas personalized Las Vegas trip planner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09070d",
          color: "white",
          padding: "72px 78px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800 }}>
          Experience<span style={{ color: "#e879f9" }}>Vegas</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
          <div style={{ color: "#fde68a", fontSize: 24, fontWeight: 800, textTransform: "uppercase", letterSpacing: 3 }}>
            Personalized Las Vegas trip planner
          </div>
          <div style={{ marginTop: 22, fontSize: 72, lineHeight: 1.05, fontWeight: 900 }}>
            Build a Vegas trip that actually fits.
          </div>
          <div style={{ marginTop: 28, fontSize: 29, lineHeight: 1.35, color: "#d4d4d8" }}>
            Real dates, useful events, food, hotels, free stops, budgets, and realistic timing.
          </div>
        </div>
        <div style={{ display: "flex", width: "100%", height: 10 }}>
          <div style={{ width: "68%", background: "#fbbf24" }} />
          <div style={{ flex: 1, background: "#d946ef" }} />
        </div>
      </div>
    ),
    size,
  );
}
