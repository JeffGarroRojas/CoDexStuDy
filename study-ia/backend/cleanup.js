const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAll() {
  try {
    await prisma.review.deleteMany();
    await prisma.flashcard.deleteMany();
    await prisma.document.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.coddyProfile.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ Todos los usuarios y datos eliminados');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAll();
