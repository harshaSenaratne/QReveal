import type { NextFunction, Request, RequestHandler, Response } from "express";

export interface RequestLogFields {
  fileSize: number;
  mimeType: string;
  errorCategory: string;
}

export type LoggedRequest = Request & {
  qrLog?: RequestLogFields;
};

export const requestLogger: RequestHandler = (
  request: LoggedRequest,
  response: Response,
  next: NextFunction,
) => {
  const startedAt = new Date();
  const startedAtNs = process.hrtime.bigint();
  const fields: RequestLogFields = {
    fileSize: 0,
    mimeType: "",
    errorCategory: "",
  };

  request.qrLog = fields;

  response.on("finish", () => {
    const durationMs = Number((process.hrtime.bigint() - startedAtNs) / 1_000_000n);
    const entry = {
      timestamp: startedAt.toISOString(),
      duration_ms: durationMs,
      file_size: fields.fileSize,
      mime_type: fields.mimeType,
      status: response.statusCode,
      error_category: fields.errorCategory,
    };

    console.log(JSON.stringify(entry));
  });

  next();
};

export function setUploadLogMetadata(
  request: LoggedRequest,
  metadata: { fileSize?: number; mimeType?: string },
): void {
  if (!request.qrLog) {
    return;
  }

  if (typeof metadata.fileSize === "number" && Number.isFinite(metadata.fileSize)) {
    request.qrLog.fileSize = metadata.fileSize;
  }

  if (metadata.mimeType) {
    request.qrLog.mimeType = metadata.mimeType;
  }
}

export function setErrorCategory(request: LoggedRequest, category: string): void {
  if (!request.qrLog) {
    return;
  }

  request.qrLog.errorCategory = category;
}
