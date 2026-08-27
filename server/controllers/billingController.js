const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const HospitalSettings = require('../models/HospitalSettings');
const { generateInvoiceNumber, generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');
const { INVOICE_STATUSES, PAYMENT_METHODS } = require('../config/constants');

// @desc    Get all invoices with filters & search
// @route   GET /api/billing/invoices
// @access  Private
const getInvoices = async (req, res) => {
  const { paymentStatus, patient, doctor, search, startDate, endDate, page = 1, limit = 50 } = req.query;
  const query = {};

  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (patient) query.patient = patient;
  if (doctor) query.doctor = doctor;

  if (startDate && endDate) {
    query.billingDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  if (search) {
    query.invoiceNumber = { $regex: search, $options: 'i' };
  }

  const count = await Invoice.countDocuments(query);
  const invoices = await Invoice.find(query)
    .populate('patient', 'firstName lastName patientId phone email address')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName email' },
    })
    .populate('generatedBy', 'firstName lastName')
    .sort({ billingDate: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    invoices,
  });
};

// @desc    Get invoice by ID with printable payload
// @route   GET /api/billing/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  let invoice = null;

  if (req.params.id.startsWith('INV-')) {
    invoice = await Invoice.findOne({ invoiceNumber: req.params.id })
      .populate('patient')
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'firstName lastName email phone' },
          { path: 'department', select: 'name' },
        ],
      })
      .populate('admission')
      .populate('appointment')
      .populate('generatedBy', 'firstName lastName role');
  } else {
    invoice = await Invoice.findById(req.params.id)
      .populate('patient')
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'firstName lastName email phone' },
          { path: 'department', select: 'name' },
        ],
      })
      .populate('admission')
      .populate('appointment')
      .populate('generatedBy', 'firstName lastName role');
  }

  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  // Get payments for this invoice
  const payments = await Payment.find({ invoice: invoice._id })
    .populate('receivedBy', 'firstName lastName')
    .sort({ paymentDate: -1 });

  // Get hospital branding settings
  let settings = await HospitalSettings.findOne();
  if (!settings) {
    settings = await HospitalSettings.create({});
  }

  res.json({
    success: true,
    invoice,
    payments,
    hospitalSettings: settings,
  });
};

// @desc    Create new invoice
// @route   POST /api/billing/invoices
// @access  Private (Accountant, Billing, Receptionist, Admins)
const createInvoice = async (req, res) => {
  const {
    patient,
    doctor,
    admission,
    appointment,
    items,
    paymentMethod,
    paidAmount = 0,
    dueDate,
    notes,
    insuranceClaimDetails,
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one line item is required' });
  }

  // Calculate items subtotal, tax, and discount
  let subTotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  const processedItems = items.map((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const discountPct = Math.min(100, Math.max(0, Number(item.discountPercentage) || 0));
    const taxPct = Math.max(0, Number(item.taxPercentage) || 0);

    const baseAmount = qty * unitPrice;
    const discountVal = (baseAmount * discountPct) / 100;
    const taxableAmount = baseAmount - discountVal;
    const taxVal = (taxableAmount * taxPct) / 100;
    const finalAmount = taxableAmount + taxVal;

    subTotal += baseAmount;
    discountTotal += discountVal;
    taxTotal += taxVal;

    return {
      description: item.description,
      category: item.category || 'Other Services',
      quantity: qty,
      unitPrice,
      discountPercentage: discountPct,
      taxPercentage: taxPct,
      amount: parseFloat(finalAmount.toFixed(2)),
    };
  });

  const totalAmount = parseFloat((subTotal - discountTotal + taxTotal).toFixed(2));
  const numPaid = Math.max(0, Number(paidAmount) || 0);
  const dueAmount = Math.max(0, parseFloat((totalAmount - numPaid).toFixed(2)));

  let paymentStatus = INVOICE_STATUSES.PENDING;
  if (numPaid >= totalAmount && totalAmount > 0) {
    paymentStatus = INVOICE_STATUSES.PAID;
  } else if (numPaid > 0 && numPaid < totalAmount) {
    paymentStatus = INVOICE_STATUSES.PARTIALLY_PAID;
  }

  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await Invoice.create({
    invoiceNumber,
    patient,
    doctor: doctor || null,
    admission: admission || null,
    appointment: appointment || null,
    items: processedItems,
    subTotal: parseFloat(subTotal.toFixed(2)),
    discountTotal: parseFloat(discountTotal.toFixed(2)),
    taxTotal: parseFloat(taxTotal.toFixed(2)),
    totalAmount,
    paidAmount: numPaid,
    dueAmount,
    paymentStatus,
    paymentMethod: paymentMethod || PAYMENT_METHODS.CASH,
    billingDate: new Date(),
    dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // default 14 days
    notes: notes || '',
    insuranceClaimDetails: insuranceClaimDetails || {},
    generatedBy: req.user._id,
  });

  // If initial paidAmount > 0, create corresponding payment record
  if (numPaid > 0) {
    const paymentId = await generateUniqueId(Payment, 'paymentId', 'PAY-', 4);
    await Payment.create({
      paymentId,
      invoice: invoice._id,
      patient,
      amount: numPaid,
      paymentMethod: paymentMethod || PAYMENT_METHODS.CASH,
      status: 'Success',
      paymentDate: new Date(),
      notes: 'Initial billing payment',
      receivedBy: req.user._id,
    });
  }

  await logAudit(req, {
    action: 'GENERATE_INVOICE',
    module: 'Billing',
    recordId: invoice.invoiceNumber,
    details: `Generated invoice ${invoice.invoiceNumber} for total $${totalAmount}`,
  });

  const populated = await Invoice.findById(invoice._id)
    .populate('patient', 'firstName lastName patientId phone')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName' },
    });

  res.status(201).json({
    success: true,
    message: 'Invoice generated successfully',
    invoice: populated,
  });
};

// @desc    Update invoice status / notes
// @route   PUT /api/billing/invoices/:id
// @access  Private (Admins, Accountants)
const updateInvoice = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not found' });
  }

  const { paymentStatus, notes, dueDate } = req.body;

  if (paymentStatus) invoice.paymentStatus = paymentStatus;
  if (notes !== undefined) invoice.notes = notes;
  if (dueDate) invoice.dueDate = new Date(dueDate);

  await invoice.save();

  await logAudit(req, {
    action: 'UPDATE_INVOICE',
    module: 'Billing',
    recordId: invoice.invoiceNumber,
    details: `Updated invoice ${invoice.invoiceNumber}`,
  });

  res.json({
    success: true,
    message: 'Invoice updated successfully',
    invoice,
  });
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
};
