import { Module } from '@nestjs/common';
import { InteligenciaElectoralController } from './inteligencia-electoral.controller';
import { InteligenciaElectoralService } from './inteligencia-electoral.service';

@Module({
  controllers: [InteligenciaElectoralController],
  providers: [InteligenciaElectoralService],
})
export class InteligenciaElectoralModule {}
