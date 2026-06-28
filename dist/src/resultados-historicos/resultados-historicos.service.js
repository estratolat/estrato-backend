"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultadosHistoricosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/services/prisma.service");
let ResultadosHistoricosService = class ResultadosHistoricosService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, filtros) {
        const where = { tenant_id: tenantId };
        if (filtros.anio)
            where.anio = filtros.anio;
        if (filtros.estado_id)
            where.estado_id = filtros.estado_id;
        if (filtros.municipio_id)
            where.municipio_id = filtros.municipio_id;
        if (filtros.seccion)
            where.seccion = filtros.seccion.padStart(4, '0');
        if (filtros.partido)
            where.partido_ganador = { contains: filtros.partido, mode: 'insensitive' };
        return this.prisma.resultadoHistorico.findMany({
            where,
            orderBy: [{ anio: 'desc' }, { municipio_id: 'asc' }, { seccion: 'asc' }],
            include: {
                tenant: { select: { id: true, slug: true } },
            },
        });
    }
    async resumen(tenantId) {
        const resultados = await this.prisma.resultadoHistorico.findMany({
            where: { tenant_id: tenantId },
            select: { anio: true, partido_ganador: true, seccion: true, votos_totales: true },
        });
        const porAnioPartido = {};
        const votosPorAnio = {};
        const seccionesPorAnio = {};
        for (const r of resultados) {
            if (!porAnioPartido[r.anio])
                porAnioPartido[r.anio] = {};
            if (!porAnioPartido[r.anio][r.partido_ganador]) {
                porAnioPartido[r.anio][r.partido_ganador] = { secciones: 0, votos: 0 };
            }
            porAnioPartido[r.anio][r.partido_ganador].secciones += 1;
            porAnioPartido[r.anio][r.partido_ganador].votos += r.votos_totales || 0;
            votosPorAnio[r.anio] = (votosPorAnio[r.anio] || 0) + (r.votos_totales || 0);
            seccionesPorAnio[r.anio] = (seccionesPorAnio[r.anio] || 0) + 1;
        }
        return {
            totalRegistros: resultados.length,
            aniosDisponibles: Object.keys(porAnioPartido).map(Number).sort((a, b) => b - a),
            porAnioPartido,
            votosPorAnio,
            seccionesPorAnio,
        };
    }
    async importar(tenantId, archivo, defaults = {}) {
        if (!archivo) {
            throw new common_1.BadRequestException('No se recibió archivo');
        }
        const rows = this.parsearCsv(archivo.buffer.toString('utf-8'));
        if (rows.length === 0) {
            throw new common_1.BadRequestException('El archivo está vacío o no es un CSV válido');
        }
        const normalizado = rows.map((row, index) => this.normalizarFila(row, index, defaults));
        const errores = [];
        const creados = [];
        for (let i = 0; i < normalizado.length; i++) {
            const item = normalizado[i];
            if ('error' in item) {
                if (item.error === 'OMITIDO_MESA') {
                    continue;
                }
                errores.push({ fila: i + 2, error: item.error });
                continue;
            }
            if ((item.votos_totales || 0) === 0 && (item.votos_ganador || 0) === 0) {
                continue;
            }
            try {
                await this.prisma.resultadoHistorico.upsert({
                    where: {
                        tenant_id_seccion_anio: {
                            tenant_id: tenantId,
                            seccion: item.seccion,
                            anio: item.anio,
                        },
                    },
                    update: {
                        estado_id: item.estado_id,
                        municipio_id: item.municipio_id,
                        partido_ganador: item.partido_ganador,
                        votos_ganador: item.votos_ganador,
                        votos_totales: item.votos_totales,
                        votos_nulos: item.votos_nulos,
                        participacion_pct: item.participacion_pct,
                        desglose_partidos: item.desglose_partidos,
                    },
                    create: {
                        tenant_id: tenantId,
                        ...item,
                    },
                });
                creados.push(item);
            }
            catch (err) {
                errores.push({ fila: i + 2, error: err.message || 'Error al guardar' });
            }
        }
        return {
            totalFilas: rows.length,
            exitosos: creados.length,
            errores: errores.length,
            detallesErrores: errores.slice(0, 20),
        };
    }
    parsearCsv(texto) {
        const lineas = texto.split(/\r?\n/).filter((l) => l.trim() !== '');
        if (lineas.length < 2)
            return [];
        const headers = this.parsearLineaCsv(lineas[0]);
        const rows = [];
        for (let i = 1; i < lineas.length; i++) {
            const valores = this.parsearLineaCsv(lineas[i]);
            const row = {};
            headers.forEach((h, idx) => {
                row[h] = valores[idx] || '';
            });
            rows.push(row);
        }
        return rows;
    }
    parsearLineaCsv(linea) {
        const resultado = [];
        let actual = '';
        let entreComillas = false;
        for (let i = 0; i < linea.length; i++) {
            const char = linea[i];
            const next = linea[i + 1];
            if (char === '"') {
                if (entreComillas && next === '"') {
                    actual += '"';
                    i++;
                }
                else {
                    entreComillas = !entreComillas;
                }
            }
            else if (char === ',' && !entreComillas) {
                resultado.push(actual.trim());
                actual = '';
            }
            else {
                actual += char;
            }
        }
        resultado.push(actual.trim());
        return resultado;
    }
    normalizarFila(row, index, defaults) {
        try {
            const tieneFormatoSinaloa = this.tieneColumna(row, ['SECCION', 'seccion']) &&
                (this.tieneColumna(row, ['MUNICIPIO', 'municipio', 'MUNICIPIO_LOCAL']) ||
                    this.tieneColumna(row, ['ID_MUNICIPIO', 'id_municipio', 'ID_MUNICIPIO_LOCAL']) ||
                    this.tieneColumna(row, ['TOTAL_VOTOS', 'TOTAL_VOTOS_ASENTADO', 'VOTOS_VALIDOS']));
            if (tieneFormatoSinaloa) {
                return this.normalizarFilaSinaloa(row, defaults);
            }
            const seccionRaw = this.extraer(row, ['seccion', 'SECCION', 'secc', 'SECC', 'sección']);
            const anioRaw = this.extraer(row, ['anio', 'AÑO', 'ano', 'year', 'ANIO']);
            const partidoGanadorRaw = this.extraer(row, ['partido_ganador', 'GANADOR', 'ganador', 'partido']);
            if (!seccionRaw)
                return { error: 'Falta columna de sección' };
            if (!anioRaw && !defaults.anio)
                return { error: 'Falta columna de año y no hay año por defecto' };
            if (!partidoGanadorRaw)
                return { error: 'Falta columna de partido ganador' };
            const seccion = this.formatearSeccion(seccionRaw);
            const anio = defaults.anio || Number(anioRaw);
            const estado_id = this.parsearNumero(this.extraer(row, ['estado_id', 'ESTADO_ID', 'id_estado', 'ID_ENTIDAD'])) || defaults.estado_id;
            const municipio_id = this.parsearNumero(this.extraer(row, ['municipio_id', 'MUNICIPIO_ID', 'id_municipio', 'ID_MUNICIPIO'])) || defaults.municipio_id;
            const partido_ganador = String(partidoGanadorRaw).toUpperCase().trim();
            return {
                seccion,
                anio,
                estado_id,
                municipio_id,
                partido_ganador,
                votos_ganador: this.parsearNumero(this.extraer(row, ['votos_ganador', 'VOTOS_GANADOR', 'votos_primer_lugar'])),
                votos_totales: this.parsearNumero(this.extraer(row, ['votos_totales', 'VOTOS_TOTALES', 'total_votos', 'TOTAL_VOTOS_ASENTADO', 'TOTAL_VOTOS'])),
                votos_nulos: this.parsearNumero(this.extraer(row, ['votos_nulos', 'VOTOS_NULOS', 'nulos', 'NULOS'])),
                participacion_pct: this.parsearFloat(this.extraer(row, ['participacion_pct', 'PARTICIPACION', 'participacion', 'participacion_%', 'PARTICIPACION_PCT'])),
                desglose_partidos: this.extraerDesglose(row),
            };
        }
        catch (err) {
            return { error: err.message || 'Error desconocido' };
        }
    }
    normalizarFilaSinaloa(row, defaults) {
        const seccionRaw = this.extraer(row, ['SECCION', 'seccion']);
        if (!seccionRaw)
            return { error: 'Falta columna de sección' };
        if (!defaults.anio)
            return { error: 'Falta año de la elección (selecciona un año al importar)' };
        const seccionLimpia = String(seccionRaw).trim().toUpperCase();
        if (seccionLimpia.startsWith('MESA')) {
            return { error: 'OMITIDO_MESA' };
        }
        const seccion = this.formatearSeccion(seccionRaw);
        const anio = defaults.anio;
        const estado_id = this.parsearNumero(this.extraer(row, ['ID_ENTIDAD', 'id_entidad', 'ID_ESTADO', 'estado_id', 'ESTADO_ID'])) || defaults.estado_id;
        const municipio_id = this.parsearNumero(this.extraer(row, ['ID_MUNICIPIO', 'id_municipio', 'ID_MUNICIPIO_LOCAL', 'MUNICIPIO_ID', 'municipio_id'])) || defaults.municipio_id;
        const desglose = this.extraerDesglose(row);
        const candidatos = Object.entries(desglose).filter(([k]) => k !== 'NULOS' && k !== 'NO_REGISTRADAS' && k !== 'VN' && k !== 'VCN');
        let partido_ganador = 'OTRO';
        let votos_ganador = 0;
        if (candidatos.length > 0) {
            const [ganador, votos] = candidatos.sort((a, b) => b[1] - a[1])[0];
            partido_ganador = ganador;
            votos_ganador = votos;
        }
        const votos_totales = this.parsearNumero(this.extraer(row, ['TOTAL_VOTOS_ASENTADO', 'total_votos_asentado', 'VOTOS_VALIDOS', 'votos_validos', 'TOTAL_VOTOS', 'votos_totales']));
        const votos_nulos = this.parsearNumero(this.extraer(row, ['NULOS', 'nulos', 'VOTOS_NULOS', 'VN']));
        const participacion_pct = this.parsearFloat(this.extraer(row, ['PARTICIPACION_PCT', 'participacion_pct', 'PARTICIPACION', 'participacion', 'PORCENTAJE_GANADOR']));
        return {
            seccion,
            anio,
            estado_id,
            municipio_id,
            partido_ganador,
            votos_ganador: votos_ganador || undefined,
            votos_totales: votos_totales || undefined,
            votos_nulos: votos_nulos || undefined,
            participacion_pct: participacion_pct || undefined,
            desglose_partidos: Object.keys(desglose).length > 0 ? desglose : undefined,
        };
    }
    extraerDesglose(row) {
        const desglose = {};
        const partidosConocidos = [
            'PAN', 'PRI', 'PRD', 'PT', 'PVEM', 'MC', 'PAS', 'MORENA', 'PES',
            'MAG', 'JSLS', 'VMSA',
            'CAND_IND_JSLS', 'CAND_IND_VMSA', 'CAND_IND_MAG',
            'C_PAN_PRI_PRD_PAS', 'C_PAN_PRI_PRD', 'C_PAN_PRI_PAS', 'C_PAN_PRD_PAS',
            'C_PRI_PRD_PAS', 'C_PAN_PRI', 'C_PAN_PRD', 'C_PAN_PAS', 'C_PRI_PRD',
            'C_PRI_PAS', 'C_PRD_PAS', 'CC_PVEM_MORENA',
            'NO_REGISTRADAS', 'NULOS', 'VN', 'VCN',
            'PANAL', 'RSP', 'FXM', 'NAZIONAL', 'NOVA', 'QM', 'SOLIDARIDAD', 'SUMA', 'EPS',
        ];
        for (const [key, value] of Object.entries(row)) {
            const upper = key.toUpperCase().trim();
            if (upper.startsWith('PCT_') || upper.startsWith('%'))
                continue;
            if (partidosConocidos.includes(upper) && value != null && value !== '') {
                const num = Number(String(value).replace(/,/g, ''));
                if (!isNaN(num)) {
                    desglose[upper] = num;
                }
            }
        }
        return desglose;
    }
    formatearSeccion(valor) {
        const num = String(valor).replace(/\D/g, '');
        return num.padStart(4, '0').slice(0, 4);
    }
    tieneColumna(row, nombres) {
        return nombres.some((n) => row[n] !== undefined);
    }
    extraer(row, nombres) {
        for (const nombre of nombres) {
            if (row[nombre] != null && String(row[nombre]).trim() !== '') {
                return String(row[nombre]).trim();
            }
        }
        return undefined;
    }
    parsearNumero(value) {
        if (!value || value.trim() === '\\N')
            return undefined;
        const limpio = value.replace(/,/g, '').replace(/%/g, '').trim();
        const num = Number(limpio);
        return isNaN(num) ? undefined : num;
    }
    parsearFloat(value) {
        if (!value)
            return undefined;
        const limpio = value.replace(/,/g, '').replace(/%/g, '').trim();
        const num = parseFloat(limpio);
        return isNaN(num) ? undefined : num;
    }
};
exports.ResultadosHistoricosService = ResultadosHistoricosService;
exports.ResultadosHistoricosService = ResultadosHistoricosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResultadosHistoricosService);
//# sourceMappingURL=resultados-historicos.service.js.map