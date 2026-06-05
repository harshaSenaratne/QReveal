import { Module } from "@nestjs/common";

import { HealthController } from "./health/health.controller";
import { QrModule } from "./qr/qr.module";

@Module({
  imports: [QrModule],
  controllers: [HealthController],
})
export class AppModule {}
