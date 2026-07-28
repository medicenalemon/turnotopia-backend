const Doctor = require('../models/Doctor');
const User = require('../models/User');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Private
exports.getDoctors = async (req, res, next) => {
  try {
    const { specialty, active } = req.query;
    const filter = {};
    
    if (specialty) filter.specialty = specialty;
    if (active !== undefined) filter.isActive = active === 'true';

    const doctors = await Doctor.find(filter)
      .populate('user', 'name email')
      .populate('specialty', 'name defaultSlotDuration')
      .sort('user.name');

    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Private
exports.getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'name email')
      .populate('specialty', 'name description defaultSlotDuration');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado.' });
    }

    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

// @desc    Create doctor (also creates user account)
// @route   POST /api/doctors
// @access  Private (Admin only)
exports.createDoctor = async (req, res, next) => {
  try {
    const { name, email, password, specialty, licenseNumber, phone, schedule } = req.body;

    // Create user account for the doctor
    const user = await User.create({
      name,
      email,
      password: password || 'doctor123',
      role: 'doctor'
    });

    const doctor = await Doctor.create({
      user: user._id,
      specialty,
      licenseNumber,
      phone,
      schedule: schedule || []
    });

    const populated = await Doctor.findById(doctor._id)
      .populate('user', 'name email')
      .populate('specialty', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private (Admin only)
exports.updateDoctor = async (req, res, next) => {
  try {
    const { name, email, specialty, licenseNumber, phone, schedule, isActive } = req.body;

    let doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado.' });
    }

    // Update user info if provided
    if (name || email) {
      await User.findByIdAndUpdate(doctor.user, {
        ...(name && { name }),
        ...(email && { email })
      });
    }

    // Update doctor info
    const updateData = {};
    if (specialty) updateData.specialty = specialty;
    if (licenseNumber) updateData.licenseNumber = licenseNumber;
    if (phone !== undefined) updateData.phone = phone;
    if (schedule) updateData.schedule = schedule;
    if (isActive !== undefined) updateData.isActive = isActive;

    doctor = await Doctor.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('user', 'name email')
      .populate('specialty', 'name');

    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete doctor (soft delete)
// @route   DELETE /api/doctors/:id
// @access  Private (Admin only)
exports.deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado.' });
    }

    // Soft delete - deactivate instead of removing
    doctor.isActive = false;
    await doctor.save();

    await User.findByIdAndUpdate(doctor.user, { isActive: false });

    res.json({ success: true, message: 'Médico desactivado correctamente.' });
  } catch (error) {
    next(error);
  }
};
