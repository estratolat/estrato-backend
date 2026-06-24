import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { VotantesService } from '../votantes/votantes.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, VotantesService],
  exports: [TenantsService],
})
export class TenantsModule {}
