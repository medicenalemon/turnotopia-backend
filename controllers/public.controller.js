const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

// @desc    Public QR check-in
// @route   POST /api/public/checkin
// @access  Public
exports.publicCheckin = async (req, res, next) => {
  try {
    const { dni } = req.body;
    if (!dni) return res.status(400).json({ success: false, message: 'DNI es requerido' });

    const patient = await Patient.findOne({ dni });
    if (!patient) return res.status(404).json({ success: false, message: 'Paciente no encontrado' });

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    
    const today = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const appointment = await Appointment.findOne({
      patient: patient._id,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'confirmed'] },
      'waitingRoom.status': null
    }).populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'No tienes un turno pendiente para hoy.' });
    }

    // Determine queue position
    const waitingAppointments = await Appointment.countDocuments({
      doctor: appointment.doctor._id,
      date: { $gte: today, $lt: tomorrow },
      'waitingRoom.status': 'waiting'
    });

    appointment.waitingRoom = { checkedInAt: new Date(), status: 'waiting' };
    appointment.status = 'in-progress';
    await appointment.save();

    res.json({ 
      success: true, 
      message: 'Check-in exitoso', 
      data: {
        queuePosition: waitingAppointments,
        doctorName: appointment.doctor.user.name
      }
    });
  } catch (error) {
    next(error);
  }
};
