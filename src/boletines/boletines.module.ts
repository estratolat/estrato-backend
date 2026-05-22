import { Module } from '@nestjs/common';
import { BoletinesController } from './boletines.controller';
import { BoletinesService } from './boletines.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [BoletinesController],
  providers: [BoletinesService, PrismaService],
  exports: [BoletinesService],
})
export class BoletinesModule {}
