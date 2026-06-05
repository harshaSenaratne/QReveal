import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { memoryStorage } from "multer";

import { QrApiException } from "../common/qr-api-exception";
import {
  LoggedRequest,
  setUploadLogMetadata,
} from "../common/middleware/request-logger.middleware";
import { QRExtractResponseDto } from "./dto/extract-response.dto";
import { QrService } from "./qr.service";
import { MAX_UPLOAD_BYTES } from "./upload.constants";

@Controller("api/v1/qr")
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post("extract")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_UPLOAD_BYTES,
        files: 1,
      },
    }),
  )
  async extract(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: Request,
  ): Promise<QRExtractResponseDto> {
    const loggedRequest = request as LoggedRequest;

    if (!file) {
      throw new QrApiException("NO_FILE", HttpStatus.BAD_REQUEST);
    }

    setUploadLogMetadata(loggedRequest, { fileSize: file.size });

    const extraction = await this.qrService.extract(file);
    setUploadLogMetadata(loggedRequest, {
      fileSize: file.size,
      mimeType: extraction.mimeType,
    });

    return {
      success: true,
      results: extraction.results,
    };
  }
}
