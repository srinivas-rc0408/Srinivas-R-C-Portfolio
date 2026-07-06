import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050508",
          borderRadius: "50%",
          border: "1px solid #DC2626",
        }}
      >
        <span style={{ color: "#DC2626", fontSize: 20, fontWeight: 700 }}>S</span>
      </div>
    ),
    size
  );
}
