import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #197443 0%, #0f4d2c 100%)",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          SW
        </div>
      </div>
    ),
    { ...size }
  );
}
