const Appointment = require('../models/Appointment');

exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);

    const [todayAppts, weekAppts, todayByStatus, weekByDay, bySpecialty] = await Promise.all([
      Appointment.countDocuments({ date: { $gte: todayStart, $lte: todayEnd } }),
      Appointment.countDocuments({ date: { $gte: weekStart, $lt: weekEnd } }),
      Appointment.aggregate([
        { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Appointment.aggregate([
        { $match: { date: { $gte: weekStart, $lt: weekEnd } } },
        { $group: { _id: { $dayOfWeek: '$date' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } }
      ]),
      Appointment.aggregate([
        { $match: { date: { $gte: weekStart, $lt: weekEnd } } },
        { $lookup: { from: 'doctors', localField: 'doctor', foreignField: '_id', as: 'doc' } },
        { $unwind: '$doc' },
        { $lookup: { from: 'specialties', localField: 'doc.specialty', foreignField: '_id', as: 'spec' } },
        { $unwind: '$spec' },
        { $group: { _id: '$spec.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const completed = todayByStatus.find(s => s._id === 'completed')?.count || 0;
    const cancelled = weekAppts > 0
      ? (await Appointment.countDocuments({ date: { $gte: weekStart, $lt: weekEnd }, status: 'cancelled' }))
      : 0;

    const upcoming = await Appointment.find({
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['scheduled', 'confirmed'] }
    })
      .populate({ path: 'patient', select: 'firstName lastName' })
      .populate({ path: 'doctor', populate: [{ path: 'user', select: 'name' }, { path: 'specialty', select: 'name' }] })
      .sort('startTime')
      .limit(8);

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weekChartData = dayNames.map((name, i) => ({
      name,
      turnos: weekByDay.find(d => d._id === i + 1)?.count || 0
    }));

    res.json({
      success: true,
      data: {
        todayTotal: todayAppts,
        todayCompleted: completed,
        weekTotal: weekAppts,
        cancelledThisWeek: cancelled,
        cancellationRate: weekAppts > 0 ? ((cancelled / weekAppts) * 100).toFixed(1) : 0,
        weekByDay: weekChartData,
        topSpecialties: bySpecialty,
        upcomingToday: upcoming
      }
    });
  } catch (error) { next(error); }
};
