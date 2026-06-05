import { NestFactory } from "@nestjs/core";
import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import "reflect-metadata";

import { AppModule } from "./app.module";
import { getAllowedOrigins, getPort } from "./config/app.config";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { requestLogger } from "./common/middleware/request-logger.middleware";
import { securityHeaders } from "./common/middleware/security-headers.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = getAllowedOrigins();
  const corsOptions: CorsOptions = {
    origin(origin, callback) {
      if (!origin || allowedOrigins.allowAll || allowedOrigins.values.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  };

  app.getHttpAdapter().getInstance().disable("x-powered-by");
  app.use(securityHeaders);
  app.use(requestLogger);
  app.enableCors(corsOptions);
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(getPort());
}

void bootstrap();
