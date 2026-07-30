import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://strato:Gabo2026%40%21@78.14.12.97:5432/strato',
    },
  },
});

const TENANT_ID = '62af304d-4567-40ae-afb8-35bfbb8b2a4a';

async function main() {
  // Eliminar capa 2028 si existe
  const capa2028 = await prisma.capaMapa.findFirst({
    where: { tenant_id: TENANT_ID, nombre: { contains: '2028' } },
  });
  if (capa2028) {
    await prisma.capaMapa.delete({ where: { id: capa2028.id } });
    console.log(`Eliminada capa ${capa2028.nombre} (${capa2028.id})`);
  } else {
    console.log('No se encontró capa con 2028');
  }

  const capaBase = await prisma.capaMapa.findFirst({
    where: { tenant_id: TENANT_ID, nombre: 'secciones' },
  });
  if (!capaBase) {
    console.error('No se encontró capa base');
    process.exit(1);
  }

  const geojson = (capaBase.geojson as any) || { type: 'FeatureCollection', features: [] };
  if (!Array.isArray(geojson.features)) {
    console.error('GeoJSON inválido');
    process.exit(1);
  }

  const historicos = await prisma.resultadoHistorico.findMany({
    where: { tenant_id: TENANT_ID, anio: 2018 },
  });

  const historicoPorSeccion = new Map<string, any>();
  for (const h of historicos) {
    const seccion = String(h.seccion || '').padStart(4, '0').slice(0, 4);
    const existente = historicoPorSeccion.get(seccion);
    if (!existente) {
      historicoPorSeccion.set(seccion, { ...h, total_votos: h.total_votos || 0 });
    } else {
      existente.total_votos += h.total_votos || 0;
      if ((h.votos_ganador || 0) > (existente.votos_ganador || 0)) {
        existente.partido_ganador = h.partido_ganador;
        existente.votos_ganador = h.votos_ganador;
      }
    }
  }

  const COLORES: Record<string, string> = {
    PRI: '#EF4444',
    PAN: '#3B82F6',
    MORENA: '#7C2D12',
    PRD: '#FACC15',
    'VERDE ECOLOGISTA': '#22C55E',
    PVEM: '#22C55E',
    VERDE: '#22C55E',
    INDEPENDIENTE: '#D946EF',
  };

  function colorPorPartido(partido?: string | null): string {
    if (!partido) return '#9CA3AF';
    const p = String(partido).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    for (const [key, color] of Object.entries(COLORES)) {
      if (p.includes(key)) return color;
    }
    return '#9CA3AF';
  }

  const estilos: Record<string, any> = {};
  let conHistorico = 0;
  let sinHistorico = 0;

  for (const feature of geojson.features) {
    const props = feature?.properties || {};
    const seccionRaw = props.seccion || props.SECCION || props.Seccion || props.sección;
    if (!seccionRaw) {
      sinHistorico++;
      continue;
    }
    const seccion = String(seccionRaw).replace(/\D/g, '').padStart(4, '0').slice(0, 4);
    const idFeature = String(props._feature_id || props.id || props.ID || props.OBJECTID || props.objectid || props.FID || props.fid || props.gid || props.GID || Math.random().toString(36).slice(2));

    const hist = historicoPorSeccion.get(seccion);
    const color = colorPorPartido(hist?.partido_ganador);
    if (hist) conHistorico++;
    else sinHistorico++;

    estilos[idFeature] = {
      color,
      nombre: `${props._feature_nombre || props.nombre || props.NOMBRE || props.seccion || seccion} (2018)`,
      metadata: { anio_historico: 2018, partido_ganador: hist?.partido_ganador || null },
    };
  }

  const nuevaCapa = await prisma.capaMapa.create({
    data: {
      tenant_id: TENANT_ID,
      nombre: `${capaBase.nombre} - 2018`,
      tipo: capaBase.tipo || 'custom',
      origen: 'propia',
      color: '#9CA3AF',
      visible: true,
      bloqueada: false,
      orden: capaBase.orden || 0,
      geojson,
      metadata: { ...(capaBase.metadata as any || {}), anio_historico: 2018, capa_base_id: capaBase.id },
      estilos,
    },
  });

  console.log(`Creada capa ${nuevaCapa.nombre} (${nuevaCapa.id}) - con histórico: ${conHistorico}, sin histórico: ${sinHistorico}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
