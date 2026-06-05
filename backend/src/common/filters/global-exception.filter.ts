import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

import {
  ERROR_MESSAGES,
  ErrorCode,
  QrApiException,
} from "../qr-api-exception";
import {
  LoggedRequest,
  setErrorCategory,
  setUploadLogMetadata,
} from "../middleware/request-logger.middleware";
import { MAX_UPLOAD_BYTES } from "../../qr/upload.constants";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<LoggedRequest>();
    const apiError = this.toApiError(exception);

    setErrorCategory(request, apiError.code);
    setUploadLogMetadata(request, {
      fileSize: apiError.fileSize,
      mimeType: apiError.mimeType,
    });

    response.status(apiError.status).json({
      success: false,
      results: [],
      error: {
        code: apiError.code,
        message: apiError.message,
      },
    });
  }

  private toApiError(exception: unknown): {
    code: ErrorCode;
    message: string;
    status: number;
    fileSize?: number;
    mimeType?: string;
  } {
    if (exception instanceof QrApiException) {
      return {
        code: exception.code,
        message: exception.userMessage,
        status: exception.status,
        fileSize: exception.fileSize,
        mimeType: exception.mimeType,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = this.getHttpExceptionMessage(exception);

      if (status === HttpStatus.PAYLOAD_TOO_LARGE || /file too large/i.test(message)) {
        return {
          code: "FILE_TOO_LARGE",
          message: ERROR_MESSAGES.FILE_TOO_LARGE,
          status: HttpStatus.PAYLOAD_TOO_LARGE,
          fileSize: MAX_UPLOAD_BYTES + 1,
        };
      }

      if (
        status === HttpStatus.BAD_REQUEST &&
        /multipart|unexpected field|file expected/i.test(message)
      ) {
        return {
          code: "NO_FILE",
          message: ERROR_MESSAGES.NO_FILE,
          status: HttpStatus.BAD_REQUEST,
        };
      }
    }

    return {
      code: "INTERNAL_ERROR",
      message: ERROR_MESSAGES.INTERNAL_ERROR,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  private getHttpExceptionMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === "string") {
      return response;
    }

    if (response && typeof response === "object" && "message" in response) {
      const message = (response as { message: unknown }).message;
      return Array.isArray(message) ? message.join(" ") : String(message);
    }

    return exception.message;
  }
}
