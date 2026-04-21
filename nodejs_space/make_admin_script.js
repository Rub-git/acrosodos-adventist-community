const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    const result = await prisma.user.updateMany({
      where: {
        email: {
          in: ['rubiesfamily@gmail.com', 'soporte@prospectosdigitales.com']
        }
      },
      data: {
        role: 'ADMIN'
      }
    });
    
    console.log(`✅ ${result.count} usuario(s) actualizado(s) a ADMIN`);
    
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        email: true,
        name: true,
        role: true,
        isactive: true
      }
    });
    
    console.log('\n📋 Usuarios ADMIN:');
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.name}) - ${admin.isactive ? '✓ Activo' : '✗ Suspendido'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
