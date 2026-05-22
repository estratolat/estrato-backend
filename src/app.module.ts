import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { VotantesModule } from './votantes/votantes.module';
import { LideresModule } from './lideres/lideres.module';
import { EventosModule } from './eventos/eventos.module';
import { ApoyosModule } from './apoyos/apoyos.module';
import { RecorridosModule } from './recorridos/recorridos.module';
import { CrmModule } from './crm/crm.module';
import { VapiModule } from './vapi/vapi.module';
import { BoletinesModule } from './boletines/boletines.module';
import { IneModule } from './ine/ine.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    AuthModule,
    TenantsModule,
    UsersModule,
    VotantesModule,
    LideresModule,
    EventosModule,
    ApoyosModule,
    RecorridosModule,
    CrmModule,
    VapiModule,
    BoletinesModule,
    IneModule,
  ],
})
export class AppModule {}
