const Admission = require('../models/Admission');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');
const { ADMISSION_STATUSES, BED_STATUSES } = require('../config/constants');

// @desc    Get all admissions (filter by status, patient, doctor, ward)
// @route   GET /api/admissions
// @access  Private
const getAdmissions = async (req, res) => {
  const { status, patient, doctor, ward, search, page = 1, limit = 50 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (patient) query.patient = patient;
  if (doctor) query.doctor = doctor;
  if (ward) query.ward = ward;

  if (search) {
    query.admissionId = { $regex: search, $options: 'i' };
  }

  const count = await Admission.countDocuments(query);
  const admissions = await Admission.find(query)
    .populate('patient', 'firstName lastName patientId age gender phone bloodGroup')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName email' },
    })
    .populate('ward', 'name code type chargePerDay floor')
    .populate('bed', 'bedNumber status features')
    .populate('admittedBy', 'firstName lastName')
    .populate('dischargedBy', 'firstName lastName')
    .sort({ admissionDate: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    admissions,
  });
};

// @desc    Get single admission details
// @route   GET /api/admissions/:id
// @access  Private
const getAdmissionById = async (req, res) => {
  const admission = await Admission.findById(req.params.id)
    .populate('patient')
    .populate({
      path: 'doctor',
      populate: [
        { path: 'user', select: 'firstName lastName email phone' },
        { path: 'department', select: 'name' },
      ],
    })
    .populate('ward')
    .populate('bed')
    .populate('dailyCareNotes.recordedBy', 'firstName lastName role');

  if (!admission) {
    return res.status(404).json({ success: false, message: 'Admission record not found' });
  }

  res.json({ success: true, admission });
};

// @desc    Admit a patient
// @route   POST /api/admissions
// @access  Private (Admins, Doctors, Receptionists, Nurses)
const createAdmission = async (req, res) => {
  const { patient, doctor, ward, bed, admittingDiagnosis, reasonForAdmission, admissionDate } = req.body;

  // Validate bed availability
  const targetBed = await Bed.findById(bed);
  if (!targetBed) {
    return res.status(404).json({ success: false, message: 'Selected bed not found' });
  }

  if (targetBed.status === BED_STATUSES.OCCUPIED) {
    return res.status(400).json({
      success: false,
      message: `Bed ${targetBed.bedNumber} is currently occupied. Please select an available bed.`,
    });
  }

  if (targetBed.status === BED_STATUSES.MAINTENANCE) {
    return res.status(400).json({
      success: false,
      message: `Bed ${targetBed.bedNumber} is currently under maintenance.`,
    });
  }

  let assignedDoctor = doctor;
  if (!assignedDoctor && req.user.role === 'Doctor') {
    const docDoc = await Doctor.findOne({ user: req.user._id });
    if (docDoc) assignedDoctor = docDoc._id;
  }

  if (!assignedDoctor) {
    return res.status(400).json({ success: false, message: 'Attending doctor is required' });
  }

  const admissionId = await generateUniqueId(Admission, 'admissionId', 'ADM-', 4);

  const admission = await Admission.create({
    admissionId,
    patient,
    doctor: assignedDoctor,
    ward,
    bed,
    admissionDate: admissionDate || new Date(),
    admittingDiagnosis,
    reasonForAdmission: reasonForAdmission || '',
    status: ADMISSION_STATUSES.ADMITTED,
    admittedBy: req.user._id,
  });

  // Lock and allocate bed
  targetBed.status = BED_STATUSES.OCCUPIED;
  targetBed.currentPatient = patient;
  targetBed.currentAdmission = admission._id;
  await targetBed.save();

  // Update patient status to Inpatient
  await Patient.findByIdAndUpdate(patient, {
    status: 'Inpatient',
  });

  await logAudit(req, {
    action: 'ADMIT_PATIENT',
    module: 'Admissions',
    recordId: admission.admissionId,
    details: `Admitted patient to Bed ${targetBed.bedNumber} (Admission ID: ${admission.admissionId})`,
  });

  const populated = await Admission.findById(admission._id)
    .populate('patient', 'firstName lastName patientId')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName' },
    })
    .populate('ward', 'name code')
    .populate('bed', 'bedNumber');

  res.status(201).json({
    success: true,
    message: 'Patient admitted successfully',
    admission: populated,
  });
};

// @desc    Add daily care note / vitals to admission
// @route   POST /api/admissions/:id/daily-notes
// @access  Private (Nurses, Doctors)
const addDailyCareNote = async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    return res.status(404).json({ success: false, message: 'Admission record not found' });
  }

  const { note, vitals } = req.body;

  admission.dailyCareNotes.push({
    recordedAt: new Date(),
    recordedBy: req.user._id,
    note: note || '',
    vitals: vitals || {},
  });

  await admission.save();

  res.json({
    success: true,
    message: 'Daily clinical care note recorded',
    admission,
  });
};

// @desc    Discharge patient
// @route   POST /api/admissions/:id/discharge
// @access  Private (Doctors, Admins)
const dischargePatient = async (req, res) => {
  const admission = await Admission.findById(req.params.id);
  if (!admission) {
    return res.status(404).json({ success: false, message: 'Admission record not found' });
  }

  if (admission.status === ADMISSION_STATUSES.DISCHARGED) {
    return res.status(400).json({ success: false, message: 'Patient is already discharged' });
  }

  const { dischargeCondition, summary, instructions, followUpAdvice } = req.body;

  admission.status = ADMISSION_STATUSES.DISCHARGED;
  admission.dischargeDate = new Date();
  admission.dischargedBy = req.user._id;
  admission.dischargeSummary = {
    dischargeCondition: dischargeCondition || 'Stable',
    summary: summary || 'Patient treated and discharged in stable condition.',
    instructions: instructions || 'Follow regular medication schedule and maintain rest.',
    followUpAdvice: followUpAdvice || 'Follow up in OPD after 7 days.',
  };

  await admission.save();

  // Free up Bed
  if (admission.bed) {
    await Bed.findByIdAndUpdate(admission.bed, {
      status: BED_STATUSES.AVAILABLE,
      currentPatient: null,
      currentAdmission: null,
    });
  }

  // Update patient status
  await Patient.findByIdAndUpdate(admission.patient, {
    status: 'Discharged',
  });

  await logAudit(req, {
    action: 'DISCHARGE_PATIENT',
    module: 'Admissions',
    recordId: admission.admissionId,
    details: `Discharged patient from Admission ${admission.admissionId}`,
  });

  res.json({
    success: true,
    message: 'Patient discharged successfully and bed freed',
    admission,
  });
};

module.exports = {
  getAdmissions,
  getAdmissionById,
  createAdmission,
  addDailyCareNote,
  dischargePatient,
};
