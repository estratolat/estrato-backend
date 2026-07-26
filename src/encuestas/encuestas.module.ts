import { Module } from '@nestjs/common';
import { EncuestasController } from './encuestas.controller';
import { EncuestasPublicController } from './encuestas-public.controller';
import { EncuestasService } from './encuestas.service';

@Module({
  controllers: [EncuestasController, EncuestasPublicController],
  providers: [EncuestasService],
  exports: [EncuestasService],
})
export class EncuestasModule {}
