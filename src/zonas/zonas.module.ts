import { Module } from '@nestjs/common';
import { ZonasController } from './zonas.controller';
import { ZonasService } from './zonas.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [ZonasController],
  providers: [ZonasService, PrismaService],
  exports: [ZonasService],
})
export class ZonasModule {}
