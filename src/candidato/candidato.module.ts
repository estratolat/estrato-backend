import { Module } from '@nestjs/common';
import { CandidatoController } from './candidato.controller';
import { CandidatoService } from './candidato.service';

@Module({
  controllers: [CandidatoController],
  providers: [CandidatoService],
  exports: [CandidatoService],
})
export class CandidatoModule {}
