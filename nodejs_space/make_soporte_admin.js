const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeSoporteAdmin() {
  try {
    const soporte = await prisma.user.findUnique({
      where: { email: 'soporte@prospectosdigitales.com' }
    });
    
    if (!soporte) {
      console.log('❌ soporte@prospectosdigitales.com NO EXISTE');
      console.log('   Regístrate primero en la app');
      return;
    }
    
    if (soporte.role === 'ADMIN') {
      console.log('✅ soporte@prospectosdigitales.com YA ES ADMIN');
      return;
    }
    
    await prisma.user.update({
      where: { email: 'soporte@prospectosdigitales.com' },
      data: { role: 'ADMIN' }
    });
    
    console.log('🎉 ¡LISTO! soporte@prospectosdigitales.com ahora es ADMIN');
    console.log('   Cierra sesión y entra de nuevo para ver el tab Admin 👑');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

makeSoporteAdmin();
