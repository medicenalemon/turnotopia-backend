const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');

// @desc    Get all medical records (with filters)
// @route   GET /api/medical-records
// @access  Private
exports.getRecords = async (req, res, next) => {
  try {
    const { patient, doctor, type, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (patient) filter.patient = patient;
    if (doctor) filter.doctor = doctor;
    if (type) filter.type = type;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const total = await MedicalRecord.countDocuments(filter);
    const records = await MedicalRecord.find(filter)
      .populate('patient', 'firstName lastName dni')
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'specialty', select: 'name' }
        ]
      })
      .populate('appointment', 'date startTime endTime')
      .sort('-date')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: records.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single medical record
// @route   GET /api/medical-records/:id
// @access  Private
exports.getRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'firstName lastName dni dateOfBirth medicalInsurance')
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'specialty', select: 'name' }
        ]
      })
      .populate('appointment', 'date startTime endTime reason');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Registro clínico no encontrado.' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all records for a specific patient (timeline)
// @route   GET /api/medical-records/patient/:patientId
// @access  Private
exports.getPatientRecords = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado.' });
    }

    const records = await MedicalRecord.find({ patient: req.params.patientId })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'specialty', select: 'name' }
        ]
      })
      .populate('appointment', 'date startTime endTime reason')
      .sort('-date');

    res.json({
      success: true,
      count: records.length,
      patient: {
        _id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dni: patient.dni,
        dateOfBirth: patient.dateOfBirth,
        medicalInsurance: patient.medicalInsurance,
        insuranceNumber: patient.insuranceNumber
      },
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create medical record
// @route   POST /api/medical-records
// @access  Private
exports.createRecord = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;

    const record = await MedicalRecord.create(req.body);

    const populated = await MedicalRecord.findById(record._id)
      .populate('patient', 'firstName lastName dni')
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'specialty', select: 'name' }
        ]
      });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medical record
// @route   PUT /api/medical-records/:id
// @access  Private (admin or creator)
exports.updateRecord = async (req, res, next) => {
  try {
    let record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Registro clínico no encontrado.' });
    }

    // Only admin or the user who created it can update
    if (req.user.role !== 'admin' && record.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'No tiene permisos para editar este registro.' });
    }

    record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('patient', 'firstName lastName dni')
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'specialty', select: 'name' }
        ]
      });

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete medical record
// @route   DELETE /api/medical-records/:id
// @access  Private (Admin only)
exports.deleteRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Registro clínico no encontrado.' });
    }

    await record.deleteOne();
    res.json({ success: true, message: 'Registro clínico eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};
