export type ErrorCode =
  | "NO_FILE"
  | "EMPTY_FILE"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "NO_QR_FOUND"
  | "DECODE_FAILED"
  | "INTERNAL_ERROR";

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  NO_FILE: "Please upload a PNG, JPG, or JPEG image.",
  EMPTY_FILE: "The uploaded file is empty.",
  FILE_TOO_LARGE: "This file is too large. Please upload a file smaller than 10MB.",
  UNSUPPORTED_FILE_TYPE: "Unsupported file type. Please upload a PNG, JPG, or JPEG image.",
  NO_QR_FOUND: "No QR code was found in this file. Try a clearer image or crop around the QR code.",
  DECODE_FAILED: "Something went wrong while extracting the QR code. Please try again.",
  INTERNAL_ERROR: "Something went wrong while extracting the QR code. Please try again.",
};

export class QrApiException extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    public readonly userMessage = ERROR_MESSAGES[code],
    public readonly fileSize?: number,
    public readonly mimeType?: string,
  ) {
    super(code);
  }
}
