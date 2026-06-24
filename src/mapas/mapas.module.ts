import { Module } from '@nestjs/common';
import { MapasController } from './mapas.controller';
import { MapasService } from './mapas.service';
import { GisParserService } from './gis-parser.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [MapasController],
  providers: [MapasService, GisParserService, PrismaService],
})
export class MapasModule {}
