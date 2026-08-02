const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
exports.getPatients = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { dni: { $regex: search, $options: 'i' } },
        { medicalInsurance: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Patient.countDocuments(filter);
    const patients = await Patient.find(filter)
      .sort({ createdAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: patients.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
exports.getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado.' });
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

// @desc    Create patient
// @route   POST /api/patients
// @access  Private
exports.createPatient = async (req, res, next) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
exports.updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado.' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin only)
exports.deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado.' });
    }

    await patient.deleteOne();
    res.json({ success: true, message: 'Paciente eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient appointment history
// @route   GET /api/patients/:id/appointments
// @access  Private
exports.getPatientAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patient: req.params.id })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'specialty', select: 'name' }
        ]
      })
      .sort('-date');

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};
