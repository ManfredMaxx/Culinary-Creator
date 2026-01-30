import heic2any from "heic2any";

export async function convertToJpeg(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  if (
    fileType === "image/heic" ||
    fileType === "image/heif" ||
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif")
  ) {
    try {
      const blob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.85,
      });
      const resultBlob = Array.isArray(blob) ? blob[0] : blob;
      return blobToDataUrl(resultBlob);
    } catch (error) {
      console.error("HEIC conversion failed:", error);
      throw new Error("Failed to convert HEIC image. Please try a different format.");
    }
  }

  if (fileType.startsWith("image/")) {
    return blobToDataUrl(file);
  }

  return blobToDataUrl(file);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(blob);
  });
}
