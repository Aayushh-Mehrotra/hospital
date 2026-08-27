const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Medicine = require('../models/Medicine');
const InventoryItem = require('../models/InventoryItem');
const Department = require('../models/Department');

// @desc    Get Financial Report data
// @route   GET /api/reports/financial
// @access  Private (Admins, Accountants)
const getFinancialReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const match = { status: 'Success' };

  if (startDate && endDate) {
    match.paymentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // Payment Methods Breakdown
  const paymentMethods = await Payment.aggregate([
    { $match: match },
    { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  // Daily revenue aggregation in date range
  const dailyRevenue = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
        total: { $sum: '$amount' },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Totals summary
  const totalBilledAgg = await Invoice.aggregate([
    {
      $group: {
        _id: null,
        totalBilled: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$paidAmount' },
        totalDue: { $sum: '$dueAmount' },
        count: { $sum: 1 },
      },
    },
  ]);
  const totals = totalBilledAgg[0] || { totalBilled: 0, totalPaid: 0, totalDue: 0, count: 0 };

  // Invoice Category / Service Breakdown
  const invoiceMatch = {};
  if (startDate && endDate) {
    invoiceMatch.billingDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const categoryBreakdown = await Invoice.aggregate([
    { $match: invoiceMatch },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.category',
        totalRevenue: { $sum: '$items.amount' },
        itemCount: { $sum: '$items.quantity' },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  res.json({
    success: true,
    totals,
    paymentMethods,
    paymentMethodBreakdown: paymentMethods,
    dailyRevenue,
    categoryBreakdown,
  });
};

// @desc    Get Clinical Caseload Report
// @route   GET /api/reports/clinical
// @access  Private
const getClinicalReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const match = {};

  if (startDate && endDate) {
    match.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // Doctor Workload
  const doctorWorkload = await Appointment.aggregate([
    { $match: match },
    { $group: { _id: '$doctor', totalAppointments: { $sum: 1 } } },
    { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doc' } },
    { $unwind: '$doc' },
    { $lookup: { from: 'users', localField: 'doc.user', foreignField: '_id', as: 'doctorInfo' } },
    { $unwind: '$doctorInfo' },
  ]);

  // Department Breakdown
  const departmentBreakdown = await Appointment.aggregate([
    { $match: match },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'deptInfo' } },
    { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true } },
  ]);

  // Status breakdown
  const statusBreakdown = await Appointment.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    doctorWorkload,
    departmentBreakdown,
    statusBreakdown,
  });
};

// @desc    Get Appointment Report data
// @route   GET /api/reports/appointments
// @access  Private
const getAppointmentReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const match = {};

  if (startDate && endDate) {
    match.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const doctorAppointments = await Appointment.aggregate([
    { $match: match },
    { $group: { _id: '$doctor', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } } } },
    { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doc' } },
    { $unwind: '$doc' },
    { $lookup: { from: 'users', localField: 'doc.user', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { doctorName: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, specialization: '$doc.specialization', total: 1, completed: 1 } },
  ]);

  const statusDistribution = await Appointment.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    doctorAppointments,
    statusDistribution,
  });
};

// @desc    Get Patient Demographics Report
// @route   GET /api/reports/patients
// @access  Private
const getPatientReport = async (req, res) => {
  const genderDistribution = await Patient.aggregate([
    { $group: { _id: '$gender', count: { $sum: 1 } } },
  ]);

  const bloodGroupDistribution = await Patient.aggregate([
    { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    genderDistribution,
    bloodGroupDistribution,
  });
};

// @desc    Get Inventory & Pharmacy Valuation Report
// @route   GET /api/reports/inventory
// @access  Private
const getInventoryReport = async (req, res) => {
  const medicineValuation = await Medicine.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalStock: { $sum: '$stockQuantity' },
        totalValue: { $sum: { $multiply: ['$stockQuantity', '$sellingPrice'] } },
      },
    },
    { $sort: { totalValue: -1 } },
  ]);

  res.json({
    success: true,
    medicineValuation,
  });
};

module.exports = {
  getFinancialReport,
  getClinicalReport,
  getAppointmentReport,
  getPatientReport,
  getInventoryReport,
};
