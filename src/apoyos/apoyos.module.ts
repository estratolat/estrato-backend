import { Module } from '@nestjs/common';
import { ApoyosController } from './apoyos.controller';
import { ApoyosService } from './apoyos.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [ApoyosController],
  providers: [ApoyosService, PrismaService],
  exports: [ApoyosService],
})
export class ApoyosModule {}
