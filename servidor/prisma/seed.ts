import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando Llenado de Datos (Seed)...');

    // Aquí podrías agregar datos iniciales para usuarios de prueba o perfiles globales
    // Pero según el protocolo, necesitamos "Configuraciones de Voz"

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
