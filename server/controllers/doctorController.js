const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');
const { ROLES } = require('../config/constants');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Private
const getDoctors = async (req, res) => {
  const { department, status, search } = req.query;
  const query = {};

  if (department) query.department = department;
  if (status) query.status = status;

  let doctors = await Doctor.find(query)
    .populate('user', 'firstName lastName email phone avatar status')
    .populate('department', 'name code floor')
    .sort({ createdAt: -1 });

  if (search) {
    const s = search.toLowerCase();
    doctors = doctors.filter((doc) => {
      const u = doc.user;
      return (
        (u && (u.firstName.toLowerCase().includes(s) || u.lastName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s))) ||
        doc.specialization.toLowerCase().includes(s) ||
        doc.doctorId.toLowerCase().includes(s)
      );
    });
  }

  res.json({ success: true, count: doctors.length, doctors });
};

// @desc    Get doctor by ID or doctorId
// @route   GET /api/doctors/:id
// @access  Private
const getDoctorById = async (req, res) => {
  let doctor = null;

  if (req.params.id.startsWith('DOC-')) {
    doctor = await Doctor.findOne({ doctorId: req.params.id })
      .populate('user', 'firstName lastName email phone avatar status')
      .populate('department', 'name code floor contactPhone');
  } else {
    doctor = await Doctor.findById(req.params.id)
      .populate('user', 'firstName lastName email phone avatar status')
      .populate('department', 'name code floor contactPhone');
  }

  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor record not found' });
  }

  // Get appointments for this doctor
  const appointments = await Appointment.find({ doctor: doctor._id })
    .populate('patient', 'firstName lastName patientId phone gender age')
    .sort({ appointmentDate: -1 })
    .limit(50);

  res.json({
    success: true,
    doctor,
    appointments,
  });
};

// @desc    Create doctor profile & link/create user
// @route   POST /api/doctors
// @access  Private (Admins)
const createDoctor = async (req, res) => {
  const {
    userId,
    firstName,
    lastName,
    email,
    password,
    phone,
    department,
    specialization,
    qualifications,
    experienceYears,
    licenseNumber,
    consultationFee,
    roomNumber,
    bio,
    schedule,
    status,
  } = req.body;

  let assignedUser;

  if (userId) {
    assignedUser = await User.findById(userId);
    if (!assignedUser) {
      return res.status(404).json({ success: false, message: 'Specified user not found' });
    }
  } else {
    // Create new user account for doctor
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
    assignedUser = await User.create({
      username,
      email: email.toLowerCase(),
      password: password || 'Doctor@123',
      role: ROLES.DOCTOR,
      firstName,
      lastName,
      phone,
      department,
      status: 'Active',
    });
  }

  const doctorId = await generateUniqueId(Doctor, 'doctorId', 'DOC-', 4);

  const defaultSchedule = [
    { day: 'Monday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    { day: 'Tuesday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    { day: 'Wednesday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    { day: 'Thursday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    { day: 'Friday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
  ];

  const doctor = await Doctor.create({
    doctorId,
    user: assignedUser._id,
    department,
    specialization,
    qualifications: qualifications || [],
    experienceYears: experienceYears || 0,
    licenseNumber: licenseNumber || '',
    consultationFee: consultationFee || 50,
    roomNumber: roomNumber || 'OPD-101',
    bio: bio || '',
    schedule: schedule && schedule.length > 0 ? schedule : defaultSchedule,
    status: status || 'Active',
  });

  await logAudit(req, {
    action: 'CREATE_DOCTOR',
    module: 'Doctors',
    recordId: doctor.doctorId,
    details: `Added doctor profile ${assignedUser.firstName} ${assignedUser.lastName} (${doctor.doctorId})`,
  });

  const populatedDoctor = await Doctor.findById(doctor._id)
    .populate('user', 'firstName lastName email phone avatar')
    .populate('department', 'name code');

  res.status(201).json({
    success: true,
    message: 'Doctor created successfully',
    doctor: populatedDoctor,
  });
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private
const updateDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  const {
    department,
    specialization,
    qualifications,
    experienceYears,
    licenseNumber,
    consultationFee,
    roomNumber,
    bio,
    schedule,
    status,
    firstName,
    lastName,
    phone,
  } = req.body;

  if (department) doctor.department = department;
  if (specialization) doctor.specialization = specialization;
  if (qualifications) doctor.qualifications = qualifications;
  if (experienceYears !== undefined) doctor.experienceYears = experienceYears;
  if (licenseNumber !== undefined) doctor.licenseNumber = licenseNumber;
  if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
  if (roomNumber !== undefined) doctor.roomNumber = roomNumber;
  if (bio !== undefined) doctor.bio = bio;
  if (schedule) doctor.schedule = schedule;
  if (status) doctor.status = status;

  await doctor.save();

  if (firstName || lastName || phone) {
    await User.findByIdAndUpdate(doctor.user, {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
    });
  }

  await logAudit(req, {
    action: 'UPDATE_DOCTOR',
    module: 'Doctors',
    recordId: doctor.doctorId,
    details: `Updated doctor profile ${doctor.doctorId}`,
  });

  const updatedDoctor = await Doctor.findById(doctor._id)
    .populate('user', 'firstName lastName email phone avatar')
    .populate('department', 'name code');

  res.json({
    success: true,
    message: 'Doctor updated successfully',
    doctor: updatedDoctor,
  });
};

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
// @access  Private (Admins)
const deleteDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  await Doctor.findByIdAndDelete(req.params.id);

  await logAudit(req, {
    action: 'DELETE_DOCTOR',
    module: 'Doctors',
    recordId: doctor.doctorId,
    details: `Deleted doctor profile ${doctor.doctorId}`,
  });

  res.json({ success: true, message: 'Doctor profile removed' });
};

module.exports = {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
