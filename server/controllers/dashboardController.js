const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Admission = require('../models/Admission');
const Bed = require('../models/Bed');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Medicine = require('../models/Medicine');
const LaboratoryReport = require('../models/LaboratoryReport');
const AuditLog = require('../models/AuditLog');
const Department = require('../models/Department');
const { BED_STATUSES, APPOINTMENT_STATUSES, INVOICE_STATUSES } = require('../config/constants');

// @desc    Get role-aware dashboard statistics and charts
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  const user = req.user;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const thisMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  // Common quick counts
  const [
    totalPatients,
    newPatientsToday,
    totalDoctors,
    todayAppointments,
    activeAdmissions,
    totalBeds,
    occupiedBeds,
    availableBeds,
  ] = await Promise.all([
    Patient.countDocuments(),
    Patient.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Doctor.countDocuments({ status: 'Active' }),
    Appointment.countDocuments({ appointmentDate: { $gte: todayStart, $lte: todayEnd } }),
    Admission.countDocuments({ status: 'Admitted' }),
    Bed.countDocuments(),
    Bed.countDocuments({ status: BED_STATUSES.OCCUPIED }),
    Bed.countDocuments({ status: BED_STATUSES.AVAILABLE }),
  ]);

  // Financial aggregates
  const todayPayments = await Payment.aggregate([
    { $match: { paymentDate: { $gte: todayStart, $lte: todayEnd }, status: 'Success' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const todayRevenue = todayPayments.length > 0 ? todayPayments[0].total : 0;

  const monthPayments = await Payment.aggregate([
    { $match: { paymentDate: { $gte: thisMonthStart }, status: 'Success' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const monthRevenue = monthPayments.length > 0 ? monthPayments[0].total : 0;

  const pendingInvoicesAgg = await Invoice.aggregate([
    { $match: { paymentStatus: { $in: [INVOICE_STATUSES.PENDING, INVOICE_STATUSES.PARTIALLY_PAID] } } },
    { $group: { _id: null, totalDue: { $sum: '$dueAmount' }, count: { $sum: 1 } } },
  ]);
  const totalPendingDue = pendingInvoicesAgg.length > 0 ? pendingInvoicesAgg[0].totalDue : 0;
  const pendingInvoicesCount = pendingInvoicesAgg.length > 0 ? pendingInvoicesAgg[0].count : 0;

  // Inventory & Pharmacy alerts
  const ninetyDaysLater = new Date();
  ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);

  const [lowStockMedsCount, expiringMedsCount, pendingLabCount] = await Promise.all([
    Medicine.countDocuments({ $expr: { $lte: ['$stockQuantity', '$reorderLevel'] } }),
    Medicine.countDocuments({ expiryDate: { $lte: ninetyDaysLater } }),
    LaboratoryReport.countDocuments({ status: { $in: ['Requested', 'Sample Collected', 'Processing'] } }),
  ]);

  // Monthly Revenue Trend (Last 6 Months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyRevenueData = await Payment.aggregate([
    { $match: { paymentDate: { $gte: sixMonthsAgo }, status: 'Success' } },
    {
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' },
        },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonthlyTrends = monthlyRevenueData.map((item) => ({
    month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
    revenue: item.revenue,
    transactions: item.transactions,
  }));

  // Appointment Status Breakdown
  const appointmentStatuses = await Appointment.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Department-wise appointment distribution
  const deptAppointments = await Appointment.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: '$dept' },
    { $project: { name: '$dept.name', count: 1 } },
  ]);

  // Recent Activity Feed
  const recentActivities = await AuditLog.find().sort({ createdAt: -1 }).limit(8);

  // Doctor-specific statistics if user is a Doctor
  let doctorSpecificData = null;
  if (user.role === 'Doctor') {
    const docDoc = await Doctor.findOne({ user: user._id });
    if (docDoc) {
      const [myTodayAppts, myPendingLab, myRecentPatients] = await Promise.all([
        Appointment.find({
          doctor: docDoc._id,
          appointmentDate: { $gte: todayStart, $lte: todayEnd },
        })
          .populate('patient', 'firstName lastName patientId age gender phone')
          .sort({ timeSlot: 1 }),

        LaboratoryReport.find({
          doctor: docDoc._id,
          status: { $in: ['Requested', 'Sample Collected', 'Processing'] },
        })
          .populate('patient', 'firstName lastName patientId')
          .populate('test', 'testName category')
          .sort({ requestedDate: -1 })
          .limit(10),

        Admission.find({
          doctor: docDoc._id,
          status: 'Admitted',
        })
          .populate('patient', 'firstName lastName patientId age gender')
          .populate('ward', 'name code floor')
          .populate('bed', 'bedNumber'),
      ]);

      doctorSpecificData = {
        doctorId: docDoc.doctorId,
        todayAppointmentsList: myTodayAppts,
        pendingLabReports: myPendingLab,
        activeInpatients: myRecentPatients,
      };
    }
  }

  res.json({
    success: true,
    overview: {
      totalPatients,
      newPatientsToday,
      totalDoctors,
      todayAppointments,
      activeAdmissions,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate: totalBeds > 0 ? parseFloat(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0,
      todayRevenue,
      monthRevenue,
      totalPendingDue,
      pendingInvoicesCount,
      lowStockMedsCount,
      expiringMedsCount,
      pendingLabCount,
    },
    charts: {
      monthlyRevenue: formattedMonthlyTrends,
      appointmentStatuses,
      departmentDistribution: deptAppointments,
    },
    recentActivities,
    doctorSpecificData,
  });
};

module.exports = {
  getDashboardStats,
};
