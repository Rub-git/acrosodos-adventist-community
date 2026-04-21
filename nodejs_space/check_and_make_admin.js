const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndMakeAdmin() {
  try {
    console.log('🔍 Verificando usuarios...\n');
    
    // Verificar ambos usuarios
    const rubisel = await prisma.user.findUnique({
      where: { email: 'rubiesfamily@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isactive: true,
        suspensionreason: true,
        createdat: true
      }
    });
    
    const soporte = await prisma.user.findUnique({
      where: { email: 'soporte@prospectosdigitales.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isactive: true,
        suspensionreason: true,
        createdat: true
      }
    });
    
    console.log('📧 rubiesfamily@gmail.com:');
    if (rubisel) {
      console.log(`   ✓ Existe`);
      console.log(`   - Nombre: ${rubisel.name}`);
      console.log(`   - Rol: ${rubisel.role}`);
      console.log(`   - Activo: ${rubisel.isactive ? '✓ Sí' : '✗ NO - SUSPENDIDO'}`);
      if (!rubisel.isactive) {
        console.log(`   - Razón: ${rubisel.suspensionreason || 'N/A'}`);
      }
      console.log(`   - Registrado: ${rubisel.createdat}`);
    } else {
      console.log('   ✗ NO EXISTE - Necesitas registrarte primero');
    }
    
    console.log('\n📧 soporte@prospectosdigitales.com:');
    if (soporte) {
      console.log(`   ✓ Existe`);
      console.log(`   - Nombre: ${soporte.name}`);
      console.log(`   - Rol: ${soporte.role}`);
      console.log(`   - Activo: ${soporte.isactive ? '✓ Sí' : '✗ NO - SUSPENDIDO'}`);
      if (!soporte.isactive) {
        console.log(`   - Razón: ${soporte.suspensionreason || 'N/A'}`);
      }
      console.log(`   - Registrado: ${soporte.createdat}`);
      
      // Hacer ADMIN si no lo es
      if (soporte.role !== 'ADMIN') {
        console.log('\n🔧 Actualizando a ADMIN...');
        await prisma.user.update({
          where: { email: 'soporte@prospectosdigitales.com' },
          data: { role: 'ADMIN' }
        });
        console.log('✅ soporte@prospectosdigitales.com ahora es ADMIN');
      } else {
        console.log('   ✓ Ya es ADMIN');
      }
    } else {
      console.log('   ✗ NO EXISTE - Necesitas registrarte primero');
    }
    
    // Verificar todos los ADMIN
    console.log('\n\n📋 TODOS LOS USUARIOS ADMIN:');
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        email: true,
        name: true,
        isactive: true
      }
    });
    
    if (admins.length === 0) {
      console.log('   ⚠️ No hay usuarios ADMIN');
    } else {
      admins.forEach(admin => {
        console.log(`   ${admin.isactive ? '✓' : '✗'} ${admin.email} (${admin.name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndMakeAdmin();
