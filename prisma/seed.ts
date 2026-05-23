import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de ESTRATO...\n');

  // 1. Crear tenant demo
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      nombre_candidato: 'Candidato Demo',
      cargo_busca: 'Presidente Municipal',
      slogan: 'Juntos por un mejor futuro',
      plan: 'pro',
      activo: true,
    },
  });

  console.log('✅ Tenant creado:', tenant.slug);

  // 2. Crear usuarios de prueba
  const users = [
    { email: 'owner@demo.com', nombre: 'Administrador', rol: UserRole.owner },
    { email: 'candidato@demo.com', nombre: 'Candidato Demo', rol: UserRole.candidato },
    { email: 'coord@demo.com', nombre: 'Coordinador General', rol: UserRole.coord_general },
    { email: 'brigadista@demo.com', nombre: 'Brigadista 1', rol: UserRole.brigadista },
    { email: 'cm@demo.com', nombre: 'Community Manager', rol: UserRole.cm },
  ];

  for (const user of users) {
    await prisma.usuario.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        tenant: { connect: { id: tenant.id } },
        activo: true,
      },
    });
    console.log(`✅ Usuario creado: ${user.email} (${user.rol})`);
  }

  // 3. Crear secciones INE de ejemplo (León, Gto)
  const secciones = [
    { seccion: '0001', estado: 'Guanajuato', estado_id: 11, municipio: 'León', municipio_id: 20, distrito_federal: 1, distrito_local: 1, padron_2024: 3500, lista_nominal_2024: 3200 },
    { seccion: '0002', estado: 'Guanajuato', estado_id: 11, municipio: 'León', municipio_id: 20, distrito_federal: 1, distrito_local: 1, padron_2024: 4200, lista_nominal_2024: 3900 },
    { seccion: '0003', estado: 'Guanajuato', estado_id: 11, municipio: 'León', municipio_id: 20, distrito_federal: 1, distrito_local: 2, padron_2024: 3800, lista_nominal_2024: 3500 },
  ];

  for (const seccion of secciones) {
    await prisma.seccionINE.upsert({
      where: { seccion: seccion.seccion },
      update: {},
      create: seccion,
    });
  }
  console.log('✅ Secciones INE creadas');

  // 4. Crear resultados históricos de ejemplo
  const resultados = [
    { seccion: '0001', anio: 2024, partido_ganador: 'PARTIDO_A', votos_ganador: 1200, participacion_pct: 65.5 },
    { seccion: '0002', anio: 2024, partido_ganador: 'PARTIDO_B', votos_ganador: 1500, participacion_pct: 58.2 },
    { seccion: '0003', anio: 2024, partido_ganador: 'PARTIDO_A', votos_ganador: 980, participacion_pct: 62.1 },
  ];

  for (const resultado of resultados) {
    await prisma.resultadoHistorico.upsert({
      where: {
        seccion_anio: {
          seccion: resultado.seccion,
          anio: resultado.anio,
        },
      },
      update: {},
      create: resultado,
    });
  }
  console.log('✅ Resultados históricos creados');

  // 5. Crear aviso de privacidad
  await prisma.avisoPrivacidad.create({
    data: {
      tenant: { connect: { id: tenant.id } },
      version: 1,
      contenido: 'Aviso de privacidad demo para cumplimiento LFPDPPP...',
      fecha_vigencia: new Date(),
      activo: true,
    },
  });
  console.log('✅ Aviso de privacidad creado');

  // 6. Crear votantes de ejemplo
  const votantes = [
    { nombre: 'Juan Pérez', telefono: '+521234567890', seccion_electoral: '0001', colonia: 'Centro', nivel_apoyo: 4, tags: ['voluntario', 'eventos'] },
    { nombre: 'María García', telefono: '+521234567891', seccion_electoral: '0002', colonia: 'San Pedro', nivel_apoyo: 5, tags: ['lider', 'donador'] },
    { nombre: 'Carlos López', telefono: '+521234567892', seccion_electoral: '0001', colonia: 'Centro', nivel_apoyo: 3, tags: ['simpatizante'] },
  ];

  for (const v of votantes) {
    await prisma.votante.create({
      data: {
        ...v,
        tenant: { connect: { id: tenant.id } },
        activo: true,
      },
    });
  }
  console.log('✅ Votantes de ejemplo creados');

  // 7. Crear evento de ejemplo
  const evento = await prisma.evento.create({
    data: {
      tenant: { connect: { id: tenant.id } },
      nombre: 'Mitin de Inicio de Campaña',
      descripcion: 'Evento inaugural con el candidato',
      direccion: 'Plaza Principal, León Gto',
      fecha_inicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días después
      qr_code: `QR-${tenant.id}-${Date.now()}`,
      asistentes_estimados: 500,
      status: 'programado',
    },
  });
  console.log('✅ Evento creado:', evento.nombre);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📌 Credenciales de prueba:');
  console.log('   owner@demo.com (Owner)');
  console.log('   candidato@demo.com (Candidato)');
  console.log('   coord@demo.com (Coordinador)');
  console.log('   brigadista@demo.com (Brigadista)');
  console.log('   cm@demo.com (Community Manager)');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
