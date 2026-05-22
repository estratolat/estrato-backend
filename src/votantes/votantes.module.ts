import { Module } from '@nestjs/common';
import { VotantesService } from './votantes.service';
import { VotantesController } from './votantes.controller';

@Module({
  controllers: [VotantesController],
  providers: [VotantesService],
  exports: [VotantesService],
})
export class VotantesModule {}
