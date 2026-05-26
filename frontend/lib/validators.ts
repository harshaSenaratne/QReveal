const maxFileSizeBytes = 10 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/png", "image/jpeg"]);

export function validateQRImage(file: File | null): string | null {
  if (!file) {
    return "Please choose a PNG, JPG, or JPEG image to upload.";
  }

  if (file.size === 0) {
    return "Please upload a non-empty PNG, JPG, or JPEG image.";
  }

  if (file.size > maxFileSizeBytes) {
    return "This file is too large. Please upload a file smaller than 10MB.";
  }

  if (!allowedMimeTypes.has(file.type)) {
    return "Unsupported file type. Please upload a PNG, JPG, or JPEG image.";
  }

  return null;
}
