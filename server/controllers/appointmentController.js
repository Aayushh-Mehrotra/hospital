const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { generateUniqueId } = require('../utils/generateId');
const { logAudit } = require('../middleware/auditMiddleware');
const { APPOINTMENT_STATUSES } = require('../config/constants');

// @desc    Get all appointments with filters & pagination
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  const { doctor, department, patient, status, date, startDate, endDate, page = 1, limit = 50 } = req.query;
  const query = {};

  if (doctor) query.doctor = doctor;
  if (department) query.department = department;
  if (patient) query.patient = patient;
  if (status) query.status = status;

  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: dayStart, $lte: dayEnd };
  } else if (startDate && endDate) {
    query.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // If logged in user is a Doctor, only show their appointments unless admin
  if (req.user.role === 'Doctor') {
    const doctorDoc = await Doctor.findOne({ user: req.user._id });
    if (doctorDoc) {
      query.doctor = doctorDoc._id;
    }
  }

  const count = await Appointment.countDocuments(query);
  const appointments = await Appointment.find(query)
    .populate('patient', 'firstName lastName patientId phone email gender age bloodGroup')
    .populate({
      path: 'doctor',
      populate: [
        { path: 'user', select: 'firstName lastName email avatar' },
        { path: 'department', select: 'name code' },
      ],
    })
    .populate('department', 'name code floor')
    .sort({ appointmentDate: -1, timeSlot: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page),
    appointments,
  });
};

// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/appointments/available-slots
// @access  Private
const getAvailableSlots = async (req, res) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    return res.status(400).json({ success: false, message: 'Please provide both doctorId and date' });
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  const targetDate = new Date(date);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysOfWeek[targetDate.getDay()];

  const daySchedule = doctor.schedule.find((s) => s.day === dayName && s.isAvailable);

  if (!daySchedule) {
    return res.json({
      success: true,
      message: `Doctor is not available on ${dayName}s`,
      slots: [],
    });
  }

  // Generate slots from startTime to endTime
  const [startH, startM] = daySchedule.startTime.split(':').map(Number);
  const [endH, endM] = daySchedule.endTime.split(':').map(Number);
  const duration = daySchedule.slotDurationMinutes || 30;

  const allSlots = [];
  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + duration <= endMinutes) {
    const sH = Math.floor(currentMinutes / 60);
    const sM = currentMinutes % 60;
    const eH = Math.floor((currentMinutes + duration) / 60);
    const eM = (currentMinutes + duration) % 60;

    const formatTime = (h, m) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedH = h % 12 === 0 ? 12 : h % 12;
      const formattedM = String(m).padStart(2, '0');
      return `${formattedH}:${formattedM} ${ampm}`;
    };

    allSlots.push(`${formatTime(sH, sM)} - ${formatTime(eH, eM)}`);
    currentMinutes += duration;
  }

  // Check existing appointments on this date
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: dayStart, $lte: dayEnd },
    status: { $nin: [APPOINTMENT_STATUSES.CANCELLED, APPOINTMENT_STATUSES.NO_SHOW] },
  });

  const bookedSlots = bookedAppointments.map((a) => a.timeSlot);

  const slotResults = allSlots.map((slot) => ({
    timeSlot: slot,
    isBooked: bookedSlots.includes(slot),
  }));

  res.json({
    success: true,
    dayName,
    slots: slotResults,
  });
};

// @desc    Book a new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  const { patient, doctor, department, appointmentDate, timeSlot, type, reasonForVisit, symptoms, notes } = req.body;

  // Verify doctor exists and get department if not specified
  const doctorDoc = await Doctor.findById(doctor);
  if (!doctorDoc) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  const deptId = department || doctorDoc.department;

  // Double booking prevention
  const dayStart = new Date(appointmentDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(appointmentDate);
  dayEnd.setHours(23, 59, 59, 999);

  const existingBooking = await Appointment.findOne({
    doctor,
    appointmentDate: { $gte: dayStart, $lte: dayEnd },
    timeSlot,
    status: { $nin: [APPOINTMENT_STATUSES.CANCELLED, APPOINTMENT_STATUSES.NO_SHOW] },
  });

  if (existingBooking) {
    return res.status(400).json({
      success: false,
      message: 'This time slot is already booked for the selected doctor. Please select another slot.',
    });
  }

  const appointmentId = await generateUniqueId(Appointment, 'appointmentId', 'APT-', 4);

  const appointment = await Appointment.create({
    appointmentId,
    patient,
    doctor,
    department: deptId,
    appointmentDate: new Date(appointmentDate),
    timeSlot,
    type: type || 'In-Person Consultation',
    reasonForVisit: reasonForVisit || '',
    symptoms: symptoms || [],
    notes: notes || '',
    status: APPOINTMENT_STATUSES.SCHEDULED,
    bookedBy: req.user._id,
  });

  // Create notification for Doctor
  if (doctorDoc.user) {
    await Notification.create({
      recipient: doctorDoc.user,
      title: 'New Appointment Scheduled',
      message: `Appointment ${appointment.appointmentId} booked for ${new Date(appointmentDate).toLocaleDateString()} at ${timeSlot}`,
      type: 'Info',
      module: 'Appointments',
      link: `/appointments`,
    });
  }

  await logAudit(req, {
    action: 'BOOK_APPOINTMENT',
    module: 'Appointments',
    recordId: appointment.appointmentId,
    details: `Booked appointment ${appointment.appointmentId}`,
  });

  const populated = await Appointment.findById(appointment._id)
    .populate('patient', 'firstName lastName patientId phone')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName' },
    })
    .populate('department', 'name');

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    appointment: populated,
  });
};

// @desc    Update appointment status / details
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  let appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    appointment = await Appointment.findOne({ appointmentId: req.params.id });
  }

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  const { status, appointmentDate, timeSlot, notes, cancellationReason } = req.body;

  if (status) {
    appointment.status = status;
    if (status === APPOINTMENT_STATUSES.CHECKED_IN) appointment.checkedInAt = new Date();
    if (status === APPOINTMENT_STATUSES.COMPLETED) appointment.completedAt = new Date();
    if (status === APPOINTMENT_STATUSES.CANCELLED) {
      appointment.cancelledAt = new Date();
      if (cancellationReason) appointment.cancellationReason = cancellationReason;
    }
  }

  if (appointmentDate) appointment.appointmentDate = new Date(appointmentDate);
  if (timeSlot) appointment.timeSlot = timeSlot;
  if (notes !== undefined) appointment.notes = notes;

  await appointment.save();

  await logAudit(req, {
    action: 'UPDATE_APPOINTMENT',
    module: 'Appointments',
    recordId: appointment.appointmentId,
    details: `Updated status of appointment ${appointment.appointmentId} to ${appointment.status}`,
  });

  const populated = await Appointment.findById(appointment._id)
    .populate('patient', 'firstName lastName patientId phone')
    .populate({
      path: 'doctor',
      populate: { path: 'user', select: 'firstName lastName' },
    })
    .populate('department', 'name');

  res.json({
    success: true,
    message: 'Appointment updated successfully',
    appointment: populated,
  });
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const cancelAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  appointment.status = APPOINTMENT_STATUSES.CANCELLED;
  appointment.cancelledAt = new Date();
  appointment.cancellationReason = req.body.reason || 'Cancelled by staff/patient';
  await appointment.save();

  await logAudit(req, {
    action: 'CANCEL_APPOINTMENT',
    module: 'Appointments',
    recordId: appointment.appointmentId,
    details: `Cancelled appointment ${appointment.appointmentId}`,
  });

  res.json({ success: true, message: 'Appointment cancelled successfully' });
};

module.exports = {
  getAppointments,
  getAvailableSlots,
  createAppointment,
  updateAppointment,
  cancelAppointment,
};
