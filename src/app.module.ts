import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { VotantesModule } from './votantes/votantes.module';
import { LideresModule } from './lideres/lideres.module';
import { ZonasModule } from './zonas/zonas.module';
import { EventosModule } from './eventos/eventos.module';
import { ApoyosModule } from './apoyos/apoyos.module';
import { RecorridosModule } from './recorridos/recorridos.module';
import { CrmModule } from './crm/crm.module';
import { LlamadasModule } from './llamadas/llamadas.module';
import { BoletinesModule } from './boletines/boletines.module';
import { IneModule } from './ine/ine.module';
import { MapasModule } from './mapas/mapas.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { PeticionesModule } from './peticiones/peticiones.module';
import { CandidatoModule } from './candidato/candidato.module';
import { ResultadosHistoricosModule } from './resultados-historicos/resultados-historicos.module';
import { EncuestasModule } from './encuestas/encuestas.module';
import { CasillasModule } from './casillas/casillas.module';
import { MonitoreoModule } from './monitoreo/monitoreo.module';
import { ProyeccionModule } from './proyeccion/proyeccion.module';
import { FichasSeccionalesModule } from './fichas-seccionales/fichas-seccionales.module';
import { InteligenciaElectoralModule } from './inteligencia-electoral/inteligencia-electoral.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '../.env', '.env'],
    }),
    CommonModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    VotantesModule,
    LideresModule,
    ZonasModule,
    EventosModule,
    ApoyosModule,
    RecorridosModule,
    CrmModule,
    LlamadasModule,
    BoletinesModule,
    IneModule,
    MapasModule,
    AdminModule,
    UploadsModule,
    PeticionesModule,
    CandidatoModule,
    ResultadosHistoricosModule,
    EncuestasModule,
    CasillasModule,
    MonitoreoModule,
    ProyeccionModule,
    FichasSeccionalesModule,
    InteligenciaElectoralModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

