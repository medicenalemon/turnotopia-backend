const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');

// @desc    Get aggregated reports
// @route   GET /api/reports?dateFrom=...&dateTo=...
// @access  Private (Admin, Doctor)
exports.getReports = async (req, res, next) => {
  try {
    // ---- Date range parsing (default: last 30 days) ----
    const now = new Date();
    let { dateFrom, dateTo } = req.query;

    if (!dateFrom) {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else {
      dateFrom = new Date(dateFrom);
    }

    if (!dateTo) {
      dateTo = new Date(now);
    } else {
      dateTo = new Date(dateTo);
    }
    const dateToEnd = new Date(dateTo);
    dateToEnd.setHours(23, 59, 59, 999);

    // ---- Match stage reused by appointment aggregations ----
    const apptMatch = { $match: { date: { $gte: dateFrom, $lte: dateToEnd } } };

    // ---- Run aggregations in parallel ----
    const [
      byDayAgg,
      byStatusAgg,
      bySpecialtyAgg,
      byDoctorAgg,
      invoicesAgg,
      invoiceTotalsAgg
    ] = await Promise.all([
      // 1) byDay — appointments grouped by day
      Appointment.aggregate([
        apptMatch,
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 2) byStatus
      Appointment.aggregate([
        apptMatch,
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // 3) bySpecialty (lookup → doctors → specialties)
      Appointment.aggregate([
        apptMatch,
        { $lookup: { from: 'doctors', localField: 'doctor', foreignField: '_id', as: 'doc' } },
        { $unwind: '$doc' },
        { $lookup: { from: 'specialties', localField: 'doc.specialty', foreignField: '_id', as: 'spec' } },
        { $unwind: '$spec' },
        { $group: { _id: '$spec.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // 4) byDoctor — productivity counters
      Appointment.aggregate([
        apptMatch,
        { $lookup: { from: 'doctors', localField: 'doctor', foreignField: '_id', as: 'doc' } },
        { $unwind: '$doc' },
        { $lookup: { from: 'users', localField: 'doc.user', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        {
          $group: {
            _id: '$doc._id',
            name: { $first: '$user.name' },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            scheduled: {
              $sum: { $cond: [{ $in: ['$status', ['scheduled', 'confirmed']] }, 1, 0] }
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            noShow: {
              $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] }
            },
            total: { $sum: 1 }
          }
        },
        {
          $addFields: {
            completionRate: {
              $cond: [
                { $gt: ['$total', 0] },
                { $divide: ['$completed', '$total'] },
                0
              ]
            }
          }
        },
        { $sort: { total: -1 } }
      ]),

      // 5) invoices — billed vs collected per day
      Invoice.aggregate([
        {
          $match: {
            date: { $gte: dateFrom, $lte: dateToEnd },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            billed: { $sum: '$total' },
            collected: { $sum: '$amountPaid' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 6) invoice totals for the summary
      Invoice.aggregate([
        {
          $match: {
            date: { $gte: dateFrom, $lte: dateToEnd },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            totalBilled: { $sum: '$total' },
            totalCollected: { $sum: '$amountPaid' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // ---- Shape responses ----
    const byDay = byDayAgg.map(d => ({ date: d._id, count: d.count }));
    const byStatus = byStatusAgg;
    const bySpecialty = bySpecialtyAgg;
    const byDoctor = byDoctorAgg.map(d => ({
      _id: d._id,
      name: d.name,
      completed: d.completed,
      scheduled: d.scheduled,
      cancelled: d.cancelled,
      noShow: d.noShow,
      total: d.total,
      completionRate: d.completionRate
    }));
    const invoices = invoicesAgg.map(i => ({
      date: i._id,
      billed: i.billed,
      collected: i.collected
    }));

    // ---- Summary ----
    const find = (key) => byStatusAgg.find(s => s._id === key)?.count || 0;
    const total = byStatusAgg.reduce((s, x) => s + x.count, 0);
    const completed = find('completed');
    const cancelled = find('cancelled');
    const noShow = find('no-show');

    const invTotals = invoiceTotalsAgg[0] || { totalBilled: 0, totalCollected: 0, count: 0 };
    const totalBilled = invTotals.totalBilled || 0;
    const totalCollected = invTotals.totalCollected || 0;
    const avgInvoice = invTotals.count > 0 ? totalBilled / invTotals.count : 0;

    const summary = {
      total,
      completed,
      cancelled,
      noShow,
      completionRate: total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0,
      cancellationRate: total > 0 ? Number(((cancelled / total) * 100).toFixed(1)) : 0,
      noShowRate: total > 0 ? Number(((noShow / total) * 100).toFixed(1)) : 0,
      totalBilled,
      totalCollected,
      avgInvoice
    };

    res.json({
      success: true,
      data: {
        byDay,
        byStatus,
        bySpecialty,
        byDoctor,
        invoices,
        summary,
        meta: { dateFrom, dateTo: dateToEnd }
      }
    });
  } catch (error) {
    next(error);
  }
};
