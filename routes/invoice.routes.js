const express = require('express');
const { getInvoices, getInvoice, createInvoice, addPayment, getInvoiceStats, deleteInvoice } = require('../controllers/invoice.controller');
const auth = require('../middleware/auth');
const authorize = require('../middleware/roleGuard');

const router = express.Router();

router.use(auth);

router.get('/stats', getInvoiceStats);
router.route('/').get(getInvoices).post(createInvoice);
router.route('/:id').get(getInvoice).delete(authorize('admin'), deleteInvoice);
router.post('/:id/payment', addPayment);

module.exports = router;
