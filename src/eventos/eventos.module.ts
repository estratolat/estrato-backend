import { Module } from '@nestjs/common';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [EventosController],
  providers: [EventosService, PrismaService],
  exports: [EventosService],
})
export class EventosModule {}
