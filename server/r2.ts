import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "node:crypto";

// Validate all required environment variables at startup so a misconfigured
// deployment fails immediately rather than at the first image upload.
const REQUIRED_ENV_VARS = [
  "CLOUDFLARE_R2_ENDPOINT",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_BUCKET_NAME",
  "CLOUDFLARE_R2_PUBLIC_URL",
] as const;

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable for R2 storage: ${key}`);
  }
}

// TODO: When recipes or images are deleted, the corresponding R2 objects are orphaned.
// Add cleanup logic in a future phase — DELETE /api/recipes/:id and image deletion
// endpoints should call R2 DeleteObjectCommand for each associated key.

const r2Client = new S3Client({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  region: "auto",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB — reasonable ceiling for recipe photos

/**
 * Upload an image (as a base64 data URL or raw base64) to Cloudflare R2.
 * Returns the public URL of the uploaded object.
 *
 * CLOUDFLARE_R2_PUBLIC_URL is the base URL for publicly accessible objects.
 * This comes from enabling "Public Development URL" on the bakedwithrowan R2 bucket
 * in the Cloudflare dashboard (Settings → Public Development URL → Enable).
 * Do NOT construct public URLs from CLOUDFLARE_R2_ENDPOINT — that endpoint is
 * for S3-compatible API calls only and is not publicly accessible.
 * Do NOT make the bucket itself publicly listable — only individual objects
 * should be accessible via this URL.
 */
export async function uploadImageToR2(base64Data: string, key: string): Promise<string> {
  // Extract content type from data URL prefix if present; default to image/jpeg
  let contentType = "image/jpeg";
  let rawBase64 = base64Data;

  const dataUrlMatch = base64Data.match(/^data:([^;]+);base64,/);
  if (dataUrlMatch) {
    contentType = dataUrlMatch[1];
    rawBase64 = base64Data.slice(dataUrlMatch[0].length);
  }

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error(
      `Unsupported image type "${contentType}". Allowed types: jpeg, png, webp, gif.`
    );
  }

  const buffer = Buffer.from(rawBase64, "base64");

  if (buffer.length === 0) {
    throw new Error("Image data is empty.");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("Image exceeds the maximum allowed size of 15 MB.");
  }

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
  } catch (err) {
    throw new Error(
      `R2 upload failed for key "${key}": ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}

/**
 * Generate a unique object key for an image.
 * Uses randomBytes to prevent collisions when multiple uploads happen in the same millisecond.
 *
 * Example: "recipes/42/cover-1713200000000-a3f9c1.jpg"
 */
export function generateImageKey(recipeId: string | number, type: string): string {
  const hex = randomBytes(3).toString("hex"); // 6 hex characters
  return `recipes/${recipeId}/${type}-${Date.now()}-${hex}.jpg`;
}
