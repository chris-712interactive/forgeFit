import {
  renderSocialImage,
  socialImageAlt,
  socialImageContentType,
  socialImageSize,
} from "@/lib/seo/render-social-image";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = socialImageContentType;

export default function OpenGraphImage() {
  return renderSocialImage();
}
