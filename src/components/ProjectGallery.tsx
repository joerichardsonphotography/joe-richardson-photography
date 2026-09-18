"use client";

import { useState } from "react";
import { Content, isFilled } from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import { PrismicRichText } from "@prismicio/react";

type ProjectDoc = Content.ProjectDocument;

/**
 * Deterministic pseudo-random offsets per image index, so every project's
 * masonry has organic-feeling but stable (no layout shift on reload) spacing.
 */
const WIDTH_PATTERN = [
  "w-full",
  "w-[85%]",
  "w-full",
  "w-[72%] ml-auto",
  "w-full",
  "w-[88%]",
  "w-[78%] ml-auto",
  "w-full",
];
const MARGIN_TOP = [0, 12, 5, 18, 0, 9, 4, 15];
const MARGIN_BOTTOM = [26, 34, 30, 28, 38, 26, 32, 28];

function GalleryImage({
  image,
  alt,
  widthClass,
  marginTopVh,
  marginBottomVh,
  priority,
}: {
  image: NonNullable<ProjectDoc["data"]["gallery"][number]["image"]>;
  alt: string;
  widthClass: string;
  marginTopVh: number;
  marginBottomVh: number;
  priority?: boolean;
}) {
  const [isLandscape, setIsLandscape] = useState(false);
  const scale = isLandscape ? 1.15 : 1;

  return (
    <figure
      className={widthClass}
      style={{
        marginTop: `calc(${marginTopVh}vh * var(--gallery-scale, 1))`,
        marginBottom: `calc(${marginBottomVh}vh * var(--gallery-scale, 1))`,
      }}
    >
      <PrismicNextImage
        field={image}
        alt=""
        fallbackAlt=""
        priority={priority}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth > img.naturalHeight) setIsLandscape(true);
        }}
        style={{ width: `${scale * 100}%`, maxWidth: `${scale * 100}%` }}
        className="h-auto block"
      />
      <span className="sr-only">{alt}</span>
    </figure>
  );
}

export function ProjectGallery({ project }: { project: ProjectDoc }) {
  const { data } = project;

  const coverImage = data.cover_image;
  const galleryImages = (data.gallery ?? [])
    .map((item) => item.image)
    .filter(isFilled.image);

  const columns: typeof galleryImages[] = [[], [], []];
  galleryImages.forEach((img, i) => columns[i % 3].push(img));

  const infoBlock = isFilled.richText(data.info) ? (
    <PrismicRichText
      field={data.info}
      components={{
        paragraph: ({ children }) => (
          <p className="leading-[1.15] tracking-[-0.01em] [word-spacing:0.15em]">
            {children}
          </p>
        ),
      }}
    />
  ) : (
    <>
      {(data.couple_name || data.wedding_date) && (
        <p className="mb-6">
          {data.couple_name}
          {data.couple_name && <br />}
          {data.wedding_date &&
            new Date(data.wedding_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
        </p>
      )}
      {data.location && (
        <p>
          Photographed in
          <br />
          <span>{data.location}</span>
        </p>
      )}
    </>
  );

  return (
    <div className="mt-[8vh] flex flex-col items-start gap-[8vw] [--gallery-scale:0.65] lg:mt-[16vh] lg:flex-row lg:[--gallery-scale:1]">
      {/* Column 1: meta info + first third of images */}
      <div className="w-full min-w-0 lg:min-w-0 lg:flex-[1.3]">
        <div className="mb-[6vh] font-display font-black text-[4.2vw] uppercase leading-[0.95] tracking-[-0.02em] text-[#111111] md:text-[1.9vw] lg:mb-[13vh]">
          {infoBlock}
        </div>
        {columns[0].map((img, i) => (
          <GalleryImage
            key={i}
            image={img}
            alt={`${data.name} — detail ${i * 3 + 1}`}
            widthClass={WIDTH_PATTERN[(i * 3) % WIDTH_PATTERN.length]}
            marginTopVh={MARGIN_TOP[(i * 3) % MARGIN_TOP.length]}
            marginBottomVh={MARGIN_BOTTOM[(i * 3) % MARGIN_BOTTOM.length]}
          />
        ))}
      </div>

      {/* Column 2: narrower, sits lower to break the grid line */}
      <div className="w-full min-w-0 lg:mt-[20vh] lg:min-w-0 lg:flex-[0.85]">
        {columns[1].map((img, i) => (
          <GalleryImage
            key={i}
            image={img}
            alt={`${data.name} — detail ${i * 3 + 2}`}
            widthClass={WIDTH_PATTERN[(i * 3 + 1) % WIDTH_PATTERN.length]}
            marginTopVh={MARGIN_TOP[(i * 3 + 1) % MARGIN_TOP.length]}
            marginBottomVh={MARGIN_BOTTOM[(i * 3 + 1) % MARGIN_BOTTOM.length]}
          />
        ))}
      </div>

      {/* Column 3: cover image pinned at top, then remaining images */}
      <div className="w-full shrink-0 lg:w-[30vw] lg:max-w-[480px]">
        {isFilled.image(coverImage) && (
          <figure className="mb-[9vh]">
            <PrismicNextImage
              field={coverImage}
              alt=""
              fallbackAlt=""
              priority
              className="block h-auto w-full"
            />
            <span className="sr-only">{data.name} — cover</span>
          </figure>
        )}
        {columns[2].map((img, i) => (
          <GalleryImage
            key={i}
            image={img}
            alt={`${data.name} — detail ${i * 3 + 3}`}
            widthClass={WIDTH_PATTERN[(i * 3 + 2) % WIDTH_PATTERN.length]}
            marginTopVh={MARGIN_TOP[(i * 3 + 2) % MARGIN_TOP.length]}
            marginBottomVh={MARGIN_BOTTOM[(i * 3 + 2) % MARGIN_BOTTOM.length]}
          />
        ))}
      </div>
    </div>
  );
}
