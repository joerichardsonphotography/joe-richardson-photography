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
  widthClass,
  marginTopVh,
  marginBottomVh,
  priority,
}: {
  image: NonNullable<ProjectDoc["data"]["gallery"][number]["image"]>;
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
      {/* No alt prop here: PrismicNextImage automatically uses the Image
          field's own alt text (written per-photo in Prismic) unless we
          override it. fallbackAlt="" only kicks in for the rare image
          that was uploaded without alt text, so it degrades to decorative
          rather than announcing nothing useful. */}
      <PrismicNextImage
        field={image}
        fallbackAlt=""
        priority={priority}
        sizes="(min-width: 1024px) 40vw, 100vw"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth > img.naturalHeight) setIsLandscape(true);
        }}
        style={{ width: `${scale * 100}%`, maxWidth: `${scale * 100}%` }}
        className="h-auto block"
      />
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

  // Mobile: every image (cover first, then gallery in order) split into
  // two independent columns, each its own vertical flex stack — genuine
  // masonry, where each column packs its own images tightly regardless
  // of the other's heights. A plain `grid grid-cols-2` was tried first
  // and looked right in theory, but CSS grid lays items out in rows
  // whose height is set by the tallest item in that row: if one column's
  // image is much taller than the other's, grid leaves a visible gap in
  // the shorter column rather than letting its next image flow up to
  // fill that space — confirmed as a real, visible bug once tested live,
  // not just a style preference. Splitting into two separate columns
  // sidesteps that entirely, since each column's items stack against
  // each other directly with no shared row height to wait for. Desktop
  // is entirely unaffected: this whole block is hidden at the lg
  // breakpoint, where the existing 3-column masonry (rendered
  // separately below) takes over instead.
  const allImagesInOrder = [
    ...(isFilled.image(coverImage) ? [coverImage] : []),
    ...galleryImages,
  ];
  const mobileColumns: (typeof allImagesInOrder)[] = [[], []];
  allImagesInOrder.forEach((img, i) => mobileColumns[i % 2].push(img));

  return (
    <div className="mt-[8vh] lg:mt-[16vh]">
      {/* Mobile-only: info heading above the grid, full width. Hidden at
          lg since desktop keeps its own copy of this text inside column
          1 of the masonry layout below. */}
      <div className="mb-[5vh] font-display font-black text-[4.2vw] uppercase leading-[0.95] tracking-[-0.02em] text-[#111111] lg:hidden">
        {infoBlock}
      </div>

      {/* Mobile-only 2-column edge-to-edge masonry. -mx-4 / md:-mx-8
          cancel out <main>'s own px-4 / md:px-8 exactly at each
          breakpoint — without matching md's larger padding too, screens
          between 768 and 1023px (past md, short of lg) would be
          under-cancelled and left with a visible partial gap instead of
          true edge-to-edge. */}
      <div className="-mx-4 flex gap-1 md:-mx-8 lg:hidden">
        {mobileColumns.map((column, colIdx) => (
          <div key={colIdx} className="flex flex-1 flex-col gap-1">
            {column.map((img, i) => (
              <figure key={i} className="relative">
                <PrismicNextImage
                  field={img}
                  fallbackAlt=""
                  // Images alternate i % 2 into these two columns, so a
                  // given column/position pair's original position in
                  // allImagesInOrder is i * 2 + colIdx — that's what
                  // "first 4 images" actually needs to check, not a
                  // formula assuming both columns are the same length.
                  priority={i * 2 + colIdx < 4}
                  sizes="50vw"
                  className="block h-auto w-full object-cover"
                />
              </figure>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop-only: the existing asymmetric 3-column masonry,
          completely unchanged from before this mobile-specific grid was
          added. Hidden below lg, where the grid above takes over. */}
      <div className="hidden lg:flex lg:flex-row lg:items-start lg:gap-[8vw] lg:[--gallery-scale:1]">
        {/* Column 1: meta info + first third of images */}
        <div className="lg:min-w-0 lg:flex-[1.3]">
          <div className="mb-[13vh] font-display font-black text-[1.9vw] uppercase leading-[0.95] tracking-[-0.02em] text-[#111111]">
            {infoBlock}
          </div>
          {columns[0].map((img, i) => (
            <GalleryImage
              key={i}
              image={img}
              widthClass={WIDTH_PATTERN[(i * 3) % WIDTH_PATTERN.length]}
              marginTopVh={MARGIN_TOP[(i * 3) % MARGIN_TOP.length]}
              marginBottomVh={MARGIN_BOTTOM[(i * 3) % MARGIN_BOTTOM.length]}
            />
          ))}
        </div>

        {/* Column 2: narrower, sits lower to break the grid line */}
        <div className="lg:mt-[20vh] lg:min-w-0 lg:flex-[0.85]">
          {columns[1].map((img, i) => (
            <GalleryImage
              key={i}
              image={img}
              widthClass={WIDTH_PATTERN[(i * 3 + 1) % WIDTH_PATTERN.length]}
              marginTopVh={MARGIN_TOP[(i * 3 + 1) % MARGIN_TOP.length]}
              marginBottomVh={
                MARGIN_BOTTOM[(i * 3 + 1) % MARGIN_BOTTOM.length]
              }
            />
          ))}
        </div>

        {/* Column 3: cover image pinned at top, then remaining images */}
        <div className="lg:w-[30vw] lg:max-w-[480px] lg:shrink-0">
          {isFilled.image(coverImage) && (
            <figure className="mb-[9vh]">
              <PrismicNextImage
                field={coverImage}
                fallbackAlt=""
                priority
                sizes="30vw"
                className="block h-auto w-full"
              />
            </figure>
          )}
          {columns[2].map((img, i) => (
            <GalleryImage
              key={i}
              image={img}
              widthClass={WIDTH_PATTERN[(i * 3 + 2) % WIDTH_PATTERN.length]}
              marginTopVh={MARGIN_TOP[(i * 3 + 2) % MARGIN_TOP.length]}
              marginBottomVh={
                MARGIN_BOTTOM[(i * 3 + 2) % MARGIN_BOTTOM.length]
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
