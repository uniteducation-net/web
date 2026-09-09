import Image from "next/image";

import type { ResolvedAsset } from "@/lib/content";
import { cn } from "@/lib/utils";

interface ContentAssetProps {
  asset: ResolvedAsset | null;
  alt: string;
  className?: string;
}

/** Renders a co-located content asset: raster images via next/image,
 *  SVGs inline as React components (see src/lib/content.ts#getAsset). */
const ContentAsset = ({ asset, alt, className }: ContentAssetProps) => {
  if (!asset) return null;
  if (asset.kind === "component") {
    return (
      <asset.Component role="img" aria-label={alt} className={cn(className)} />
    );
  }
  return <Image src={asset.data} alt={alt} className={cn(className)} />;
};

export { ContentAsset };
