const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAdmin() {
  try {
    const soporte = await prisma.user.findUnique({
      where: { email: 'soporte@prospectosdigitales.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isactive: true,
        createdat: true
      }
    });
    
    console.log('✅ USUARIO VERIFICADO:\n');
    console.log(`   📧 Email: ${soporte.email}`);
    console.log(`   👤 Nombre: ${soporte.name}`);
    console.log(`   👑 Rol: ${soporte.role}`);
    console.log(`   ✓ Activo: ${soporte.isactive ? 'SÍ' : 'NO'}`);
    console.log(`   📅 Registrado: ${new Date(soporte.createdat).toLocaleDateString()}`);
    console.log('\n🎊 ¡TODO CORRECTO!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin();
