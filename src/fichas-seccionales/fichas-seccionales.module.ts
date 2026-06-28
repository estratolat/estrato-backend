import { Module } from '@nestjs/common';
import { FichasSeccionalesController } from './fichas-seccionales.controller';
import { FichasSeccionalesService } from './fichas-seccionales.service';

@Module({
  controllers: [FichasSeccionalesController],
  providers: [FichasSeccionalesService],
  exports: [FichasSeccionalesService],
})
export class FichasSeccionalesModule {}
