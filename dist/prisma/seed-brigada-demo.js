"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Actualizando brigadista demo...\n');
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
    console.log('✅ Tenant demo listo:', tenant.slug);
    const brigadista = await prisma.usuario.upsert({
        where: { email: 'brigadista@demo.com' },
        update: {
            nombre: 'Brigadista 1',
            rol: client_1.UserRole.brigadista,
            telefono: '+521234567893',
            pin: '1234',
            activo: true,
            tenant_id: tenant.id,
        },
        create: {
            email: 'brigadista@demo.com',
            nombre: 'Brigadista 1',
            rol: client_1.UserRole.brigadista,
            telefono: '+521234567893',
            pin: '1234',
            activo: true,
            tenant_id: tenant.id,
        },
    });
    console.log('✅ Brigadista demo listo:', brigadista.email, brigadista.telefono, brigadista.pin);
    console.log('\n📌 App brigada: teléfono +521234567893 / PIN 1234');
}
main()
    .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-brigada-demo.js.map