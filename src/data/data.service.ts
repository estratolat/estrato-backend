import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';

@Injectable()
export class DataService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, filtros?: { categoria?: string; periodo?: string; subcategoria?: string }) {
    const where: any = { tenant_id: tenantId, visible: true };
    if (filtros?.categoria) where.categoria = filtros.categoria;
    if (filtros?.periodo) where.periodo = filtros.periodo;
    if (filtros?.subcategoria) where.subcategoria = filtros.subcategoria;

    return this.prisma.indicadorMunicipal.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { orden: 'asc' }, { indicador: 'asc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const indicador = await this.prisma.indicadorMunicipal.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!indicador) throw new NotFoundException('Indicador no encontrado');
    return indicador;
  }

  create(tenantId: string, dto: CreateIndicadorDto) {
    return this.prisma.indicadorMunicipal.create({
      data: {
        tenant_id: tenantId,
        categoria: dto.categoria,
        subcategoria: dto.subcategoria || null,
        indicador: dto.indicador,
        descripcion: dto.descripcion || null,
        valor_numerico: dto.valor_numerico ?? null,
        valor_texto: dto.valor_texto || null,
        unidad: dto.unidad || null,
        periodo: dto.periodo || null,
        fuente: dto.fuente || 'Data México',
        fuente_url: dto.fuente_url || null,
        coordenada_x: dto.coordenada_x ?? null,
        coordenada_y: dto.coordenada_y ?? null,
        visible: dto.visible ?? true,
        orden: dto.orden ?? 0,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateIndicadorDto) {
    await this.findOne(tenantId, id);

    const data: any = {};
    if (dto.categoria !== undefined) data.categoria = dto.categoria;
    if (dto.subcategoria !== undefined) data.subcategoria = dto.subcategoria || null;
    if (dto.indicador !== undefined) data.indicador = dto.indicador;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion || null;
    if (dto.valor_numerico !== undefined) data.valor_numerico = dto.valor_numerico ?? null;
    if (dto.valor_texto !== undefined) data.valor_texto = dto.valor_texto || null;
    if (dto.unidad !== undefined) data.unidad = dto.unidad || null;
    if (dto.periodo !== undefined) data.periodo = dto.periodo || null;
    if (dto.fuente !== undefined) data.fuente = dto.fuente || 'Data México';
    if (dto.fuente_url !== undefined) data.fuente_url = dto.fuente_url || null;
    if (dto.coordenada_x !== undefined) data.coordenada_x = dto.coordenada_x ?? null;
    if (dto.coordenada_y !== undefined) data.coordenada_y = dto.coordenada_y ?? null;
    if (dto.visible !== undefined) data.visible = dto.visible;
    if (dto.orden !== undefined) data.orden = dto.orden ?? 0;

    return this.prisma.indicadorMunicipal.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.indicadorMunicipal.delete({ where: { id } });
  }

  async getResumen(tenantId: string) {
    const indicadores = await this.prisma.indicadorMunicipal.findMany({
      where: { tenant_id: tenantId, visible: true },
      orderBy: [{ categoria: 'asc' }, { orden: 'asc' }],
    });

    const porCategoria: Record<string, { categoria: string; cantidad: number; suma: number; promedio: number | null; indicadores: any[] }> = {};

    for (const i of indicadores) {
      const cat = i.categoria;
      if (!porCategoria[cat]) {
        porCategoria[cat] = { categoria: cat, cantidad: 0, suma: 0, promedio: null, indicadores: [] };
      }
      porCategoria[cat].cantidad += 1;
      porCategoria[cat].indicadores.push(i);
      if (i.valor_numerico !== null && i.valor_numerico !== undefined) {
        porCategoria[cat].suma += i.valor_numerico;
      }
    }

    for (const cat of Object.keys(porCategoria)) {
      const numericos = porCategoria[cat].indicadores.filter((i) => i.valor_numerico !== null && i.valor_numerico !== undefined);
      porCategoria[cat].promedio = numericos.length
        ? numericos.reduce((acc, i) => acc + i.valor_numerico, 0) / numericos.length
        : null;
    }

    return {
      total: indicadores.length,
      categorias: Object.values(porCategoria),
    };
  }

  async getCruce(
    tenantId: string,
    indicadorA: string,
    indicadorB: string,
    periodo?: string,
  ) {
    if (!indicadorA || !indicadorB || indicadorA === indicadorB) {
      throw new BadRequestException('Debes seleccionar dos indicadores distintos para cruzar.');
    }

    const where: any = {
      tenant_id: tenantId,
      visible: true,
      indicador: { in: [indicadorA, indicadorB] },
    };
    if (periodo) where.periodo = periodo;

    const indicadores = await this.prisma.indicadorMunicipal.findMany({
      where,
      orderBy: [{ indicador: 'asc' }, { periodo: 'asc' }, { subcategoria: 'asc' }],
    });

    const serieA = indicadores.filter((i) => i.indicador === indicadorA);
    const serieB = indicadores.filter((i) => i.indicador === indicadorB);

    const labels = Array.from(
      new Set(indicadores.map((i) => i.subcategoria || i.periodo || 'Total')),
    );

    const buildDataset = (serie: typeof indicadores, nombre: string) => {
      return {
        nombre,
        unidad: serie[0]?.unidad || null,
        valores: labels.map((label) => {
          const item = serie.find(
            (i) => (i.subcategoria || i.periodo || 'Total') === label,
          );
          return item?.valor_numerico ?? null;
        }),
      };
    };

    return {
      indicadorA,
      indicadorB,
      periodo: periodo || 'Todos',
      labels,
      datasetA: buildDataset(serieA, indicadorA),
      datasetB: buildDataset(serieB, indicadorB),
      raw: indicadores,
    };
  }
}
