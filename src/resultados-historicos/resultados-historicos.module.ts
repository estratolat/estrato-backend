import { Module } from '@nestjs/common';
import { ResultadosHistoricosController } from './resultados-historicos.controller';
import { ResultadosHistoricosService } from './resultados-historicos.service';

@Module({
  controllers: [ResultadosHistoricosController],
  providers: [ResultadosHistoricosService],
})
export class ResultadosHistoricosModule {}
