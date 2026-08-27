const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const InventoryTransaction = require('../models/InventoryTransaction');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');
const { PRESCRIPTION_STATUSES } = require('../config/constants');

// @desc    Get all prescriptions (filter by status, patient, doctor)
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = async (req, res) => {
  const { status, patient, doctor, search, page = 1, limit = 50 } = req.query;
  const query = {};

  if (status) query.status = status;
  if (patient) query.patient = patient;
  if (doctor) query.doctor = doctor;

  if (search) {
    query.$or = [
      { prescriptionId: { $regex: search, $options: 'i' } },
      { diagnosis: { $regex: search, $options: 'i' } },
      { 'medicines.name': { $regex: search, $options: 'i' } },
    ];
  }

  const count = await Prescription.countDocuments(query);
  const prescriptions = await Prescription.find(query)
    .populate('patient', 'firstName lastName patientId age gender phone')
    .populate({
      path: 'doctor',
      populate: [
        { path: 'user', select: 'firstName lastName email' },
        { path: 'department', select: 'name code' },
      ],
    })
    .populate('medicines.medicine')
    .populate('dispensedBy', 'firstName lastName')
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    prescriptions,
  });
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patient')
    .populate({
      path: 'doctor',
      populate: [
        { path: 'user', select: 'firstName lastName email phone' },
        { path: 'department', select: 'name code' },
      ],
    })
    .populate('medicalRecord')
    .populate('medicines.medicine')
    .populate('dispensedBy', 'firstName lastName');

  if (!prescription) {
    return res.status(404).json({ success: false, message: 'Prescription not found' });
  }

  res.json({ success: true, prescription });
};

// @desc    Create new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctors, Admins)
const createPrescription = async (req, res) => {
  const { patient, doctor, medicalRecord, diagnosis, medicines, generalAdvice } = req.body;

  let assignedDoctor = doctor;
  if (!assignedDoctor && req.user.role === 'Doctor') {
    const docDoc = await Doctor.findOne({ user: req.user._id });
    if (docDoc) assignedDoctor = docDoc._id;
  }

  if (!assignedDoctor) {
    return res.status(400).json({ success: false, message: 'Attending doctor is required' });
  }

  if (!medicines || medicines.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one medicine must be prescribed' });
  }

  const prescriptionId = await generateUniqueId(Prescription, 'prescriptionId', 'RX-', 4);

  const prescription = await Prescription.create({
    prescriptionId,
    patient,
    doctor: assignedDoctor,
    medicalRecord: medicalRecord || null,
    diagnosis: diagnosis || '',
    medicines: medicines.map((m) => ({
      medicine: m.medicine || null,
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions || 'Take as directed',
      quantity: Number(m.quantity) || 10,
      dispenseStatus: 'Pending',
    })),
    generalAdvice: generalAdvice || 'Drink plenty of water and follow dietary recommendations.',
    status: PRESCRIPTION_STATUSES.PENDING,
  });

  // Update patient's current medications list
  const newMeds = medicines.map((m) => ({
    name: m.name,
    dosage: m.dosage,
    frequency: m.frequency,
  }));

  await Patient.findByIdAndUpdate(patient, {
    $push: { currentMedications: { $each: newMeds } },
  });

  await logAudit(req, {
    action: 'CREATE_PRESCRIPTION',
    module: 'Pharmacy',
    recordId: prescription.prescriptionId,
    details: `Created prescription ${prescription.prescriptionId} with ${medicines.length} medicine(s)`,
  });

  const populated = await Prescription.findById(prescription._id)
    .populate('patient', 'firstName lastName patientId')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName' },
    });

  res.status(201).json({
    success: true,
    message: 'Prescription generated successfully',
    prescription: populated,
  });
};

// @desc    Dispense prescription & deduct pharmacy inventory
// @route   POST /api/prescriptions/:id/dispense
// @access  Private (Pharmacist, Admins)
const dispensePrescription = async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) {
    return res.status(404).json({ success: false, message: 'Prescription not found' });
  }

  const { itemsToDispense } = req.body; // array of { medicineIndex, medicineId, quantity }

  let allDispensed = true;

  for (let i = 0; i < prescription.medicines.length; i++) {
    const item = prescription.medicines[i];
    
    // Check if item has a linked medicine in inventory
    let targetMed = null;
    if (item.medicine) {
      targetMed = await Medicine.findById(item.medicine);
    } else {
      targetMed = await Medicine.findOne({ name: { $regex: new RegExp(`^${item.name}$`, 'i') } });
    }

    if (targetMed) {
      const qtyToDeduct = item.quantity || 1;
      const prevStock = targetMed.stockQuantity;
      targetMed.stockQuantity = Math.max(0, targetMed.stockQuantity - qtyToDeduct);
      
      if (targetMed.stockQuantity <= 0) {
        targetMed.status = 'Out of Stock';
      }
      await targetMed.save();

      // Record transaction
      const txnId = await generateUniqueId(InventoryTransaction, 'transactionId', 'TXN-', 4);
      await InventoryTransaction.create({
        transactionId: txnId,
        itemType: 'Medicine',
        medicine: targetMed._id,
        transactionType: 'DISPENSED',
        quantity: qtyToDeduct,
        previousQuantity: prevStock,
        newQuantity: targetMed.stockQuantity,
        referenceNumber: prescription.prescriptionId,
        reason: `Dispensed for Prescription ${prescription.prescriptionId}`,
        performedBy: req.user._id,
      });

      item.dispenseStatus = 'Dispensed';
    } else {
      item.dispenseStatus = 'Dispensed';
    }
  }

  prescription.status = PRESCRIPTION_STATUSES.DISPENSED;
  prescription.dispensedBy = req.user._id;
  prescription.dispensedAt = new Date();
  await prescription.save();

  await logAudit(req, {
    action: 'DISPENSE_PRESCRIPTION',
    module: 'Pharmacy',
    recordId: prescription.prescriptionId,
    details: `Dispensed all medicines for Prescription ${prescription.prescriptionId}`,
  });

  res.json({
    success: true,
    message: 'Medicines dispensed successfully and inventory updated',
    prescription,
  });
};

module.exports = {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  dispensePrescription,
};
