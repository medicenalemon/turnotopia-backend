const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Specialty = require('../models/Specialty');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const newSpecialtiesData = [
  { name: 'Psiquiatría', description: 'Trastornos mentales', defaultSlotDuration: 45 },
  { name: 'Nutrición', description: 'Alimentación y dietética', defaultSlotDuration: 30 },
  { name: 'Kinesiología', description: 'Rehabilitación física', defaultSlotDuration: 40 },
  { name: 'Odontología', description: 'Salud bucal', defaultSlotDuration: 30 },
  { name: 'Endocrinología', description: 'Sistema endocrino', defaultSlotDuration: 30 },
  { name: 'Gastroenterología', description: 'Aparato digestivo', defaultSlotDuration: 30 },
  { name: 'Neumonología', description: 'Sistema respiratorio', defaultSlotDuration: 30 },
  { name: 'Reumatología', description: 'Enfermedades reumáticas', defaultSlotDuration: 30 },
  { name: 'Oncología', description: 'Tratamiento del cáncer', defaultSlotDuration: 45 },
  { name: 'Alergia e Inmunología', description: 'Sistema inmunitario', defaultSlotDuration: 30 },
];

const generatePatients = (count) => {
  const patients = [];
  const nombres = ['Carlos', 'María', 'José', 'Laura', 'Luis', 'Ana', 'Diego', 'Sofía', 'Martín', 'Lucía', 'Pablo', 'Camila', 'Andrés', 'Valentina', 'Federico'];
  const apellidos = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Pérez', 'Gómez', 'Sánchez', 'Romero', 'Sosa', 'Ruiz', 'Torres', 'Suárez', 'Díaz'];
  
  for (let i = 0; i < count; i++) {
    const fn = nombres[i % nombres.length];
    const ln = apellidos[(i * 3) % apellidos.length];
    patients.push({
      firstName: fn,
      lastName: `${ln} ${i}`,
      dni: `${30000000 + i}`,
      email: `paciente${i}@email.com`,
      phone: `115500${String(i).padStart(4, '0')}`,
      dateOfBirth: new Date(1950 + (i % 50), i % 12, (i % 28) + 1),
      address: `Calle Falsa ${i}`,
      medicalInsurance: ['OSDE', 'Swiss Medical', 'Galeno', 'Medicus'][i % 4],
      insuranceNumber: `INS-${i}`
    });
  }
  return patients;
};

const generateDoctors = (count, specialties) => {
  const doctorsData = [];
  const nombres = ['Roberto', 'Julieta', 'Ricardo', 'Florencia', 'Fernando', 'Carolina', 'Gustavo', 'Mariana', 'Hernán', 'Verónica'];
  const apellidos = ['Herrera', 'Alonso', 'Giménez', 'Gutiérrez', 'Molina', 'Castro', 'Silva', 'Rojas', 'Ortiz', 'Luna'];

  for (let i = 0; i < count; i++) {
    const fn = nombres[i % nombres.length];
    const ln = apellidos[(i * 3) % apellidos.length];
    doctorsData.push({
      name: `Dr. ${fn} ${ln}`,
      email: `medico${i + 50}@turnotopia.com`,
      specialty: specialties[i % specialties.length]._id,
      license: `MN-${20000 + i}`,
      phone: `116600${String(i + 50).padStart(4, '0')}`,
      schedule: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '14:00', slotDuration: 30 },
        { dayOfWeek: 3, startTime: '08:00', endTime: '14:00', slotDuration: 30 },
        { dayOfWeek: 4, startTime: '14:00', endTime: '18:00', slotDuration: 20 }
      ]
    });
  }
  return doctorsData;
};

const seedBulk = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/turnotopia');
    console.log('📦 Conectado a MongoDB');

    const specialties = await Specialty.insertMany(newSpecialtiesData);
    console.log(`🏥 ${specialties.length} nuevas especialidades creadas`);

    const allSpecialties = await Specialty.find({});

    const doctorsData = generateDoctors(25, allSpecialties);
    const doctors = [];
    for (const doc of doctorsData) {
      const user = await User.create({ name: doc.name, email: doc.email, password: 'doctor123', role: 'doctor' });
      const doctor = await Doctor.create({ user: user._id, specialty: doc.specialty, licenseNumber: doc.license, phone: doc.phone, schedule: doc.schedule });
      doctors.push(doctor);
    }
    console.log(`👨‍⚕️ ${doctors.length} médicos inyectados`);

    const patientsData = generatePatients(100);
    const patients = await Patient.insertMany(patientsData);
    console.log(`🧑 ${patients.length} pacientes inyectados`);

    console.log('\n✅ Datos masivos inyectados exitosamente sin borrar los existentes!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedBulk();
