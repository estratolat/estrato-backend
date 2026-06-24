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
import { UploadsModule } from './uploads/uploads.module';
import { PeticionesModule } from './peticiones/peticiones.module';
import { CandidatoModule } from './candidato/candidato.module';
import { InegiModule } from './inegi/inegi.module';
import { ResultadosHistoricosModule } from './resultados-historicos/resultados-historicos.module';

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
    UploadsModule,
    PeticionesModule,
    CandidatoModule,
    InegiModule,
    ResultadosHistoricosModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

