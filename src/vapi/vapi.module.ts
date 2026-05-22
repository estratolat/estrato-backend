import { Module } from '@nestjs/common';
import { VapiController } from './vapi.controller';
import { VapiService } from './vapi.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [VapiController],
  providers: [VapiService, PrismaService],
  exports: [VapiService],
})
export class VapiModule {}
