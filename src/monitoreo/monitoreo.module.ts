import { Module } from '@nestjs/common';
import { MonitoreoController } from './monitoreo.controller';
import { MonitoreoService } from './monitoreo.service';

@Module({
  controllers: [MonitoreoController],
  providers: [MonitoreoService],
  exports: [MonitoreoService],
})
export class MonitoreoModule {}
