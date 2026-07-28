const mongoose = require('mongoose');

const specialtySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la especialidad es requerido'],
    unique: true,
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  defaultSlotDuration: {
    type: Number,
    default: 30,
    min: [10, 'La duración mínima es 10 minutos'],
    max: [120, 'La duración máxima es 120 minutos']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Specialty', specialtySchema);
