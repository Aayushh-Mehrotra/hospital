import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Stethoscope, HeartPulse, User, Calendar } from 'lucide-react';
import { medicalRecordApi, patientApi, doctorApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export const MedicalRecordList = () => {
  const { showToast } = useNotification();
  const { user } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    chiefComplaint: '',
    symptoms: '',
    bloodPressure: '120/80',
    pulse: 72,
    temperature: 98.6,
    spO2: 99,
    respiratoryRate: 16,
    weight: 70,
    height: 175,
    diagnosis: '',
    icdCode: '',
    treatmentPlan: '',
    clinicalNotes: '',
    followUpDate: '',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await medicalRecordApi.getAll({ search });
      if (res.data.success) {
        setRecords(res.data.records);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        patientApi.getAll({ limit: 100 }),
        doctorApi.getAll(),
      ]);
      if (patRes.data.success) setPatients(patRes.data.patients);
      if (docRes.data.success) setDoctors(docRes.data.doctors);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchRecords, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Live BMI Calculation Preview
  const calculateBMI = () => {
    if (formData.weight && formData.height) {
      const hM = Number(formData.height) / 100;
      return (Number(formData.weight) / (hM * hM)).toFixed(1);
    }
    return '—';
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        patient: formData.patient,
        doctor: formData.doctor || (doctors[0] ? doctors[0]._id : null),
        chiefComplaint: formData.chiefComplaint,
        symptoms: formData.symptoms ? formData.symptoms.split(',').map((s) => s.trim()) : [],
        vitals: {
          bloodPressure: formData.bloodPressure,
          pulse: Number(formData.pulse),
          temperature: Number(formData.temperature),
          spO2: Number(formData.spO2),
          respiratoryRate: Number(formData.respiratoryRate),
          weight: Number(formData.weight),
          height: Number(formData.height),
        },
        diagnosis: formData.diagnosis,
        icdCode: formData.icdCode,
        treatmentPlan: formData.treatmentPlan,
        clinicalNotes: formData.clinicalNotes,
        followUpDate: formData.followUpDate || null,
      };

      const res = await medicalRecordApi.create(payload);
      if (res.data.success) {
        showToast('Medical record recorded successfully!', 'success');
        setIsModalOpen(false);
        fetchRecords();
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
            <FileText className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Electronic Medical Records (EMR)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain clinical encounters, diagnostic evaluations, vital signs, and treatment plans.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Clinical Encounter
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by Diagnosis, Complaint, or EMR ID..."
          className="w-full md:w-96"
        />
      </div>

      {/* Records List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="mt-2 text-xs text-slate-400">Loading medical records...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No medical records found</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec._id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 font-bold flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                        {rec.recordId}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm">{rec.diagnosis}</h3>
                      {rec.icdCode && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          ICD: {rec.icdCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Patient:{' '}
                      <strong className="text-slate-800">
                        {rec.patient?.firstName} {rec.patient?.lastName} ({rec.patient?.patientId})
                      </strong>{' '}
                      • Attending: Dr. {rec.doctor?.user?.firstName} {rec.doctor?.user?.lastName}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-slate-400 font-medium">{formatDate(rec.visitDate, true)}</span>
              </div>

              {/* Vitals Ribbon */}
              {rec.vitals && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-slate-50 p-2.5 rounded-xl my-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blood Pressure</span>
                    <strong className="text-slate-800">{rec.vitals.bloodPressure || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pulse Rate</span>
                    <strong className="text-slate-800">{rec.vitals.pulse ? `${rec.vitals.pulse} bpm` : '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Temperature</span>
                    <strong className="text-slate-800">{rec.vitals.temperature ? `${rec.vitals.temperature} °F` : '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Oxygen (SpO2)</span>
                    <strong className="text-slate-800">{rec.vitals.spO2 ? `${rec.vitals.spO2}%` : '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Resp. Rate</span>
                    <strong className="text-slate-800">{rec.vitals.respiratoryRate ? `${rec.vitals.respiratoryRate}/m` : '—'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Weight / Height</span>
                    <strong className="text-slate-800">
                      {rec.vitals.weight || '—'}kg / {rec.vitals.height || '—'}cm
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">BMI</span>
                    <strong className="text-slate-800">{rec.vitals.bmi || '—'}</strong>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-2">
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Chief Complaint & Symptoms:</span>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                    {rec.chiefComplaint}
                    {rec.symptoms && rec.symptoms.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rec.symptoms.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600">
                            • {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Treatment Plan & Observations:</span>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                    {rec.treatmentPlan}
                    {rec.followUpDate && (
                      <div className="mt-1 text-[11px] text-primary-700 font-semibold">
                        Follow-up scheduled: {formatDate(rec.followUpDate)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New EMR Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Clinical Encounter (EMR)"
        subtitle="Patient diagnostic record and vital parameters"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateRecord} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
              <select
                required
                name="patient"
                value={formData.patient}
                onChange={handleInputChange}
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
                name="doctor"
                value={formData.doctor}
                onChange={handleInputChange}
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

          {/* Vitals Input Grid */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-2">Patient Vitals & Biometrics</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">BP (mmHg)</label>
                <input
                  type="text"
                  name="bloodPressure"
                  value={formData.bloodPressure}
                  onChange={handleInputChange}
                  placeholder="120/80"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Pulse (bpm)</label>
                <input
                  type="number"
                  name="pulse"
                  value={formData.pulse}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">SpO2 (%)</label>
                <input
                  type="number"
                  name="spO2"
                  value={formData.spO2}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between px-3 py-1 bg-primary-50 border border-primary-100 rounded text-xs">
                <span className="text-primary-800 font-semibold">Calculated BMI:</span>
                <strong className="text-primary-900 font-bold text-sm">{calculateBMI()}</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosis *</label>
              <input
                type="text"
                required
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                placeholder="e.g. Acute Bronchitis"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ICD-10 Code</label>
              <input
                type="text"
                name="icdCode"
                value={formData.icdCode}
                onChange={handleInputChange}
                placeholder="e.g. J20.9"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint *</label>
            <textarea
              rows={2}
              required
              name="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={handleInputChange}
              placeholder="Presenting symptoms and duration..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Plan & Orders *</label>
            <textarea
              rows={2}
              required
              name="treatmentPlan"
              value={formData.treatmentPlan}
              onChange={handleInputChange}
              placeholder="Medications, recommended tests, lifestyle guidance..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Date</label>
            <input
              type="date"
              name="followUpDate"
              value={formData.followUpDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Save EMR Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
