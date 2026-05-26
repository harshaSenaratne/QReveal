import type { QRExtractResponse } from "@/lib/types";

const apiURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function extractQR(file: File): Promise<QRExtractResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiURL}/api/v1/qr/extract`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as QRExtractResponse;

  if (!response.ok && payload?.success !== false) {
    throw new Error("QR extraction failed");
  }

  return payload;
}
