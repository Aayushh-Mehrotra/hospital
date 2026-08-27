const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc    Get all medical records (with patient, doctor, diagnosis filters)
// @route   GET /api/medical-records
// @access  Private
const getMedicalRecords = async (req, res) => {
  const { patient, doctor, search, page = 1, limit = 50 } = req.query;
  const query = {};

  if (patient) query.patient = patient;
  if (doctor) query.doctor = doctor;

  if (search) {
    query.$or = [
      { recordId: { $regex: search, $options: 'i' } },
      { chiefComplaint: { $regex: search, $options: 'i' } },
      { diagnosis: { $regex: search, $options: 'i' } },
    ];
  }

  const count = await MedicalRecord.countDocuments(query);
  const records = await MedicalRecord.find(query)
    .populate('patient', 'firstName lastName patientId age gender bloodGroup phone')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName email' },
    })
    .populate('appointment')
    .populate('recommendedTests')
    .sort({ visitDate: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    records,
  });
};

// @desc    Get single medical record
// @route   GET /api/medical-records/:id
// @access  Private
const getMedicalRecordById = async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate('patient')
    .populate({
      path: 'doctor',
      populate: [
        { path: 'user', select: 'firstName lastName email' },
        { path: 'department', select: 'name' },
      ],
    })
    .populate('appointment')
    .populate('recommendedTests');

  if (!record) {
    return res.status(404).json({ success: false, message: 'Medical record not found' });
  }

  res.json({ success: true, record });
};

// @desc    Create new medical record
// @route   POST /api/medical-records
// @access  Private (Doctors, Admins)
const createMedicalRecord = async (req, res) => {
  const {
    patient,
    doctor,
    appointment,
    visitDate,
    chiefComplaint,
    symptoms,
    vitals,
    diagnosis,
    icdCode,
    treatmentPlan,
    clinicalNotes,
    recommendedTests,
    followUpDate,
  } = req.body;

  let assignedDoctor = doctor;
  if (!assignedDoctor && req.user.role === 'Doctor') {
    const docDoc = await Doctor.findOne({ user: req.user._id });
    if (docDoc) assignedDoctor = docDoc._id;
  }

  if (!assignedDoctor) {
    return res.status(400).json({ success: false, message: 'Please specify the attending doctor' });
  }

  const recordId = await generateUniqueId(MedicalRecord, 'recordId', 'EMR-', 4);

  // Auto-calculate BMI if height & weight provided
  let calculatedVitals = { ...vitals };
  if (calculatedVitals.weight && calculatedVitals.height) {
    const heightInMeters = calculatedVitals.height / 100;
    calculatedVitals.bmi = parseFloat((calculatedVitals.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }

  const record = await MedicalRecord.create({
    recordId,
    patient,
    doctor: assignedDoctor,
    appointment: appointment || null,
    visitDate: visitDate || new Date(),
    chiefComplaint,
    symptoms: symptoms || [],
    vitals: calculatedVitals,
    diagnosis,
    icdCode: icdCode || '',
    treatmentPlan,
    clinicalNotes: clinicalNotes || '',
    recommendedTests: recommendedTests || [],
    followUpDate: followUpDate || null,
  });

  // If tied to an appointment, mark appointment as Completed
  if (appointment) {
    await Appointment.findByIdAndUpdate(appointment, {
      status: 'Completed',
      completedAt: new Date(),
    });
  }

  // Update patient's current medical history with this diagnosis
  await Patient.findByIdAndUpdate(patient, {
    $addToSet: {
      medicalHistory: {
        condition: diagnosis,
        diagnosedDate: new Date(),
        notes: chiefComplaint,
      },
    },
  });

  await logAudit(req, {
    action: 'CREATE_MEDICAL_RECORD',
    module: 'EMR',
    recordId: record.recordId,
    details: `Created EMR ${record.recordId} for diagnosis: ${diagnosis}`,
  });

  const populated = await MedicalRecord.findById(record._id)
    .populate('patient', 'firstName lastName patientId')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName' },
    });

  res.status(201).json({
    success: true,
    message: 'Medical record created successfully',
    record: populated,
  });
};

// @desc    Update medical record
// @route   PUT /api/medical-records/:id
// @access  Private (Doctors, Admins)
const updateMedicalRecord = async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Medical record not found' });
  }

  const updatedRecord = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(req, {
    action: 'UPDATE_MEDICAL_RECORD',
    module: 'EMR',
    recordId: updatedRecord.recordId,
    details: `Updated EMR ${updatedRecord.recordId}`,
  });

  res.json({
    success: true,
    message: 'Medical record updated successfully',
    record: updatedRecord,
  });
};

// @desc    Delete medical record
// @route   DELETE /api/medical-records/:id
// @access  Private (Admins)
const deleteMedicalRecord = async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Medical record not found' });
  }

  await MedicalRecord.findByIdAndDelete(req.params.id);

  await logAudit(req, {
    action: 'DELETE_MEDICAL_RECORD',
    module: 'EMR',
    recordId: record.recordId,
    details: `Deleted EMR ${record.recordId}`,
  });

  res.json({ success: true, message: 'Medical record deleted' });
};

module.exports = {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
};
