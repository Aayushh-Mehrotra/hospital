const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const { generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');
const { INVOICE_STATUSES } = require('../config/constants');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  const { paymentMethod, search, startDate, endDate, page = 1, limit = 50 } = req.query;
  const query = {};

  if (paymentMethod) query.paymentMethod = paymentMethod;

  if (startDate && endDate) {
    query.paymentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (search) {
    query.$or = [
      { paymentId: { $regex: search, $options: 'i' } },
      { transactionReference: { $regex: search, $options: 'i' } },
    ];
  }

  const count = await Payment.countDocuments(query);
  const payments = await Payment.find(query)
    .populate('invoice', 'invoiceNumber totalAmount paidAmount dueAmount paymentStatus')
    .populate('patient', 'firstName lastName patientId phone')
    .populate('receivedBy', 'firstName lastName role')
    .sort({ paymentDate: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    payments,
  });
};

// @desc    Record new payment against an invoice
// @route   POST /api/payments
// @access  Private (Accountant, Billing, Receptionist, Admins)
const recordPayment = async (req, res) => {
  const { invoiceId, amount, paymentMethod, transactionReference, notes } = req.body;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
  }

  const paymentId = await generateUniqueId(Payment, 'paymentId', 'PAY-', 4);

  const payment = await Payment.create({
    paymentId,
    invoice: invoice._id,
    patient: invoice.patient,
    amount: numAmount,
    paymentMethod,
    transactionReference: transactionReference || '',
    status: 'Success',
    paymentDate: new Date(),
    notes: notes || '',
    receivedBy: req.user._id,
  });

  // Recalculate invoice paidAmount and dueAmount
  const newPaidAmount = parseFloat((invoice.paidAmount + numAmount).toFixed(2));
  const newDueAmount = Math.max(0, parseFloat((invoice.totalAmount - newPaidAmount).toFixed(2)));

  let newStatus = INVOICE_STATUSES.PARTIALLY_PAID;
  if (newPaidAmount >= invoice.totalAmount) {
    newStatus = INVOICE_STATUSES.PAID;
  }

  invoice.paidAmount = newPaidAmount;
  invoice.dueAmount = newDueAmount;
  invoice.paymentStatus = newStatus;
  await invoice.save();

  await logAudit(req, {
    action: 'RECORD_PAYMENT',
    module: 'Billing',
    recordId: payment.paymentId,
    details: `Recorded payment of $${numAmount} for Invoice ${invoice.invoiceNumber}`,
  });

  const populated = await Payment.findById(payment._id)
    .populate('invoice', 'invoiceNumber totalAmount paidAmount dueAmount')
    .populate('patient', 'firstName lastName patientId');

  res.status(201).json({
    success: true,
    message: 'Payment recorded successfully',
    payment: populated,
    updatedInvoice: invoice,
  });
};

module.exports = {
  getPayments,
  recordPayment,
};
