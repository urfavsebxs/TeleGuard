import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Admin } from '../models/Admin.model';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teleguard';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario admin');
      console.log('📋 Credenciales actuales:');
      console.log('   Usuario: admin');
      console.log('   (La contraseña está hasheada en la BD)');
      process.exit(0);
    }

    // Generar contraseña aleatoria
    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    
    // Crear admin
    const admin = new Admin({
      username: 'admin',
      password: randomPassword, // Se hasheará automáticamente
    });

    await admin.save();

    console.log('\n✅ Usuario administrador creado exitosamente!\n');
    console.log('╔════════════════════════════════════════╗');
    console.log('║      CREDENCIALES DE ADMINISTRADOR     ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log('👤 Usuario:    admin');
    console.log(`🔑 Contraseña: ${randomPassword}\n`);
    console.log('⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro!');
    console.log('💡 Puedes cambiar la contraseña desde el dashboard.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario admin:', error);
    process.exit(1);
  }
};

createAdminUser();
