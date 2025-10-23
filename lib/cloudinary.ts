import { v2 as cloudinary } from "cloudinary";

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;

if (
  !CLOUDINARY_CLOUD_NAME ||
  !CLOUDINARY_API_KEY ||
  !CLOUDINARY_API_SECRET
) {
  throw new Error("Missing Cloudinary environment variables");
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true
});

export async function fetchAssetBuffer(publicIdOrUrl: string) {
  const url = publicIdOrUrl.startsWith("http")
    ? publicIdOrUrl
    : cloudinary.url(publicIdOrUrl, { secure: true });

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download Cloudinary asset: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  return {
    data: Buffer.from(arrayBuffer),
    contentType
  };
}

export async function deleteAsset(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    console.error("Failed to delete Cloudinary asset", publicId, err);
  }
}
