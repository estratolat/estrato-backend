import { Module } from '@nestjs/common';
import { IneController } from './ine.controller';
import { IneService } from './ine.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [IneController],
  providers: [IneService, PrismaService],
  exports: [IneService],
})
export class IneModule {}
