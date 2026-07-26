import { Module } from '@nestjs/common';
import { OpositoresController } from './opositores.controller';
import { OpositoresService } from './opositores.service';

@Module({
  controllers: [OpositoresController],
  providers: [OpositoresService],
})
export class OpositoresModule {}
