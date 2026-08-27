const LaboratoryTest = require('../models/LaboratoryTest');
const LaboratoryReport = require('../models/LaboratoryReport');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');
const { LAB_STATUSES } = require('../config/constants');

// ==================== TEST CATALOG ====================

// @desc    Get all lab tests catalog
// @route   GET /api/laboratory/tests
// @access  Private
const getLabTests = async (req, res) => {
  const { category, search, status } = req.query;
  const query = {};

  if (category) query.category = category;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { testName: { $regex: search, $options: 'i' } },
      { testCode: { $regex: search, $options: 'i' } },
    ];
  }

  const tests = await LaboratoryTest.find(query).sort({ category: 1, testName: 1 });
  res.json({ success: true, count: tests.length, tests });
};

// @desc    Create new lab test in catalog
// @route   POST /api/laboratory/tests
// @access  Private (Lab Staff, Admins)
const createLabTest = async (req, res) => {
  const { testCode, testName, category, description, price, sampleType, parameters, turnaroundTimeHours, status } = req.body;

  const existing = await LaboratoryTest.findOne({ testCode: testCode.toUpperCase().trim() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Test code already exists' });
  }

  const test = await LaboratoryTest.create({
    testCode: testCode.toUpperCase().trim(),
    testName: testName.trim(),
    category,
    description: description || '',
    price: Number(price) || 0,
    sampleType: sampleType || 'Blood',
    parameters: parameters || [],
    turnaroundTimeHours: Number(turnaroundTimeHours) || 24,
    status: status || 'Active',
  });

  await logAudit(req, {
    action: 'CREATE_LAB_TEST',
    module: 'Laboratory',
    recordId: test.testCode,
    details: `Created lab test ${test.testName} (${test.testCode})`,
  });

  res.status(201).json({ success: true, message: 'Lab test created', test });
};

// @desc    Update lab test
// @route   PUT /api/laboratory/tests/:id
// @access  Private (Lab Staff, Admins)
const updateLabTest = async (req, res) => {
  const test = await LaboratoryTest.findById(req.params.id);
  if (!test) {
    return res.status(404).json({ success: false, message: 'Test not found' });
  }

  const updatedTest = await LaboratoryTest.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(req, {
    action: 'UPDATE_LAB_TEST',
    module: 'Laboratory',
    recordId: updatedTest.testCode,
    details: `Updated lab test ${updatedTest.testName}`,
  });

  res.json({ success: true, message: 'Lab test updated', test: updatedTest });
};

// ==================== LAB REPORTS & REQUESTS ====================

// @desc    Get all lab requests / reports
// @route   GET /api/laboratory/reports
// @access  Private
const getLabReports = async (req, res) => {
  const { status, patient, doctor, search, page = 1, limit = 50 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (patient) query.patient = patient;
  if (doctor) query.doctor = doctor;

  if (search) {
    query.reportId = { $regex: search, $options: 'i' };
  }

  const count = await LaboratoryReport.countDocuments(query);
  const reports = await LaboratoryReport.find(query)
    .populate('test')
    .populate('patient', 'firstName lastName patientId age gender phone')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName email' },
    })
    .populate('performedBy', 'firstName lastName')
    .populate('verifiedBy', 'firstName lastName')
    .sort({ requestedDate: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    reports,
  });
};

// @desc    Get single lab report
// @route   GET /api/laboratory/reports/:id
// @access  Private
const getLabReportById = async (req, res) => {
  const report = await LaboratoryReport.findById(req.params.id)
    .populate('test')
    .populate('patient')
    .populate({
      path: 'doctor',
      populate: [
        { path: 'user', select: 'firstName lastName email phone' },
        { path: 'department', select: 'name' },
      ],
    })
    .populate('performedBy', 'firstName lastName')
    .populate('verifiedBy', 'firstName lastName');

  if (!report) {
    return res.status(404).json({ success: false, message: 'Laboratory report not found' });
  }

  res.json({ success: true, report });
};

// @desc    Request a new lab test
// @route   POST /api/laboratory/reports
// @access  Private (Doctors, Receptionists, Admins)
const requestLabTest = async (req, res) => {
  const { test, patient, doctor, priority } = req.body;

  let assignedDoctor = doctor;
  if (!assignedDoctor && req.user.role === 'Doctor') {
    const docDoc = await Doctor.findOne({ user: req.user._id });
    if (docDoc) assignedDoctor = docDoc._id;
  }

  if (!assignedDoctor) {
    return res.status(400).json({ success: false, message: 'Requesting doctor is required' });
  }

  const testDoc = await LaboratoryTest.findById(test);
  if (!testDoc) {
    return res.status(404).json({ success: false, message: 'Selected test not found' });
  }

  const reportId = await generateUniqueId(LaboratoryReport, 'reportId', 'LAB-R', 4);

  // Initialize parameters skeleton from test catalog
  const initialResults = (testDoc.parameters || []).map((p) => ({
    parameter: p.name,
    value: '',
    unit: p.unit || '',
    normalRange: p.normalRange || '',
    flag: 'Normal',
  }));

  const report = await LaboratoryReport.create({
    reportId,
    test,
    patient,
    doctor: assignedDoctor,
    requestedDate: new Date(),
    status: LAB_STATUSES.REQUESTED,
    priority: priority || 'Normal',
    results: initialResults,
  });

  await logAudit(req, {
    action: 'REQUEST_LAB_TEST',
    module: 'Laboratory',
    recordId: report.reportId,
    details: `Requested test ${testDoc.testName} (${report.reportId})`,
  });

  const populated = await LaboratoryReport.findById(report._id)
    .populate('test')
    .populate('patient', 'firstName lastName patientId')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName' },
    });

  res.status(201).json({
    success: true,
    message: 'Laboratory test requested successfully',
    report: populated,
  });
};

// @desc    Update lab report status & results
// @route   PUT /api/laboratory/reports/:id
// @access  Private (Lab Staff, Admins)
const updateLabReport = async (req, res) => {
  const report = await LaboratoryReport.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Laboratory report not found' });
  }

  const { status, results, clinicalImpression, remarks, priority, sampleCollectedDate, attachmentUrl } = req.body;

  if (status) {
    report.status = status;
    if (status === LAB_STATUSES.SAMPLE_COLLECTED && !report.sampleCollectedDate) {
      report.sampleCollectedDate = new Date();
    }
    if (status === LAB_STATUSES.COMPLETED) {
      report.completedDate = new Date();
      report.performedBy = req.user._id;
      report.verifiedBy = req.user._id;

      // Notify Doctor
      const docDoc = await Doctor.findById(report.doctor);
      if (docDoc && docDoc.user) {
        await Notification.create({
          recipient: docDoc.user,
          title: 'Lab Report Ready',
          message: `Lab report ${report.reportId} is completed and verified.`,
          type: 'Success',
          module: 'Laboratory',
          link: `/laboratory`,
        });
      }
    }
  }

  if (results) report.results = results;
  if (clinicalImpression !== undefined) report.clinicalImpression = clinicalImpression;
  if (remarks !== undefined) report.remarks = remarks;
  if (priority) report.priority = priority;
  if (sampleCollectedDate) report.sampleCollectedDate = new Date(sampleCollectedDate);
  if (attachmentUrl) report.attachmentUrl = attachmentUrl;

  await report.save();

  await logAudit(req, {
    action: 'UPDATE_LAB_REPORT',
    module: 'Laboratory',
    recordId: report.reportId,
    details: `Updated report ${report.reportId} status to ${report.status}`,
  });

  const populated = await LaboratoryReport.findById(report._id)
    .populate('test')
    .populate('patient', 'firstName lastName patientId')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName' },
    });

  res.json({
    success: true,
    message: 'Laboratory report updated successfully',
    report: populated,
  });
};

module.exports = {
  getLabTests,
  createLabTest,
  updateLabTest,
  getLabReports,
  getLabReportById,
  requestLabTest,
  updateLabReport,
};
