const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'El paciente es requerido']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'El médico es requerido']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  date: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    default: Date.now
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'lab-results', 'prescription', 'other'],
    default: 'consultation',
    required: [true, 'El tipo de registro es requerido']
  },
  diagnosis: {
    type: String,
    trim: true,
    maxlength: [2000, 'El diagnóstico no puede exceder 2000 caracteres']
  },
  symptoms: {
    type: String,
    trim: true,
    maxlength: [2000, 'Los síntomas no pueden exceder 2000 caracteres']
  },
  treatment: {
    type: String,
    trim: true,
    maxlength: [2000, 'El tratamiento no puede exceder 2000 caracteres']
  },
  prescriptions: {
    type: String,
    trim: true,
    maxlength: [2000, 'Las prescripciones no pueden exceder 2000 caracteres']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [3000, 'Las notas no pueden exceder 3000 caracteres']
  },
  vitalSigns: {
    bloodPressure: { type: String, trim: true },
    temperature: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    heartRate: { type: Number }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
medicalRecordSchema.index({ patient: 1, date: -1 });
medicalRecordSchema.index({ doctor: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
