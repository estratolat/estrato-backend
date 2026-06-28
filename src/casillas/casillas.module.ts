import { Module } from '@nestjs/common';
import { CasillasController } from './casillas.controller';
import { CasillasService } from './casillas.service';

@Module({
  controllers: [CasillasController],
  providers: [CasillasService],
  exports: [CasillasService],
})
export class CasillasModule {}
