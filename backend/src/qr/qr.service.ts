import { HttpStatus, Injectable } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";

import { QrApiException } from "../common/qr-api-exception";
import { QRExtractResultDto } from "./dto/extract-response.dto";
import { detectMimeType, isSupportedMimeType, SupportedMimeType } from "./file-validation";
import { detectQRValueType } from "./type-detector";
import { MAX_UPLOAD_BYTES } from "./upload.constants";

prepareZXingModule({
  overrides: {
    wasmBinary: readFileSync(require.resolve("zxing-wasm/reader/zxing_reader.wasm")),
  },
});

@Injectable()
export class QrService {
  async extract(file: Express.Multer.File): Promise<{
    mimeType: SupportedMimeType;
    results: QRExtractResultDto[];
  }> {
    const buffer = file.buffer;
    const fileSize = buffer?.length ?? file.size ?? 0;

    if (!buffer || fileSize === 0) {
      throw new QrApiException("EMPTY_FILE", HttpStatus.BAD_REQUEST, undefined, fileSize);
    }

    if (fileSize > MAX_UPLOAD_BYTES) {
      throw new QrApiException(
        "FILE_TOO_LARGE",
        HttpStatus.PAYLOAD_TOO_LARGE,
        undefined,
        fileSize,
      );
    }

    const mimeType = detectMimeType(buffer);
    if (!isSupportedMimeType(mimeType)) {
      throw new QrApiException(
        "UNSUPPORTED_FILE_TYPE",
        HttpStatus.BAD_REQUEST,
        undefined,
        fileSize,
        mimeType,
      );
    }

    let results: QRExtractResultDto[];
    try {
      results = await this.decode(buffer);
    } catch (error) {
      if (error instanceof QrApiException && error.code === "DECODE_FAILED") {
        throw new QrApiException(
          "DECODE_FAILED",
          HttpStatus.UNPROCESSABLE_ENTITY,
          undefined,
          fileSize,
          mimeType,
        );
      }

      throw error;
    }

    if (results.length === 0) {
      throw new QrApiException(
        "NO_QR_FOUND",
        HttpStatus.UNPROCESSABLE_ENTITY,
        undefined,
        fileSize,
        mimeType,
      );
    }

    return { mimeType, results };
  }

  private async decode(buffer: Buffer): Promise<QRExtractResultDto[]> {
    try {
      const decoded = await readBarcodes(buffer, {
        formats: ["QRCode"],
        maxNumberOfSymbols: 0,
        textMode: "Plain",
        tryHarder: true,
        tryInvert: true,
        tryRotate: true,
      });

      const seen = new Set<string>();
      const results: QRExtractResultDto[] = [];
      let sawDecodeError = false;

      for (const decodedResult of decoded) {
        if (decodedResult.error || decodedResult.isValid === false) {
          sawDecodeError = true;
          continue;
        }

        const value = decodedResult.text;
        if (!value) {
          continue;
        }

        const key = `QR_CODE\u0000${value}`;
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        results.push({
          value,
          type: detectQRValueType(value),
          format: "QR_CODE",
        });
      }

      if (results.length === 0 && sawDecodeError) {
        throw new QrApiException("DECODE_FAILED", HttpStatus.UNPROCESSABLE_ENTITY);
      }

      return results;
    } catch {
      throw new QrApiException("DECODE_FAILED", HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
