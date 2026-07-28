const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// @desc    Get all appointments (with filters)
// @route   GET /api/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    const { date, doctor, patient, status, startDate, endDate } = req.query;
    const filter = {};

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      filter.date = { $gte: dayStart, $lte: dayEnd };
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    if (doctor) filter.doctor = doctor;
    if (patient) filter.patient = patient;
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate({
        path: 'patient',
        select: 'firstName lastName dni phone medicalInsurance'
      })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'specialty', select: 'name' }
        ]
      })
      .populate('createdBy', 'name')
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'patient',
        select: 'firstName lastName dni phone email medicalInsurance insuranceNumber'
      })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name email' },
          { path: 'specialty', select: 'name' }
        ]
      })
      .populate('createdBy', 'name');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Turno no encontrado.' });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res, next) => {
  try {
    const { patient, doctor, date, startTime, endTime, reason, notes } = req.body;

    // Check for overlapping appointments
    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(appointmentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const overlap = await Appointment.findOne({
      doctor,
      date: { $gte: appointmentDate, $lt: nextDay },
      status: { $nin: ['cancelled', 'no-show'] },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (overlap) {
      return res.status(400).json({ 
        success: false, 
        message: 'El médico ya tiene un turno en ese horario.' 
      });
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      date: appointmentDate,
      startTime,
      endTime,
      reason,
      notes,
      createdBy: req.user._id
    });

    const populated = await Appointment.findById(appointment._id)
      .populate({
        path: 'patient',
        select: 'firstName lastName dni phone medicalInsurance'
      })
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

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res, next) => {
  try {
    let appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Turno no encontrado.' });
    }

    appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate({
        path: 'patient',
        select: 'firstName lastName dni phone medicalInsurance'
      })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'specialty', select: 'name' }
        ]
      });

    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado inválido.' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'patient',
        select: 'firstName lastName dni phone medicalInsurance'
      })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'specialty', select: 'name' }
        ]
      });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Turno no encontrado.' });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Admin only)
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Turno no encontrado.' });
    }

    await appointment.deleteOne();
    res.json({ success: true, message: 'Turno eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available slots for a doctor on a date
// @route   GET /api/appointments/available-slots
// @access  Private
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere doctorId y date.' 
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Médico no encontrado.' });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();

    // Find doctor's schedule for this day
    const daySchedule = doctor.schedule.find(s => s.dayOfWeek === dayOfWeek);
    if (!daySchedule) {
      return res.json({ success: true, data: [], message: 'El médico no atiende este día.' });
    }

    // Generate all possible slots
    const slots = [];
    const [startH, startM] = daySchedule.startTime.split(':').map(Number);
    const [endH, endM] = daySchedule.endTime.split(':').map(Number);
    const duration = daySchedule.slotDuration || 30;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + duration <= endMinutes) {
      const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
      const slotEndMin = currentMinutes + duration;
      const slotEnd = `${String(Math.floor(slotEndMin / 60)).padStart(2, '0')}:${String(slotEndMin % 60).padStart(2, '0')}`;
      
      slots.push({ startTime: slotStart, endTime: slotEnd });
      currentMinutes += duration;
    }

    // Get existing appointments for this doctor on this date
    const dayStart = new Date(requestedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(requestedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled', 'no-show'] }
    });

    // Filter out taken slots
    const availableSlots = slots.filter(slot => {
      return !existingAppointments.some(apt => 
        apt.startTime === slot.startTime && apt.endTime === slot.endTime
      );
    });

    res.json({ success: true, data: availableSlots });
  } catch (error) {
    next(error);
  }
};

// @desc    Check in patient (waiting room)
// @route   PATCH /api/appointments/:id/checkin
// @access  Private
exports.checkinAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 'waitingRoom.checkedInAt': new Date(), 'waitingRoom.status': 'waiting' },
      { new: true }
    )
      .populate({ path: 'patient', select: 'firstName lastName dni phone medicalInsurance' })
      .populate({ path: 'doctor', populate: [{ path: 'user', select: 'name' }, { path: 'specialty', select: 'name' }] });

    if (!appointment) return res.status(404).json({ success: false, message: 'Turno no encontrado.' });
    res.json({ success: true, data: appointment });
  } catch (error) { next(error); }
};

// @desc    Call patient to consultation
// @route   PATCH /api/appointments/:id/call
// @access  Private
exports.callPatient = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 'waitingRoom.calledAt': new Date(), 'waitingRoom.status': 'in-consultation', status: 'in-progress' },
      { new: true }
    )
      .populate({ path: 'patient', select: 'firstName lastName dni phone medicalInsurance' })
      .populate({ path: 'doctor', populate: [{ path: 'user', select: 'name' }, { path: 'specialty', select: 'name' }] });

    if (!appointment) return res.status(404).json({ success: false, message: 'Turno no encontrado.' });
    res.json({ success: true, data: appointment });
  } catch (error) { next(error); }
};

// @desc    Complete patient visit
// @route   PATCH /api/appointments/:id/complete-visit
// @access  Private
exports.completeVisit = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 'waitingRoom.completedAt': new Date(), 'waitingRoom.status': 'attended', status: 'completed' },
      { new: true }
    )
      .populate({ path: 'patient', select: 'firstName lastName dni phone medicalInsurance' })
      .populate({ path: 'doctor', populate: [{ path: 'user', select: 'name' }, { path: 'specialty', select: 'name' }] });

    if (!appointment) return res.status(404).json({ success: false, message: 'Turno no encontrado.' });
    res.json({ success: true, data: appointment });
  } catch (error) { next(error); }
};

// @desc    Get waiting room (today's appointments with waiting room status)
// @route   GET /api/appointments/waiting-room
// @access  Private
exports.getWaitingRoom = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all today's non-cancelled appointments
    const appointments = await Appointment.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['cancelled', 'no-show'] }
    })
      .populate({ path: 'patient', select: 'firstName lastName dni phone medicalInsurance' })
      .populate({ path: 'doctor', populate: [{ path: 'user', select: 'name' }, { path: 'specialty', select: 'name' }] })
      .sort({ startTime: 1 });

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) { next(error); }
};
