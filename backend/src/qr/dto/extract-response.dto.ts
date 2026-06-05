export type QRResultType = "url" | "email" | "phone" | "wifi" | "text" | "unknown";

export interface QRExtractResultDto {
  value: string;
  type: QRResultType;
  format: "QR_CODE";
}

export interface QRExtractResponseDto {
  success: boolean;
  results: QRExtractResultDto[];
  error?: {
    code: string;
    message: string;
  };
}
