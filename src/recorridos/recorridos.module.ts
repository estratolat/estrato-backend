import { Module } from '@nestjs/common';
import { RecorridosController } from './recorridos.controller';
import { RecorridosService } from './recorridos.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [RecorridosController],
  providers: [RecorridosService, PrismaService],
  exports: [RecorridosService],
})
export class RecorridosModule {}
