import { Module } from '@nestjs/common';
import { LlamadasController } from './llamadas.controller';
import { LlamadasService } from './llamadas.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [LlamadasController],
  providers: [LlamadasService, PrismaService],
  exports: [LlamadasService],
})
export class LlamadasModule {}
