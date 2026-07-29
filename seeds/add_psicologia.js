const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Ajustar ruta dependiendo de si se corre desde server/ o server/seeds/
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Specialty = require('../models/Specialty');

const addSpecialty = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/turnotopia');
    console.log('📦 Conectado a MongoDB');

    const existing = await Specialty.findOne({ name: 'Psicología' });
    if (existing) {
      console.log('⚠️ La especialidad Psicología ya existe.');
    } else {
      await Specialty.create({ 
        name: 'Psicología', 
        description: 'Salud mental y terapia psicológica', 
        defaultSlotDuration: 60 
      });
      console.log('✅ Especialidad Psicología agregada exitosamente!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addSpecialty();
