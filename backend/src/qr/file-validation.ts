export type SupportedMimeType = "image/png" | "image/jpeg";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function detectMimeType(buffer: Buffer): SupportedMimeType | "application/octet-stream" {
  if (hasPngSignature(buffer)) {
    return "image/png";
  }

  if (hasJpegSignature(buffer)) {
    return "image/jpeg";
  }

  return "application/octet-stream";
}

export function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
  return mimeType === "image/png" || mimeType === "image/jpeg";
}

function hasPngSignature(buffer: Buffer): boolean {
  return (
    buffer.length >= PNG_SIGNATURE.length &&
    PNG_SIGNATURE.every((byte, index) => buffer[index] === byte)
  );
}

function hasJpegSignature(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}
