import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de ESTRATO...\n');

  // 1. Crear tenant demo
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {
      nombre_candidato: 'Candidato Demo',
      cargo_busca: 'Presidente Municipal',
      plan: 'pro',
      activo: true,
    },
    create: {
      slug: 'demo',
      url_completa: 'https://demo.estra.to',
      nombre_candidato: 'Candidato Demo',
      cargo_busca: 'Presidente Municipal',
      slogan: 'Juntos por un mejor futuro',
      plan: 'pro',
      activo: true,
    },
  });

  console.log('✅ Tenant creado:', tenant.slug);

  const permisosPorRol: Record<UserRole, string[]> = {
    [UserRole.owner]: ['dashboard', 'votantes', 'crm', 'eventos', 'mapa', 'boletines', 'llamadas', 'candidato', 'encuestas', 'casillas', 'monitoreo', 'proyeccion', 'ficha_seccional', 'historico_electoral', 'inteligencia_electoral', 'usuarios', 'app_brigada'],
    [UserRole.candidato]: ['dashboard', 'votantes', 'crm', 'eventos', 'mapa', 'boletines', 'llamadas', 'candidato', 'encuestas', 'casillas', 'monitoreo', 'proyeccion', 'ficha_seccional', 'historico_electoral', 'inteligencia_electoral', 'usuarios', 'app_brigada'],
    [UserRole.coord_general]: ['dashboard', 'votantes', 'crm', 'eventos', 'mapa', 'boletines', 'llamadas', 'encuestas', 'casillas', 'monitoreo', 'proyeccion', 'ficha_seccional', 'historico_electoral', 'inteligencia_electoral', 'app_brigada'],
    [UserRole.coord_zona]: ['dashboard', 'votantes', 'crm', 'eventos', 'mapa', 'encuestas', 'casillas', 'monitoreo', 'ficha_seccional', 'app_brigada'],
    [UserRole.brigadista]: ['app_brigada'],
    [UserRole.cm]: ['dashboard', 'crm', 'boletines', 'candidato', 'encuestas', 'monitoreo', 'proyeccion', 'ficha_seccional', 'historico_electoral', 'inteligencia_electoral'],
    [UserRole.superadmin]: ['admin'],
  };

  const passwordHash = await bcrypt.hash('demo123', 10);

  // 2. Crear usuarios de prueba
  const users = [
    { email: 'owner@demo.com', nombre: 'Administrador', rol: UserRole.owner },
    { email: 'candidato@demo.com', nombre: 'Candidato Demo', rol: UserRole.candidato },
    { email: 'coord@demo.com', nombre: 'Coordinador General', rol: UserRole.coord_general },
    { email: 'brigadista@demo.com', nombre: 'Brigadista 1', rol: UserRole.brigadista, telefono: '+521234567893', pin: '1234' },
    { email: 'cm@demo.com', nombre: 'Community Manager', rol: UserRole.cm },
  ];

  for (const user of users) {
    await prisma.usuario.upsert({
      where: { email: user.email },
      update: {
        nombre: user.nombre,
        rol: user.rol,
        telefono: (user as any).telefono || null,
        pin: (user as any).pin || null,
        password_hash: passwordHash,
        permisos: permisosPorRol[user.rol],
      },
      create: {
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        telefono: (user as any).telefono || null,
        pin: (user as any).pin || null,
        password_hash: passwordHash,
        permisos: permisosPorRol[user.rol],
        tenant: { connect: { id: tenant.id } },
        activo: true,
      },
    });
    console.log(`✅ Usuario creado: ${user.email} (${user.rol})`);
  }


  // 4. Crear resultados históricos de ejemplo
  const resultados = [
    { seccion: '0001', anio: 2024, partido_ganador: 'PARTIDO_A', votos_ganador: 1200, participacion_pct: 65.5 },
    { seccion: '0002', anio: 2024, partido_ganador: 'PARTIDO_B', votos_ganador: 1500, participacion_pct: 58.2 },
    { seccion: '0003', anio: 2024, partido_ganador: 'PARTIDO_A', votos_ganador: 980, participacion_pct: 62.1 },
  ];

  for (const resultado of resultados) {
    await prisma.resultadoHistorico.upsert({
      where: {
        tenant_id_seccion_anio: {
          tenant_id: tenant.id,
          seccion: resultado.seccion,
          anio: resultado.anio,
        },
      },
      update: {},
      create: {
        ...resultado,
        tenant_id: tenant.id,
      },
    });
  }
  console.log('✅ Resultados históricos creados');

  // 5. Crear aviso de privacidad
  await prisma.avisoPrivacidad.upsert({
    where: { tenant_id_version: { tenant_id: tenant.id, version: 1 } },
    update: {},
    create: {
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
  console.log('   Brigada app: teléfono +521234567893 / PIN 1234');
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
