import { Image } from "@imagekit/next";

import { cn } from "@/lib/utils";

interface IllustrationImageProps {
  /** ImageKit path, e.g. "/illustrations/educator.svg". */
  src: string;
  alt: string;
  /** Sizing wrapper classes — set aspect ratio / height here (e.g. "aspect-video w-full"). */
  className?: string;
  /** Classes for the <img> itself. `object-contain` by default; pass `object-cover` to crop-fill. */
  imageClassName?: string;
  /** Responsive `sizes` for the fill image — pass an accurate value at hot
   *  spots; defaults to "100vw" (the browser's assumption when omitted). */
  sizes?: string;
  priority?: boolean;
}

/**
 * Images from ImageKit, rendered with `fill` inside a sized wrapper so they
 * scale to any container without distortion or width/height aspect-ratio
 * warnings. SVGs are served as-is (unoptimized — resizing a vector is wasted
 * transformation); raster images go through the ImageKit optimizer.
 */
const IllustrationImage = ({
  src,
  alt,
  className,
  imageClassName,
  sizes,
  priority,
}: IllustrationImageProps) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "100vw"}
        unoptimized={src.endsWith(".svg")}
        priority={priority}
        className={cn("object-contain", imageClassName)}
      />
    </div>
  );
};

export { IllustrationImage };
