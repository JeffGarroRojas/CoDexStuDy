import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando Llenado de Datos (Seed)...');

    // Perfil de Voz de Prueba para CoDDy
    const testUser = await prisma.user.upsert({
        where: { email: 'test@codexstudy.com' },
        update: {},
        create: {
            email: 'test@codexstudy.com',
            password: 'hashed_password_placeholder',
            name: 'Usuario Manual de Prueba',
        },
    });

    await prisma.voiceProfile.upsert({
        where: { userId: testUser.id },
        update: {},
        create: {
            userId: testUser.id,
            voiceName: 'Google Español',
            pitch: 1.0,
            rate: 1.05,
            volume: 1.0,
        },
    });

    console.log('✓ Perfil de voz de prueba (Audion) creado para:', testUser.email);
    console.log('✅ Llenado completado exitosamente.');
}

main()
    .catch((e) => {
        console.error('❌ Error en el Seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
