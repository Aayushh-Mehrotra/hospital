const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const LaboratoryReport = require('../models/LaboratoryReport');
const Admission = require('../models/Admission');
const Invoice = require('../models/Invoice');
const { generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');

// @desc    Get all patients with search, filters & pagination
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
  const { search, gender, bloodGroup, status, page = 1, limit = 50 } = req.query;
  const query = {};

  if (gender) query.gender = gender;
  if (bloodGroup) query.bloodGroup = bloodGroup;
  if (status) query.status = status;

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { patientId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const count = await Patient.countDocuments(query);
  const patients = await Patient.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    patients,
  });
};

// @desc    Get complete 360-degree patient profile with all linked clinical & billing records
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res) => {
  let patient = null;

  if (req.params.id.startsWith('PAT-')) {
    patient = await Patient.findOne({ patientId: req.params.id }).populate('registeredBy', 'firstName lastName email');
  } else {
    patient = await Patient.findById(req.params.id).populate('registeredBy', 'firstName lastName email');
  }

  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  // Fetch all linked records concurrently for fast response
  const [appointments, medicalRecords, prescriptions, labReports, admissions, invoices] = await Promise.all([
    Appointment.find({ patient: patient._id })
      .populate('doctor')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('department')
      .sort({ appointmentDate: -1 }),

    MedicalRecord.find({ patient: patient._id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('recommendedTests')
      .sort({ visitDate: -1 }),

    Prescription.find({ patient: patient._id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('medicines.medicine')
      .sort({ date: -1 }),

    LaboratoryReport.find({ patient: patient._id })
      .populate('test')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName email' } })
      .sort({ requestedDate: -1 }),

    Admission.find({ patient: patient._id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName email' } })
      .populate('ward')
      .populate('bed')
      .sort({ admissionDate: -1 }),

    Invoice.find({ patient: patient._id })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'firstName lastName' } })
      .sort({ billingDate: -1 }),
  ]);

  res.json({
    success: true,
    patient,
    records: {
      appointments,
      medicalRecords,
      prescriptions,
      labReports,
      admissions,
      invoices,
    },
  });
};

// @desc    Register a new patient
// @route   POST /api/patients
// @access  Private
const createPatient = async (req, res) => {
  const {
    firstName,
    lastName,
    gender,
    dateOfBirth,
    bloodGroup,
    phone,
    email,
    address,
    emergencyContact,
    guardian,
    maritalStatus,
    occupation,
    allergies,
    medicalHistory,
    currentMedications,
    insurance,
    notes,
  } = req.body;

  // Calculate age if not provided
  let age = req.body.age;
  if (dateOfBirth && !age) {
    const dob = new Date(dateOfBirth);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    age = Math.abs(age_dt.getUTCFullYear() - 1970);
  }

  const patientId = await generateUniqueId(Patient, 'patientId', 'PAT-', 4);

  const patient = await Patient.create({
    patientId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    gender,
    dateOfBirth,
    age,
    bloodGroup: bloodGroup || 'Unknown',
    phone: phone.trim(),
    email: email ? email.trim().toLowerCase() : '',
    address: address || {},
    emergencyContact: emergencyContact || {},
    guardian: guardian || {},
    maritalStatus: maritalStatus || 'Single',
    occupation: occupation || '',
    allergies: allergies || [],
    medicalHistory: medicalHistory || [],
    currentMedications: currentMedications || [],
    insurance: insurance || {},
    notes: notes || '',
    registeredBy: req.user._id,
  });

  await logAudit(req, {
    action: 'CREATE_PATIENT',
    module: 'Patients',
    recordId: patient.patientId,
    details: `Registered patient ${patient.firstName} ${patient.lastName} (ID: ${patient.patientId})`,
  });

  res.status(201).json({
    success: true,
    message: 'Patient registered successfully',
    patient,
  });
};

// @desc    Update patient information
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res) => {
  let patient = await Patient.findById(req.params.id);

  if (!patient) {
    patient = await Patient.findOne({ patientId: req.params.id });
  }

  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  const updatedPatient = await Patient.findByIdAndUpdate(patient._id, req.body, {
    new: true,
    runValidators: true,
  });

  await logAudit(req, {
    action: 'UPDATE_PATIENT',
    module: 'Patients',
    recordId: updatedPatient.patientId,
    details: `Updated info for patient ${updatedPatient.patientId}`,
  });

  res.json({
    success: true,
    message: 'Patient record updated successfully',
    patient: updatedPatient,
  });
};

// @desc    Upload document to patient file
// @route   POST /api/patients/:id/documents
// @access  Private
const uploadPatientDocument = async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a valid file' });
  }

  const documentData = {
    title: req.body.title || req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`,
    fileType: req.file.mimetype,
    uploadedAt: new Date(),
  };

  patient.documents.push(documentData);
  await patient.save();

  await logAudit(req, {
    action: 'UPLOAD_DOCUMENT',
    module: 'Patients',
    recordId: patient.patientId,
    details: `Uploaded document '${documentData.title}' for patient ${patient.patientId}`,
  });

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    document: documentData,
  });
};

// @desc    Delete / archive patient
// @route   DELETE /api/patients/:id
// @access  Private (Admins)
const deletePatient = async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  await Patient.findByIdAndDelete(req.params.id);

  await logAudit(req, {
    action: 'DELETE_PATIENT',
    module: 'Patients',
    recordId: patient.patientId,
    details: `Deleted patient ${patient.patientId}`,
  });

  res.json({ success: true, message: 'Patient record removed successfully' });
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  uploadPatientDocument,
  deletePatient,
};
