import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INDICADORES = [
  // Población
  {
    categoria: 'poblacion',
    subcategoria: 'total',
    indicador: 'Población total',
    valor_numerico: 163038,
    unidad: 'habitantes',
    periodo: '2020',
    fuente: 'INEGI / Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Población total del municipio según el Censo de Población y Vivienda 2020.',
  },
  {
    categoria: 'poblacion',
    subcategoria: 'hombres',
    indicador: 'Población por género',
    valor_numerico: 76711,
    unidad: 'habitantes',
    periodo: '2020',
    fuente: 'INEGI / Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Población masculina.',
  },
  {
    categoria: 'poblacion',
    subcategoria: 'mujeres',
    indicador: 'Población por género',
    valor_numerico: 86327,
    unidad: 'habitantes',
    periodo: '2020',
    fuente: 'INEGI / Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Población femenina.',
  },
  {
    categoria: 'poblacion',
    subcategoria: 'lengua indigena',
    indicador: 'Población que habla lengua indígena',
    valor_numerico: 362,
    unidad: 'habitantes',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Habitantes de 3 años y más que hablan alguna lengua indígena.',
  },
  {
    categoria: 'poblacion',
    subcategoria: '15-64 años',
    indicador: 'Población en edad productiva',
    valor_numerico: 101578,
    unidad: 'habitantes',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://telencuestas.com/censos-de-poblacion/mexico/2020/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Población entre 15 y 64 años de edad.',
  },
  {
    categoria: 'poblacion',
    subcategoria: 'menores 15',
    indicador: 'Menores de 15 años',
    valor_numerico: 50255,
    unidad: 'habitantes',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://telencuestas.com/censos-de-poblacion/mexico/2020/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Población menor de 15 años.',
  },
  {
    categoria: 'poblacion',
    subcategoria: '65+ años',
    indicador: 'Adultos mayores',
    valor_numerico: 11040,
    unidad: 'habitantes',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://telencuestas.com/censos-de-poblacion/mexico/2020/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Población de 65 años y más.',
  },
  {
    categoria: 'poblacion',
    subcategoria: 'total hogares',
    indicador: 'Total de hogares',
    valor_numerico: 38964,
    unidad: 'hogares',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://telencuestas.com/censos-de-poblacion/mexico/2020/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Hogares censados en el municipio.',
  },

  // Vivienda
  {
    categoria: 'vivienda',
    subcategoria: 'viviendas habitadas',
    indicador: 'Viviendas habitadas',
    valor_numerico: 38976,
    unidad: 'viviendas',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://telencuestas.com/censos-de-poblacion/mexico/2020/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Viviendas particulares habitadas.',
  },
  {
    categoria: 'vivienda',
    subcategoria: 'promedio ocupantes',
    indicador: 'Promedio de ocupantes por hogar',
    valor_numerico: 4.2,
    unidad: 'personas',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://telencuestas.com/censos-de-poblacion/mexico/2020/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Número promedio de personas que habitan cada hogar.',
  },
  {
    categoria: 'vivienda',
    subcategoria: '3 cuartos',
    indicador: 'Viviendas con 3 cuartos',
    valor_numerico: 29.4,
    unidad: '%',
    periodo: '2020',
    fuente: 'INEGI / Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Porcentaje de viviendas con tres cuartos.',
  },
  {
    categoria: 'vivienda',
    subcategoria: '2 dormitorios',
    indicador: 'Viviendas con 2 dormitorios',
    valor_numerico: 38.5,
    unidad: '%',
    periodo: '2020',
    fuente: 'INEGI / Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Porcentaje de viviendas con dos dormitorios.',
  },

  // Educación
  {
    categoria: 'educacion',
    subcategoria: 'secundaria',
    indicador: 'Escolaridad principal',
    valor_numerico: 37800,
    unidad: 'personas',
    periodo: '2020',
    fuente: 'INEGI / Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Personas cuyo grado máximo de escolaridad es secundaria.',
  },
  {
    categoria: 'educacion',
    subcategoria: 'primaria',
    indicador: 'Escolaridad principal',
    valor_numerico: 33000,
    unidad: 'personas',
    periodo: '2020',
    fuente: 'INEGI / Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Personas cuyo grado máximo de escolaridad es primaria.',
  },
  {
    categoria: 'educacion',
    subcategoria: 'preparatoria',
    indicador: 'Escolaridad principal',
    valor_numerico: 17900,
    unidad: 'personas',
    periodo: '2020',
    fuente: 'INEGI / Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Personas cuyo grado máximo de escolaridad es preparatoria o bachillerato.',
  },
  {
    categoria: 'educacion',
    subcategoria: 'analfabetismo',
    indicador: 'Tasa de analfabetismo',
    valor_numerico: 8.04,
    unidad: '%',
    periodo: '2020',
    fuente: 'INEGI / Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Porcentaje de población de 15 años y más que no sabe leer ni escribir.',
  },
  {
    categoria: 'educacion',
    subcategoria: 'eficiencia primaria mujeres',
    indicador: 'Eficiencia terminal en primaria',
    valor_numerico: 102.1,
    unidad: '%',
    periodo: '2022-2023',
    fuente: 'Instituto para las Mujeres Guanajuatenses',
    fuente_url: 'https://mujeres.guanajuato.gob.mx/docs/5059/Dolores_Hidalgo_C._I._N._1.pdf',
    descripcion: 'Eficiencia terminal en primaria para niñas.',
  },
  {
    categoria: 'educacion',
    subcategoria: 'eficiencia primaria hombres',
    indicador: 'Eficiencia terminal en primaria',
    valor_numerico: 100.0,
    unidad: '%',
    periodo: '2022-2023',
    fuente: 'Instituto para las Mujeres Guanajuatenses',
    fuente_url: 'https://mujeres.guanajuato.gob.mx/docs/5059/Dolores_Hidalgo_C._I._N._1.pdf',
    descripcion: 'Eficiencia terminal en primaria para niños.',
  },
  {
    categoria: 'educacion',
    subcategoria: 'eficiencia secundaria mujeres',
    indicador: 'Eficiencia terminal en secundaria',
    valor_numerico: 87.7,
    unidad: '%',
    periodo: '2022-2023',
    fuente: 'Instituto para las Mujeres Guanajuatenses',
    fuente_url: 'https://mujeres.guanajuato.gob.mx/docs/5059/Dolores_Hidalgo_C._I._N._1.pdf',
    descripcion: 'Eficiencia terminal en secundaria para mujeres.',
  },
  {
    categoria: 'educacion',
    subcategoria: 'eficiencia secundaria hombres',
    indicador: 'Eficiencia terminal en secundaria',
    valor_numerico: 77.9,
    unidad: '%',
    periodo: '2022-2023',
    fuente: 'Instituto para las Mujeres Guanajuatenses',
    fuente_url: 'https://mujeres.guanajuato.gob.mx/docs/5059/Dolores_Hidalgo_C._I._N._1.pdf',
    descripcion: 'Eficiencia terminal en secundaria para hombres.',
  },

  // Empleo
  {
    categoria: 'empleo',
    subcategoria: 'PEA',
    indicador: 'Población Económicamente Activa',
    valor_numerico: 76217,
    unidad: 'personas',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://www.municipiodata.com/municipios/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Población de 12 años y más económicamente activa.',
  },
  {
    categoria: 'empleo',
    subcategoria: 'ocupados',
    indicador: 'Población ocupada',
    valor_numerico: 75382,
    unidad: 'personas',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://www.municipiodata.com/municipios/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Personas que tienen un trabajo.',
  },
  {
    categoria: 'empleo',
    subcategoria: 'desocupados',
    indicador: 'Población desocupada',
    valor_numerico: 835,
    unidad: 'personas',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://www.municipiodata.com/municipios/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Personas que buscan trabajo y no lo encuentran.',
  },
  {
    categoria: 'empleo',
    subcategoria: 'tasa desocupacion',
    indicador: 'Tasa de desocupación',
    valor_numerico: 1.1,
    unidad: '%',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://www.municipiodata.com/municipios/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Porcentaje de la PEA que está desocupada.',
  },
  {
    categoria: 'empleo',
    subcategoria: 'tiempo traslado trabajo',
    indicador: 'Tiempo promedio de traslado al trabajo',
    valor_numerico: 27.1,
    unidad: 'minutos',
    periodo: '2020',
    fuente: 'INEGI / Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Tiempo promedio que tardan los trabajadores en llegar a su empleo.',
  },
  {
    categoria: 'empleo',
    subcategoria: 'tiempo traslado escuela',
    indicador: 'Tiempo promedio de traslado al colegio',
    valor_numerico: 17.2,
    unidad: 'minutos',
    periodo: '2020',
    fuente: 'INEGI / Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Tiempo promedio que tardan los estudiantes en llegar a la escuela.',
  },

  // Economía
  {
    categoria: 'economia',
    subcategoria: 'establecimientos registrados',
    indicador: 'Establecimientos registrados',
    valor_numerico: 6496,
    unidad: 'establecimientos',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://www.municipiodata.com/municipios/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Total de establecimientos económicos registrados en el municipio.',
  },
  {
    categoria: 'economia',
    subcategoria: 'comercio al por menor',
    indicador: 'Establecimientos por sector',
    valor_numerico: 3037,
    unidad: 'establecimientos',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://www.municipiodata.com/municipios/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Establecimientos dedicados al comercio al por menor.',
  },
  {
    categoria: 'economia',
    subcategoria: 'otros servicios',
    indicador: 'Establecimientos por sector',
    valor_numerico: 953,
    unidad: 'establecimientos',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://www.municipiodata.com/municipios/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Establecimientos de otros servicios excepto gobierno.',
  },
  {
    categoria: 'economia',
    subcategoria: 'alojamiento y alimentos',
    indicador: 'Establecimientos por sector',
    valor_numerico: 828,
    unidad: 'establecimientos',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://www.municipiodata.com/municipios/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Establecimientos de servicios de alojamiento y preparación de alimentos.',
  },
  {
    categoria: 'economia',
    subcategoria: 'industria manufacturera',
    indicador: 'Establecimientos por sector',
    valor_numerico: 579,
    unidad: 'establecimientos',
    periodo: '2020',
    fuente: 'INEGI',
    fuente_url: 'https://www.municipiodata.com/municipios/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Establecimientos de industrias manufactureras.',
  },
  {
    categoria: 'economia',
    subcategoria: 'remesas',
    indicador: 'Remesas recibidas',
    valor_numerico: 72.1,
    unidad: 'millones USD',
    periodo: '2026-T1',
    fuente: 'Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Remesas totales recibidas en el primer trimestre de 2026.',
  },
  {
    categoria: 'economia',
    subcategoria: 'denuncias',
    indicador: 'Denuncias totales',
    valor_numerico: 372,
    unidad: 'denuncias',
    periodo: 'oct-2025',
    fuente: 'Data México',
    fuente_url: 'https://www.economia.gob.mx/datamexico/es/profile/geo/dolores-hidalgo-cuna-de-la-independencia-nacional?redirect=true',
    descripcion: 'Denuncias del fuero común registradas.',
  },

  // Pobreza
  {
    categoria: 'pobreza',
    subcategoria: 'poblacion pobreza',
    indicador: 'Población en situación de pobreza',
    valor_numerico: 93078,
    unidad: 'personas',
    periodo: '2024',
    fuente: 'Secretaría de Bienestar / CONEVAL',
    fuente_url: 'https://www.gob.mx/cms/uploads/attachment/file/1061154/11014_DoloresHidalgo_2026.pdf',
    descripcion: 'Población que no puede cubrir la canasta alimentaria y no alimentaria.',
  },
  {
    categoria: 'pobreza',
    subcategoria: 'pobreza extrema',
    indicador: 'Población en pobreza extrema',
    valor_numerico: 10182,
    unidad: 'personas',
    periodo: '2015',
    fuente: 'CONEVAL',
    fuente_url: 'https://www.municipiodata.com/municipios/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Población que no puede cubrir siquiera la canasta alimentaria.',
  },
  {
    categoria: 'pobreza',
    subcategoria: 'vulnerable carencias',
    indicador: 'Población vulnerable por carencias',
    valor_numerico: 48374,
    unidad: 'personas',
    periodo: '2015',
    fuente: 'CONEVAL',
    fuente_url: 'https://www.municipiodata.com/municipios/guanajuato/dolores-hidalgo-cuna-de-la-independencia-nacional',
    descripcion: 'Población que presenta carencias sociales pero no carencias económicas.',
  },
  {
    categoria: 'pobreza',
    subcategoria: 'ingreso promedio hogares',
    indicador: 'Ingreso promedio mensual de hogares',
    valor_numerico: 17887,
    unidad: 'MXN',
    periodo: '2024',
    fuente: 'Secretaría de Bienestar',
    fuente_url: 'https://www.gob.mx/cms/uploads/attachment/file/1061154/11014_DoloresHidalgo_2026.pdf',
    descripcion: 'Ingreso corriente promedio mensual de los hogares del municipio.',
  },
  {
    categoria: 'pobreza',
    subcategoria: 'coeficiente gini',
    indicador: 'Coeficiente de Gini',
    valor_numerico: 0.376,
    unidad: 'índice',
    periodo: '2024',
    fuente: 'Secretaría de Bienestar',
    fuente_url: 'https://www.gob.mx/cms/uploads/attachment/file/1061154/11014_DoloresHidalgo_2026.pdf',
    descripcion: 'Indicador de desigualdad en el ingreso; 0 es igualdad perfecta.',
  },
  {
    categoria: 'pobreza',
    subcategoria: 'carencia seguridad social',
    indicador: 'Carencia por acceso a seguridad social',
    valor_numerico: 80.6,
    unidad: '%',
    periodo: '2024',
    fuente: 'Secretaría de Bienestar',
    fuente_url: 'https://www.gob.mx/cms/uploads/attachment/file/1061154/11014_DoloresHidalgo_2026.pdf',
    descripcion: 'Porcentaje de población sin acceso a seguridad social.',
  },
  {
    categoria: 'pobreza',
    subcategoria: 'carencia alimentacion',
    indicador: 'Carencia por acceso a alimentación nutritiva',
    valor_numerico: 37.8,
    unidad: '%',
    periodo: '2024',
    fuente: 'Secretaría de Bienestar',
    fuente_url: 'https://www.gob.mx/cms/uploads/attachment/file/1061154/11014_DoloresHidalgo_2026.pdf',
    descripcion: 'Porcentaje de población con carencia por acceso a la alimentación.',
  },
  {
    categoria: 'pobreza',
    subcategoria: 'carencia servicios basicos',
    indicador: 'Carencia por servicios básicos en la vivienda',
    valor_numerico: 23.7,
    unidad: '%',
    periodo: '2024',
    fuente: 'Secretaría de Bienestar',
    fuente_url: 'https://www.gob.mx/cms/uploads/attachment/file/1061154/11014_DoloresHidalgo_2026.pdf',
    descripcion: 'Porcentaje de población con carencia por servicios básicos de vivienda.',
  },
  {
    categoria: 'pobreza',
    subcategoria: 'rezago educativo',
    indicador: 'Rezago educativo',
    valor_numerico: 23.5,
    unidad: '%',
    periodo: '2024',
    fuente: 'Secretaría de Bienestar',
    fuente_url: 'https://www.gob.mx/cms/uploads/attachment/file/1061154/11014_DoloresHidalgo_2026.pdf',
    descripcion: 'Porcentaje de población con rezago educativo.',
  },

  // Participación política
  {
    categoria: 'participacion politica',
    subcategoria: 'regidurias mujeres',
    indicador: 'Regidurías ocupadas por mujeres',
    valor_numerico: 60,
    unidad: '%',
    periodo: '2024-2027',
    fuente: 'Instituto para las Mujeres Guanajuatenses',
    fuente_url: 'https://mujeres.guanajuato.gob.mx/docs/5059/Dolores_Hidalgo_C._I._N._1.pdf',
    descripcion: 'Porcentaje de regidurías que serán ocupadas por mujeres en la administración 2024-2027.',
  },
  {
    categoria: 'participacion politica',
    subcategoria: 'sindicaturas mujeres',
    indicador: 'Sindicaturas ocupadas por mujeres',
    valor_numerico: 1,
    unidad: 'sindicaturas',
    periodo: '2024-2027',
    fuente: 'Instituto para las Mujeres Guanajuatenses',
    fuente_url: 'https://mujeres.guanajuato.gob.mx/docs/5059/Dolores_Hidalgo_C._I._N._1.pdf',
    descripcion: 'Número de sindicaturas ocupadas por mujeres en la administración 2024-2027.',
  },
];

async function main() {
  const slugFilter = process.env.DATA_TENANT_SLUG;
  const allTenantsFlag = process.env.DATA_ALL_TENANTS === 'true';

  if (!slugFilter && !allTenantsFlag) {
    console.error('❌ Seguridad: debes especificar el tenant objetivo.');
    console.error('   Opciones:');
    console.error('     DATA_TENANT_SLUG=yazmin-villanueva npx ts-node prisma/seed-data-dolores-hidalgo.ts');
    console.error('     DATA_ALL_TENANTS=true npx ts-node prisma/seed-data-dolores-hidalgo.ts');
    process.exit(1);
  }

  const where: any = allTenantsFlag
    ? { activo: true }
    : { slug: { in: slugFilter!.split(',').map((s) => s.trim()) } };

  const tenants = await prisma.tenant.findMany({ where });

  if (!tenants.length) {
    console.log('⚠️ No se encontraron tenants para cargar indicadores.');
    return;
  }

  console.log(`🌱 Cargando ${INDICADORES.length} indicadores de Dolores Hidalgo en ${tenants.length} tenant(s)...\n`);

  for (const tenant of tenants) {
    let total = 0;

    for (const item of INDICADORES) {
      await prisma.indicadorMunicipal.upsert({
        where: {
          indicador_unico: {
            tenant_id: tenant.id,
            categoria: item.categoria,
            indicador: item.indicador,
            subcategoria: item.subcategoria,
            periodo: item.periodo,
          },
        },
        update: {
          descripcion: item.descripcion,
          valor_numerico: item.valor_numerico,
          unidad: item.unidad,
          fuente: item.fuente,
          fuente_url: item.fuente_url,
        },
        create: {
          tenant_id: tenant.id,
          ...item,
        },
      });
      total++;
    }

    console.log(`✅ Tenant "${tenant.slug}" — ${total} indicadores cargados/actualizados`);
  }

  console.log('\n🎉 Seed de Data México completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
