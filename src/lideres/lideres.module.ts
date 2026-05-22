import { Module } from '@nestjs/common';
import { LideresController } from './lideres.controller';
import { LideresService } from './lideres.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [LideresController],
  providers: [LideresService, PrismaService],
  exports: [LideresService],
})
export class LideresModule {}
