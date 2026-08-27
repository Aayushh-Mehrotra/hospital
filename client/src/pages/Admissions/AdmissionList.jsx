import React, { useState, useEffect } from 'react';
import { DoorOpen, Plus, Search, CheckCircle, BedDouble, UserCheck, HeartPulse, FileCheck, LogOut } from 'lucide-react';
import { admissionApi, patientApi, doctorApi, wardBedApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';

export const AdmissionList = () => {
  const { showToast } = useNotification();

  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Admitted');

  // Options
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [wards, setWards] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);

  // Modals
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Admit form
  const [admitForm, setAdmitForm] = useState({
    patient: '',
    doctor: '',
    ward: '',
    bed: '',
    admittingDiagnosis: '',
    reasonForAdmission: '',
  });

  // Daily note form
  const [noteForm, setNoteForm] = useState({
    note: '',
    bloodPressure: '120/80',
    pulse: 74,
    temperature: 98.6,
    spO2: 99,
  });

  // Discharge form
  const [dischargeForm, setDischargeForm] = useState({
    dischargeCondition: 'Stable & Improved',
    summary: 'Patient treated for condition, vitals stable on discharge.',
    instructions: 'Take prescribed discharge medications, avoid strenuous activity for 7 days.',
    followUpAdvice: 'Follow up in OPD after 1 week.',
  });

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const res = await admissionApi.getAll({ search, status: statusFilter });
      if (res.data.success) {
        setAdmissions(res.data.admissions);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [patRes, docRes, wardRes] = await Promise.all([
        patientApi.getAll({ limit: 100 }),
        doctorApi.getAll(),
        wardBedApi.getWards(),
      ]);
      if (patRes.data.success) setPatients(patRes.data.patients);
      if (docRes.data.success) setDoctors(docRes.data.doctors);
      if (wardRes.data.success) setWards(wardRes.data.wards);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchAdmissions, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // When Ward selected in Admit form, fetch Available beds in that ward!
  useEffect(() => {
    const fetchBeds = async () => {
      if (admitForm.ward) {
        try {
          const res = await wardBedApi.getBeds({ ward: admitForm.ward, status: 'Available' });
          if (res.data.success) {
            setAvailableBeds(res.data.beds);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setAvailableBeds([]);
      }
    };
    fetchBeds();
  }, [admitForm.ward]);

  const handleAdmitPatient = async (e) => {
    e.preventDefault();
    if (!admitForm.bed) {
      showToast('Please allocate an available bed', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await admissionApi.create(admitForm);
      if (res.data.success) {
        showToast('Patient admitted successfully and bed allocated!', 'success');
        setIsAdmitModalOpen(false);
        fetchAdmissions();
        setAdmitForm({ patient: '', doctor: '', ward: '', bed: '', admittingDiagnosis: '', reasonForAdmission: '' });
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDailyNote = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        note: noteForm.note,
        vitals: {
          bloodPressure: noteForm.bloodPressure,
          pulse: Number(noteForm.pulse),
          temperature: Number(noteForm.temperature),
          spO2: Number(noteForm.spO2),
        },
      };

      const res = await admissionApi.addDailyNote(selectedAdmission._id, payload);
      if (res.data.success) {
        showToast('Clinical care note recorded!', 'success');
        setIsNoteModalOpen(false);
        fetchAdmissions();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischargePatient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await admissionApi.discharge(selectedAdmission._id, dischargeForm);
      if (res.data.success) {
        showToast('Patient discharged and bed returned to Available status!', 'success');
        setIsDischargeModalOpen(false);
        fetchAdmissions();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <DoorOpen className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inpatient Admissions (IPD)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage patient admissions, allocated beds, daily nurse rounds, and discharge summaries.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsAdmitModalOpen(true)}>
          Admit Patient
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by Admission ID, Ward, or Patient..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-2">
          {['Admitted', 'Discharged', ''].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st ? (st === 'Admitted' ? 'Active Inpatients' : 'Discharged') : 'All History'}
            </button>
          ))}
        </div>
      </div>

      {/* Admissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <p className="mt-2 text-xs text-slate-400">Loading inpatient records...</p>
          </div>
        ) : admissions.length === 0 ? (
          <div className="py-20 text-center">
            <DoorOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No admission records found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Admission ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Ward & Bed</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Admission Date</th>
                  <th className="py-3 px-4">Diagnosis</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {admissions.map((adm) => (
                  <tr key={adm._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary-600">{adm.admissionId}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {adm.patient?.firstName} {adm.patient?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500">ID: {adm.patient?.patientId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-primary-600" />
                        <span>Bed {adm.bed?.bedNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{adm.ward?.name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      Dr. {adm.doctor?.user?.firstName} {adm.doctor?.user?.lastName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{formatDate(adm.admissionDate)}</div>
                      {adm.dischargeDate && (
                        <div className="text-[11px] text-slate-400">Discharged: {formatDate(adm.dischargeDate)}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium max-w-xs truncate">
                      {adm.admittingDiagnosis}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={adm.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {adm.status === 'Admitted' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setIsNoteModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                            >
                              Add Note
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setIsDischargeModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors"
                            >
                              Discharge
                            </button>
                          </>
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

      {/* Admit Patient Modal */}
      <Modal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        title="Patient Hospital Admission"
        subtitle="Allocate inpatient ward and available bed"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleAdmitPatient} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
              <select
                required
                value={admitForm.patient}
                onChange={(e) => setAdmitForm((prev) => ({ ...prev, patient: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">Choose Patient</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.firstName} {p.lastName} ({p.patientId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Doctor *</label>
              <select
                required
                value={admitForm.doctor}
                onChange={(e) => setAdmitForm((prev) => ({ ...prev, doctor: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">Choose Doctor</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    Dr. {d.user?.firstName} {d.user?.lastName} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Ward *</label>
              <select
                required
                value={admitForm.ward}
                onChange={(e) => setAdmitForm((prev) => ({ ...prev, ward: e.target.value, bed: '' }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">Choose Ward</option>
                {wards.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Bed * ({availableBeds.length} ready)
              </label>
              <select
                required
                disabled={!admitForm.ward}
                value={admitForm.bed}
                onChange={(e) => setAdmitForm((prev) => ({ ...prev, bed: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:bg-slate-100"
              >
                <option value="">{admitForm.ward ? 'Select Available Bed' : 'Select Ward First'}</option>
                {availableBeds.map((b) => (
                  <option key={b._id} value={b._id}>
                    Bed {b.bedNumber} ({b.features?.join(', ') || 'Standard'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admitting Clinical Diagnosis *</label>
            <input
              type="text"
              required
              value={admitForm.admittingDiagnosis}
              onChange={(e) => setAdmitForm((prev) => ({ ...prev, admittingDiagnosis: e.target.value }))}
              placeholder="e.g. Acute Appendicitis / Post-Op Care"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Inpatient Admission</label>
            <textarea
              rows={2}
              value={admitForm.reasonForAdmission}
              onChange={(e) => setAdmitForm((prev) => ({ ...prev, reasonForAdmission: e.target.value }))}
              placeholder="Surgical prep, IV monitoring, observation..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAdmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Admit & Allocate Bed
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Daily Care Note Modal */}
      {selectedAdmission && (
        <Modal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          title="Record Daily Clinical Care Note"
          subtitle={`Admission: ${selectedAdmission.admissionId} • Bed: ${selectedAdmission.bed?.bedNumber}`}
        >
          <form onSubmit={handleAddDailyNote} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500">BP (mmHg)</label>
                <input
                  type="text"
                  value={noteForm.bloodPressure}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, bloodPressure: e.target.value }))}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500">Pulse (bpm)</label>
                <input
                  type="number"
                  value={noteForm.pulse}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, pulse: e.target.value }))}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={noteForm.temperature}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, temperature: e.target.value }))}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500">SpO2 (%)</label>
                <input
                  type="number"
                  value={noteForm.spO2}
                  onChange={(e) => setNoteForm((prev) => ({ ...prev, spO2: e.target.value }))}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nurse / Doctor Round Note *</label>
              <textarea
                rows={3}
                required
                value={noteForm.note}
                onChange={(e) => setNoteForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Patient condition, medication response, IV fluids intake/output..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNoteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Save Care Note
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Discharge Patient Modal */}
      {selectedAdmission && (
        <Modal
          isOpen={isDischargeModalOpen}
          onClose={() => setIsDischargeModalOpen(false)}
          title="Patient Hospital Discharge"
          subtitle={`Discharge summary & automatic bed liberation for Admission ${selectedAdmission.admissionId}`}
        >
          <form onSubmit={handleDischargePatient} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Condition on Discharge</label>
              <select
                value={dischargeForm.dischargeCondition}
                onChange={(e) => setDischargeForm((prev) => ({ ...prev, dischargeCondition: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="Stable & Improved">Stable & Improved</option>
                <option value="Cured / Recovered">Cured / Recovered</option>
                <option value="Transferred to Higher Center">Transferred to Higher Center</option>
                <option value="Discharged Against Medical Advice (LAMA)">Discharged Against Medical Advice (LAMA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Summary *</label>
              <textarea
                rows={2}
                required
                value={dischargeForm.summary}
                onChange={(e) => setDischargeForm((prev) => ({ ...prev, summary: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discharge Instructions & Medication Advice</label>
              <textarea
                rows={2}
                value={dischargeForm.instructions}
                onChange={(e) => setDischargeForm((prev) => ({ ...prev, instructions: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-Up Schedule</label>
              <input
                type="text"
                value={dischargeForm.followUpAdvice}
                onChange={(e) => setDischargeForm((prev) => ({ ...prev, followUpAdvice: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDischargeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" loading={submitting}>
                Confirm Discharge & Free Bed
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
