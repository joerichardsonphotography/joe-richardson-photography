import { ImageResponse } from "next/og";
import { isFilled } from "@prismicio/client";
import { createClient } from "@/prismicio";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generates the link-preview image shown when the homepage URL is shared
 * (iMessage, WhatsApp, Instagram, Slack, etc.). Uses the most recent
 * project's cover photo so the preview always reflects real, current work
 * rather than a static image that goes stale.
 */
export default async function OpengraphImage() {
  const client = createClient();
  const [settings, projects] = await Promise.all([
    client.getSingle("settings").catch(() => null),
    client
      .getAllByType("project", {
        orderings: [
          { field: "my.project.sort_order", direction: "asc" },
          { field: "document.first_publication_date", direction: "asc" },
        ],
        limit: 1,
      })
      .catch(() => []),
  ]);

  const coverImage = projects[0]?.data.cover_image;
  const coverUrl = isFilled.image(coverImage) ? coverImage.url : null;
  const siteTitle = settings?.data.site_title || "Joe Richardson";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#FAFAF8",
        }}
      >
        {coverUrl && (
          <img
            src={coverUrl}
            alt=""
            width={size.width}
            height={size.height}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              inset: 0,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            padding: "48px",
            background: coverUrl
              ? "linear-gradient(to top, rgba(17,17,17,0.55), rgba(17,17,17,0))"
              : "none",
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: coverUrl ? "#FAFAF8" : "#111111",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              fontFamily: "sans-serif",
            }}
          >
            {siteTitle}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
