import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { VotantesModule } from '../votantes/votantes.module';
import { CrmModule } from '../crm/crm.module';
import { EventosModule } from '../eventos/eventos.module';
import { ApoyosModule } from '../apoyos/apoyos.module';
import { LlamadasModule } from '../llamadas/llamadas.module';
import { ProyeccionModule } from '../proyeccion/proyeccion.module';
import { MapasModule } from '../mapas/mapas.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    VotantesModule,
    CrmModule,
    EventosModule,
    ApoyosModule,
    LlamadasModule,
    ProyeccionModule,
    MapasModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
