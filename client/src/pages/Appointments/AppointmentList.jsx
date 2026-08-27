import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  Stethoscope,
  Building2,
  Check,
  Ban,
  CalendarCheck,
} from 'lucide-react';
import { appointmentApi, doctorApi, departmentApi, patientApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const AppointmentList = () => {
  const { showToast } = useNotification();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');

  // Dropdown options
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [patients, setPatients] = useState([]);

  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState({
    patient: '',
    department: '',
    doctor: '',
    appointmentDate: new Date().toISOString().slice(0, 10),
    timeSlot: '',
    type: 'In-Person Consultation',
    reasonForVisit: '',
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getAll({
        status: statusFilter,
        date: dateFilter,
        doctor: selectedDoctorFilter,
      });
      if (res.data.success) {
        setAppointments(res.data.appointments);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [docRes, deptRes, patRes] = await Promise.all([
        doctorApi.getAll(),
        departmentApi.getAll(),
        patientApi.getAll({ limit: 100 }),
      ]);
      if (docRes.data.success) setDoctors(docRes.data.doctors);
      if (deptRes.data.success) setDepartments(deptRes.data.departments);
      if (patRes.data.success) setPatients(patRes.data.patients);
    } catch (err) {
      console.error('Failed to load dependencies:', err.message);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchAppointments, 250);
    return () => clearTimeout(timer);
  }, [statusFilter, dateFilter, selectedDoctorFilter]);

  // When Doctor or Date changes in the booking form, fetch live time slots!
  useEffect(() => {
    const fetchSlots = async () => {
      if (bookingData.doctor && bookingData.appointmentDate) {
        setLoadingSlots(true);
        try {
          const res = await appointmentApi.getAvailableSlots(bookingData.doctor, bookingData.appointmentDate);
          if (res.data.success) {
            setAvailableSlots(res.data.slots || []);
          }
        } catch (err) {
          console.error('Failed to fetch slots:', err.message);
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setAvailableSlots([]);
      }
    };
    fetchSlots();
  }, [bookingData.doctor, bookingData.appointmentDate]);

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'department') {
        updated.doctor = ''; // reset doctor
        updated.timeSlot = '';
      }
      if (name === 'doctor') {
        updated.timeSlot = '';
      }
      return updated;
    });
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!bookingData.timeSlot) {
      showToast('Please select an available time slot', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await appointmentApi.create(bookingData);
      if (res.data.success) {
        showToast('Appointment booked successfully!', 'success');
        setIsBookModalOpen(false);
        fetchAppointments();
        setBookingData({
          patient: '',
          department: '',
          doctor: '',
          appointmentDate: new Date().toISOString().slice(0, 10),
          timeSlot: '',
          type: 'In-Person Consultation',
          reasonForVisit: '',
        });
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const res = await appointmentApi.update(appointmentId, { status: newStatus });
      if (res.data.success) {
        showToast(`Appointment marked as ${newStatus}`, 'success');
        fetchAppointments();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredDoctorsForBooking = bookingData.department
    ? doctors.filter((d) => d.department?._id === bookingData.department || d.department === bookingData.department)
    : doctors;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Appointments Scheduling</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Book consultations, manage patient check-ins, and view real-time OPD queues.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsBookModalOpen(true)}>
          Book Appointment
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['', 'Scheduled', 'Confirmed', 'Checked In', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st || 'All Appointments'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-primary-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Clear Date
            </button>
          )}

          <select
            value={selectedDoctorFilter}
            onChange={(e) => setSelectedDoctorFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                Dr. {doc.user?.firstName} {doc.user?.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <p className="mt-2 text-xs text-slate-400">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No appointments found</h3>
            <p className="text-xs text-slate-400 mt-1">Try selecting a different filter or book a new appointment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Appointment #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Date & Time Slot</th>
                  <th className="py-3 px-4">Visit Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary-600">{apt.appointmentId}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ID: {apt.patient?.patientId} • Ph: {apt.patient?.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500">{apt.department?.name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium">{formatDate(apt.appointmentDate)}</div>
                      <div className="text-[11px] font-bold text-primary-700">{apt.timeSlot}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{apt.type}</td>
                    <td className="py-3 px-4">
                      <Badge status={apt.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {apt.status === 'Scheduled' && (
                          <button
                            onClick={() => handleUpdateStatus(apt._id, 'Confirmed')}
                            className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        {(apt.status === 'Scheduled' || apt.status === 'Confirmed') && (
                          <button
                            onClick={() => handleUpdateStatus(apt._id, 'Checked In')}
                            className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-colors"
                          >
                            Check In
                          </button>
                        )}
                        {apt.status === 'Checked In' && (
                          <button
                            onClick={() => handleUpdateStatus(apt._id, 'Completed')}
                            className="px-2.5 py-1 rounded bg-primary-50 hover:bg-primary-100 text-primary-700 text-[11px] font-bold transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(apt._id, 'Cancelled')}
                            className="px-2 py-1 rounded hover:bg-rose-50 text-rose-600 text-[11px] font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Appointment Modal with Live Slot Selector */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Book Patient Appointment"
        subtitle="Select doctor, date, and verified available time slot"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
            <select
              required
              name="patient"
              value={bookingData.patient}
              onChange={handleBookingChange}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">Choose Patient</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName} ({p.patientId}) - {p.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
              <select
                required
                name="department"
                value={bookingData.department}
                onChange={handleBookingChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">Choose Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor *</label>
              <select
                required
                name="doctor"
                value={bookingData.doctor}
                onChange={handleBookingChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">Choose Doctor</option>
                {filteredDoctorsForBooking.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    Dr. {doc.user?.firstName} {doc.user?.lastName} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date *</label>
              <input
                type="date"
                required
                name="appointmentDate"
                min={new Date().toISOString().slice(0, 10)}
                value={bookingData.appointmentDate}
                onChange={handleBookingChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Type</label>
              <select
                name="type"
                value={bookingData.type}
                onChange={handleBookingChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="In-Person Consultation">In-Person Consultation</option>
                <option value="Follow-up">Follow-up Visit</option>
                <option value="Emergency">Emergency</option>
                <option value="Routine Checkup">Routine Checkup</option>
              </select>
            </div>
          </div>

          {/* Time Slot Picker Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Available Time Slots * (Conflict-free booking)
            </label>
            {!bookingData.doctor ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                Please select a doctor and date to view available appointment slots.
              </p>
            ) : loadingSlots ? (
              <div className="py-4 text-center text-xs text-slate-400">Loading doctor schedule slots...</div>
            ) : availableSlots.length === 0 ? (
              <p className="text-xs text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-200">
                Doctor is not available on this day or no slots configured.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                {availableSlots.map((slot, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={slot.isBooked}
                    onClick={() => setBookingData((prev) => ({ ...prev, timeSlot: slot.timeSlot }))}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                      slot.isBooked
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                        : bookingData.timeSlot === slot.timeSlot
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-primary-400 hover:bg-primary-50'
                    }`}
                  >
                    {slot.timeSlot}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit / Symptoms</label>
            <textarea
              rows={2}
              name="reasonForVisit"
              value={bookingData.reasonForVisit}
              onChange={handleBookingChange}
              placeholder="e.g. Mild chest pain, fever, follow-up on medication"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Confirm & Book Slot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
