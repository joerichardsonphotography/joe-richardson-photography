import { ImageResponse } from "next/og";
import { isFilled, asImageSrc } from "@prismicio/client";
import { createClient } from "@/prismicio";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Generates the favicon from the signature mark image set in the Settings
 * document, so it stays in sync with whatever's uploaded there rather than
 * being a separate static file to remember to update. Falls back to a
 * plain "JR" monogram if no signature mark is set (matches the fallback
 * already used for the corner mark in the root layout).
 */
export default async function Icon() {
  const client = createClient();
  const settings = await client.getSingle("settings").catch(() => null);

  const markUrl =
    settings && isFilled.image(settings.data.signature_mark)
      ? asImageSrc(settings.data.signature_mark, { w: 128, h: 128, fit: "max" })
      : null;

  if (markUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FAFAF8",
          }}
        >
          <img
            src={markUrl}
            alt=""
            width={26}
            height={26}
            style={{ objectFit: "contain" }}
          />
        </div>
      ),
      { ...size },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAF8",
          color: "#111111",
          fontSize: 16,
          fontWeight: 900,
          fontFamily: "sans-serif",
        }}
      >
        JR
      </div>
    ),
    { ...size },
  );
}
