import type { Metadata } from "next";
import { socialImageAlt, socialImageSize } from "./render-social-image";

const socialImages: NonNullable<Metadata["openGraph"]>["images"] = [
  {
    url: "/opengraph-image",
    width: socialImageSize.width,
    height: socialImageSize.height,
    alt: socialImageAlt,
  },
];

/** Shared Open Graph / Twitter image fields (uses app/opengraph-image.tsx). */
export function buildSocialImageFields(): {
  openGraphImages: NonNullable<Metadata["openGraph"]>["images"];
  twitterImages: NonNullable<Metadata["twitter"]>["images"];
  twitterCard: "summary_large_image";
} {
  return {
    openGraphImages: socialImages,
    twitterImages: ["/opengraph-image"],
    twitterCard: "summary_large_image",
  };
}
