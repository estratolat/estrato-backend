import { Module } from '@nestjs/common';
import { PeticionesController } from './peticiones.controller';
import { PeticionesService } from './peticiones.service';

@Module({
  controllers: [PeticionesController],
  providers: [PeticionesService],
  exports: [PeticionesService],
})
export class PeticionesModule {}
