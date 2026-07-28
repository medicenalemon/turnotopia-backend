const Invoice = require('../models/Invoice');

// Auto-generate invoice number
const generateInvoiceNumber = async () => {
  const last = await Invoice.findOne().sort('-createdAt').select('invoiceNumber');
  if (!last) return 'TRN-0001';
  const num = parseInt(last.invoiceNumber.split('-')[1]) + 1;
  return `TRN-${String(num).padStart(4, '0')}`;
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { status, patient, dateFrom, dateTo, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (patient) filter.patient = patient;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); filter.date.$lte = d; }
    }

    const total = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .populate('patient', 'firstName lastName dni medicalInsurance')
      .populate({ path: 'doctor', populate: [{ path: 'user', select: 'name' }, { path: 'specialty', select: 'name' }] })
      .sort('-date')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, count: invoices.length, total, pages: Math.ceil(total / limit), currentPage: parseInt(page), data: invoices });
  } catch (error) { next(error); }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patient', 'firstName lastName dni email phone medicalInsurance insuranceNumber')
      .populate({ path: 'doctor', populate: [{ path: 'user', select: 'name' }, { path: 'specialty', select: 'name' }] })
      .populate('appointment', 'date startTime endTime reason');

    if (!invoice) return res.status(404).json({ success: false, message: 'Factura no encontrada.' });
    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res, next) => {
  try {
    const invoiceNumber = await generateInvoiceNumber();
    const { items, tax = 0 } = req.body;

    const subtotal = (items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const total = subtotal + tax;

    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber,
      subtotal,
      total,
      balance: total,
      amountPaid: 0,
      status: 'pending',
      createdBy: req.user._id
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('patient', 'firstName lastName dni medicalInsurance')
      .populate({ path: 'doctor', populate: [{ path: 'user', select: 'name' }, { path: 'specialty', select: 'name' }] });

    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

// @desc    Add payment to invoice
// @route   POST /api/invoices/:id/payment
// @access  Private
exports.addPayment = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Factura no encontrada.' });

    const { amount, method, reference } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Monto inválido.' });
    if (amount > invoice.balance) return res.status(400).json({ success: false, message: 'El monto excede el saldo pendiente.' });

    invoice.payments.push({ amount, method, reference, date: new Date() });
    invoice.amountPaid += amount;
    invoice.balance = invoice.total - invoice.amountPaid;
    invoice.status = invoice.balance <= 0 ? 'paid' : 'partial';

    await invoice.save();

    const populated = await Invoice.findById(invoice._id)
      .populate('patient', 'firstName lastName dni medicalInsurance')
      .populate({ path: 'doctor', populate: [{ path: 'user', select: 'name' }, { path: 'specialty', select: 'name' }] });

    res.json({ success: true, data: populated });
  } catch (error) { next(error); }
};

// @desc    Get invoice stats
// @route   GET /api/invoices/stats
// @access  Private
exports.getInvoiceStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayStats, weekStats, monthStats, pendingStats] = await Promise.all([
      Invoice.aggregate([
        { $match: { date: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' }, paid: { $sum: '$amountPaid' }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { date: { $gte: weekStart }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' }, paid: { $sum: '$amountPaid' }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { date: { $gte: monthStart }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' }, paid: { $sum: '$amountPaid' }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: { status: { $in: ['pending', 'partial'] } } },
        { $group: { _id: null, balance: { $sum: '$balance' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        today: todayStats[0] || { total: 0, paid: 0, count: 0 },
        week: weekStats[0] || { total: 0, paid: 0, count: 0 },
        month: monthStats[0] || { total: 0, paid: 0, count: 0 },
        pending: pendingStats[0] || { balance: 0, count: 0 }
      }
    });
  } catch (error) { next(error); }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin only)
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Factura no encontrada.' });
    await invoice.deleteOne();
    res.json({ success: true, message: 'Factura eliminada correctamente.' });
  } catch (error) { next(error); }
};
