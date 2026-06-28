import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InegiController } from './inegi.controller';
import { InegiService } from './inegi.service';
import { InegiWmsService } from './inegi-wms.service';
import { NominatimService } from './nominatim.service';
import { MapasService } from '../mapas/mapas.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [InegiController],
  providers: [InegiService, InegiWmsService, NominatimService, MapasService, PrismaService],
  exports: [InegiService, InegiWmsService, NominatimService],
})
export class InegiModule {}
