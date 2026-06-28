import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ColoniasController } from './colonias.controller';
import { ColoniasService } from './colonias.service';
import { SepomexCatalogoService } from './sepomex-catalogo.service';
import { ColoniasNominatimService } from './nominatim.service';
import { AgebInegiService } from './ageb-inegi.service';
import { MapasService } from '../mapas/mapas.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [ColoniasController],
  providers: [
    ColoniasService,
    SepomexCatalogoService,
    ColoniasNominatimService,
    AgebInegiService,
    MapasService,
    PrismaService,
  ],
  exports: [ColoniasService],
})
export class ColoniasModule {}
