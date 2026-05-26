export type QRResultType = "url" | "email" | "phone" | "wifi" | "text" | "unknown";

export interface QRExtractResponse {
  success: boolean;
  results: QRExtractResult[];
  error?: {
    code: string;
    message: string;
  };
}

export interface QRExtractResult {
  value: string;
  type: QRResultType;
  format: "QR_CODE";
}
