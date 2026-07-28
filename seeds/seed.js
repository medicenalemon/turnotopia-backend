const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Specialty = require('../models/Specialty');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

const specialtiesData = [
  { name: 'Clínica Médica', description: 'Medicina general y diagnóstico', defaultSlotDuration: 30 },
  { name: 'Cardiología', description: 'Enfermedades del corazón y sistema circulatorio', defaultSlotDuration: 30 },
  { name: 'Dermatología', description: 'Enfermedades de la piel', defaultSlotDuration: 20 },
  { name: 'Ginecología', description: 'Salud reproductiva femenina', defaultSlotDuration: 30 },
  { name: 'Traumatología', description: 'Lesiones del sistema musculoesquelético', defaultSlotDuration: 30 },
  { name: 'Pediatría', description: 'Medicina infantil', defaultSlotDuration: 20 },
  { name: 'Oftalmología', description: 'Enfermedades de los ojos', defaultSlotDuration: 20 },
  { name: 'Neurología', description: 'Enfermedades del sistema nervioso', defaultSlotDuration: 40 },
  { name: 'Otorrinolaringología', description: 'Oído, nariz y garganta', defaultSlotDuration: 20 },
  { name: 'Urología', description: 'Sistema urinario y reproductor masculino', defaultSlotDuration: 30 }
];

const patientsData = [
  { firstName: 'María', lastName: 'González', dni: '30123456', email: 'maria@email.com', phone: '1155001001', dateOfBirth: new Date('1985-03-15'), address: 'Av. Corrientes 1234', medicalInsurance: 'OSDE', insuranceNumber: 'OSDE-001' },
  { firstName: 'Juan', lastName: 'Pérez', dni: '28654321', email: 'juan@email.com', phone: '1155002002', dateOfBirth: new Date('1980-07-22'), address: 'Av. Rivadavia 5678', medicalInsurance: 'Swiss Medical', insuranceNumber: 'SM-002' },
  { firstName: 'Ana', lastName: 'Rodríguez', dni: '35789012', email: 'ana@email.com', phone: '1155003003', dateOfBirth: new Date('1992-11-08'), address: 'Calle Florida 910', medicalInsurance: 'Galeno', insuranceNumber: 'GAL-003' },
  { firstName: 'Carlos', lastName: 'López', dni: '27345678', email: 'carlos@email.com', phone: '1155004004', dateOfBirth: new Date('1978-01-30'), address: 'Av. Santa Fe 2345', medicalInsurance: 'OSDE', insuranceNumber: 'OSDE-004' },
  { firstName: 'Laura', lastName: 'Martínez', dni: '33456789', email: 'laura@email.com', phone: '1155005005', dateOfBirth: new Date('1990-05-12'), address: 'Av. Callao 678', medicalInsurance: 'Medicus', insuranceNumber: 'MED-005' },
  { firstName: 'Roberto', lastName: 'Fernández', dni: '25678901', email: 'roberto@email.com', phone: '1155006006', dateOfBirth: new Date('1975-09-25'), address: 'Calle Lavalle 345', medicalInsurance: 'Swiss Medical', insuranceNumber: 'SM-006' },
  { firstName: 'Sofía', lastName: 'García', dni: '38901234', email: 'sofia@email.com', phone: '1155007007', dateOfBirth: new Date('1995-12-03'), address: 'Av. de Mayo 789', medicalInsurance: 'OSDE', insuranceNumber: 'OSDE-007' },
  { firstName: 'Diego', lastName: 'Hernández', dni: '31234567', email: 'diego@email.com', phone: '1155008008', dateOfBirth: new Date('1988-04-18'), address: 'Av. Belgrano 1012', medicalInsurance: 'Galeno', insuranceNumber: 'GAL-008' },
  { firstName: 'Valentina', lastName: 'Torres', dni: '36012345', email: 'valentina@email.com', phone: '1155009009', dateOfBirth: new Date('1993-08-07'), address: 'Calle Suipacha 234', medicalInsurance: 'Medicus', insuranceNumber: 'MED-009' },
  { firstName: 'Martín', lastName: 'Díaz', dni: '29876543', email: 'martin@email.com', phone: '1155010010', dateOfBirth: new Date('1982-02-14'), address: 'Av. 9 de Julio 567', medicalInsurance: 'OSDE', insuranceNumber: 'OSDE-010' },
  { firstName: 'Lucía', lastName: 'Sánchez', dni: '34567890', email: 'lucia@email.com', phone: '1155011011', dateOfBirth: new Date('1991-06-21'), address: 'Calle Tucumán 890', medicalInsurance: 'Swiss Medical', insuranceNumber: 'SM-011' },
  { firstName: 'Pablo', lastName: 'Ramírez', dni: '26789012', email: 'pablo@email.com', phone: '1155012012', dateOfBirth: new Date('1976-10-09'), address: 'Av. Pueyrredón 123', medicalInsurance: 'Galeno', insuranceNumber: 'GAL-012' },
  { firstName: 'Camila', lastName: 'Moreno', dni: '37890123', email: 'camila@email.com', phone: '1155013013', dateOfBirth: new Date('1994-03-28'), address: 'Calle Paraguay 456', medicalInsurance: 'OSDE', insuranceNumber: 'OSDE-013' },
  { firstName: 'Andrés', lastName: 'Romero', dni: '30234567', email: 'andres@email.com', phone: '1155014014', dateOfBirth: new Date('1986-07-16'), address: 'Av. Las Heras 789', medicalInsurance: 'Medicus', insuranceNumber: 'MED-014' },
  { firstName: 'Florencia', lastName: 'Acosta', dni: '32345678', email: 'florencia@email.com', phone: '1155015015', dateOfBirth: new Date('1989-11-02'), address: 'Calle Maipú 012', medicalInsurance: 'Swiss Medical', insuranceNumber: 'SM-015' },
  { firstName: 'Nicolás', lastName: 'Vargas', dni: '28901234', email: 'nicolas@email.com', phone: '1155016016', dateOfBirth: new Date('1981-01-19'), address: 'Av. Independencia 345', medicalInsurance: 'Galeno', insuranceNumber: 'GAL-016' },
  { firstName: 'Julieta', lastName: 'Castro', dni: '35012345', email: 'julieta@email.com', phone: '1155017017', dateOfBirth: new Date('1992-05-05'), address: 'Calle Esmeralda 678', medicalInsurance: 'OSDE', insuranceNumber: 'OSDE-017' },
  { firstName: 'Ignacio', lastName: 'Muñoz', dni: '27123456', email: 'ignacio@email.com', phone: '1155018018', dateOfBirth: new Date('1977-09-13'), address: 'Av. Córdoba 901', medicalInsurance: 'Medicus', insuranceNumber: 'MED-018' },
  { firstName: 'Daniela', lastName: 'Álvarez', dni: '39012345', email: 'daniela@email.com', phone: '1155019019', dateOfBirth: new Date('1996-12-27'), address: 'Calle San Martín 234', medicalInsurance: 'Swiss Medical', insuranceNumber: 'SM-019' },
  { firstName: 'Federico', lastName: 'Gutiérrez', dni: '31345678', email: 'federico@email.com', phone: '1155020020', dateOfBirth: new Date('1987-04-08'), address: 'Av. Alem 567', medicalInsurance: 'OSDE', insuranceNumber: 'OSDE-020' }
];

const doctorsData = [
  { name: 'Dr. Alejandro Medina', email: 'medina@turnotopia.com', specialtyName: 'Cardiología', license: 'MN-12345', phone: '1166001001', schedule: [{ dayOfWeek: 1, startTime: '08:00', endTime: '14:00', slotDuration: 30 }, { dayOfWeek: 3, startTime: '08:00', endTime: '14:00', slotDuration: 30 }, { dayOfWeek: 5, startTime: '08:00', endTime: '12:00', slotDuration: 30 }] },
  { name: 'Dra. Carolina Vega', email: 'vega@turnotopia.com', specialtyName: 'Dermatología', license: 'MN-23456', phone: '1166002002', schedule: [{ dayOfWeek: 1, startTime: '09:00', endTime: '15:00', slotDuration: 20 }, { dayOfWeek: 2, startTime: '09:00', endTime: '15:00', slotDuration: 20 }, { dayOfWeek: 4, startTime: '09:00', endTime: '13:00', slotDuration: 20 }] },
  { name: 'Dr. Martín Suárez', email: 'suarez@turnotopia.com', specialtyName: 'Traumatología', license: 'MN-34567', phone: '1166003003', schedule: [{ dayOfWeek: 1, startTime: '10:00', endTime: '16:00', slotDuration: 30 }, { dayOfWeek: 2, startTime: '10:00', endTime: '16:00', slotDuration: 30 }, { dayOfWeek: 3, startTime: '10:00', endTime: '16:00', slotDuration: 30 }, { dayOfWeek: 4, startTime: '10:00', endTime: '16:00', slotDuration: 30 }] },
  { name: 'Dra. Lucía Paredes', email: 'paredes@turnotopia.com', specialtyName: 'Pediatría', license: 'MN-45678', phone: '1166004004', schedule: [{ dayOfWeek: 1, startTime: '08:00', endTime: '13:00', slotDuration: 20 }, { dayOfWeek: 3, startTime: '08:00', endTime: '13:00', slotDuration: 20 }, { dayOfWeek: 5, startTime: '08:00', endTime: '13:00', slotDuration: 20 }] },
  { name: 'Dr. Fernando Ríos', email: 'rios@turnotopia.com', specialtyName: 'Clínica Médica', license: 'MN-56789', phone: '1166005005', schedule: [{ dayOfWeek: 1, startTime: '08:00', endTime: '16:00', slotDuration: 30 }, { dayOfWeek: 2, startTime: '08:00', endTime: '16:00', slotDuration: 30 }, { dayOfWeek: 3, startTime: '08:00', endTime: '16:00', slotDuration: 30 }, { dayOfWeek: 4, startTime: '08:00', endTime: '16:00', slotDuration: 30 }, { dayOfWeek: 5, startTime: '08:00', endTime: '12:00', slotDuration: 30 }] }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/turnotopia');
    console.log('📦 Conectado a MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}), Specialty.deleteMany({}), Doctor.deleteMany({}),
      Patient.deleteMany({}), Appointment.deleteMany({})
    ]);
    console.log('🗑️  Datos anteriores eliminados');

    // Create admin user
    const admin = await User.create({ name: 'Administrador', email: 'admin@turnotopia.local', password: 'admin123', role: 'admin' });
    const receptionist = await User.create({ name: 'Recepción', email: 'recepcion@turnotopia.com', password: 'recepcion123', role: 'receptionist' });
    console.log('👤 Usuarios creados (admin@turnotopia.local / admin123)');

    // Create specialties
    const specialties = await Specialty.insertMany(specialtiesData);
    console.log(`🏥 ${specialties.length} especialidades creadas`);

    // Create doctors with user accounts
    const doctors = [];
    for (const doc of doctorsData) {
      const user = await User.create({ name: doc.name, email: doc.email, password: 'doctor123', role: 'doctor' });
      const specialty = specialties.find(s => s.name === doc.specialtyName);
      const doctor = await Doctor.create({ user: user._id, specialty: specialty._id, licenseNumber: doc.license, phone: doc.phone, schedule: doc.schedule });
      doctors.push(doctor);
    }
    console.log(`👨‍⚕️ ${doctors.length} médicos creados`);

    // Create patients
    const patients = await Patient.insertMany(patientsData);
    console.log(`🧑 ${patients.length} pacientes creados`);

    // Create appointments for the current week
    const now = new Date();
    const appointments = [];
    const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'scheduled', 'confirmed'];
    const reasons = ['Control de rutina', 'Dolor de cabeza', 'Chequeo anual', 'Seguimiento', 'Consulta inicial', 'Resultados de estudios'];

    for (let i = 0; i < 30; i++) {
      const doctor = doctors[i % doctors.length];
      const patient = patients[i % patients.length];
      const dayOffset = Math.floor(i / 6) - 2; // spread across 5 days around today
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(0, 0, 0, 0);

      const dayOfWeek = date.getDay();
      const daySchedule = doctor.schedule.find(s => s.dayOfWeek === dayOfWeek);
      if (!daySchedule) continue;

      const [startH, startM] = daySchedule.startTime.split(':').map(Number);
      const slotIndex = i % 6;
      const slotStart = startH * 60 + startM + slotIndex * (daySchedule.slotDuration || 30);
      const slotEnd = slotStart + (daySchedule.slotDuration || 30);

      appointments.push({
        patient: patient._id,
        doctor: doctor._id,
        date,
        startTime: `${String(Math.floor(slotStart / 60)).padStart(2, '0')}:${String(slotStart % 60).padStart(2, '0')}`,
        endTime: `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`,
        status: statuses[i % statuses.length],
        reason: reasons[i % reasons.length],
        createdBy: admin._id
      });
    }

    await Appointment.insertMany(appointments);
    console.log(`📅 ${appointments.length} turnos creados`);

    console.log('\n✅ Seed completado exitosamente!');
    console.log('🔐 Credenciales de acceso:');
    console.log('   Admin: admin@turnotopia.local / admin123');
    console.log('   Recepción: recepcion@turnotopia.com / recepcion123');
    console.log('   Médicos: [email]@turnotopia.com / doctor123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedDB();
