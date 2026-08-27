import React, { useState, useEffect } from 'react';
import { Pill, Plus, Search, Printer, CheckCircle, Clock, Trash2, User, Stethoscope } from 'lucide-react';
import { prescriptionApi, patientApi, doctorApi, pharmacyApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

export const PrescriptionList = () => {
  const { showToast } = useNotification();
  const { settings } = useHospitalConfig();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dropdown dependencies
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableMeds, setAvailableMeds] = useState([]);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    diagnosis: '',
    generalAdvice: 'Drink plenty of fluids and rest. Follow prescription schedule carefully.',
    medicines: [
      { medicine: '', name: '', dosage: '500mg', frequency: '1-0-1 (After meals)', duration: '5 days', instructions: 'Take with water', quantity: 10 },
    ],
  });

  // Print Prescription Modal
  const [selectedRxToPrint, setSelectedRxToPrint] = useState(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await prescriptionApi.getAll({ search, status: statusFilter });
      if (res.data.success) {
        setPrescriptions(res.data.prescriptions);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [patRes, docRes, medRes] = await Promise.all([
        patientApi.getAll({ limit: 100 }),
        doctorApi.getAll(),
        pharmacyApi.getMedicines({ limit: 100 }),
      ]);
      if (patRes.data.success) setPatients(patRes.data.patients);
      if (docRes.data.success) setDoctors(docRes.data.doctors);
      if (medRes.data.success) setAvailableMeds(medRes.data.medicines);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchPrescriptions, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleAddMedicineRow = () => {
    setFormData((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { medicine: '', name: '', dosage: '1 Tab', frequency: '1-0-1', duration: '5 days', instructions: 'After meals', quantity: 10 },
      ],
    }));
  };

  const handleRemoveMedicineRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...formData.medicines];
    updated[index][field] = value;

    // If selecting an existing medicine from catalog, auto-fill name
    if (field === 'medicine') {
      const found = availableMeds.find((m) => m._id === value);
      if (found) {
        updated[index].name = found.name;
        updated[index].dosage = found.strength || '1 Tab';
      }
    }

    setFormData((prev) => ({ ...prev, medicines: updated }));
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (formData.medicines.some((m) => !m.name)) {
      showToast('Please specify a medicine name for all rows', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await prescriptionApi.create(formData);
      if (res.data.success) {
        showToast('Prescription issued successfully!', 'success');
        setIsModalOpen(false);
        fetchPrescriptions();
        setFormData({
          patient: '',
          doctor: '',
          diagnosis: '',
          generalAdvice: 'Drink plenty of fluids and rest. Follow prescription schedule carefully.',
          medicines: [
            { medicine: '', name: '', dosage: '500mg', frequency: '1-0-1 (After meals)', duration: '5 days', instructions: 'Take with water', quantity: 10 },
          ],
        });
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispense = async (prescriptionId) => {
    try {
      const res = await prescriptionApi.dispense(prescriptionId, {});
      if (res.data.success) {
        showToast('Medicines dispensed and stock deducted!', 'success');
        fetchPrescriptions();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Pill className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Prescriptions Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Digital prescription pad, pharmacist dispensing queue, and medication records.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Prescription
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by Prescription ID, Diagnosis, or Medicine..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-2">
          {['', 'Pending', 'Dispensed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st || 'All Prescriptions'}
            </button>
          ))}
        </div>
      </div>

      {/* Prescriptions List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="mt-2 text-xs text-slate-400">Loading prescriptions...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-slate-200">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No prescriptions found</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div
              key={rx._id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                      {rx.prescriptionId}
                    </span>
                    <Badge status={rx.status} />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                    Patient: {rx.patient?.firstName} {rx.patient?.lastName} ({rx.patient?.patientId})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dr. {rx.doctor?.user?.firstName} {rx.doctor?.user?.lastName} ({rx.doctor?.department?.name}) • Diagnosis:{' '}
                    <strong>{rx.diagnosis || 'Clinical Prescription'}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 mr-2">{formatDate(rx.date, true)}</span>
                  {rx.status === 'Pending' && (
                    <Button variant="success" size="sm" icon={CheckCircle} onClick={() => handleDispense(rx._id)}>
                      Dispense Medicines
                    </Button>
                  )}
                  <Button variant="outline" size="sm" icon={Printer} onClick={() => setSelectedRxToPrint(rx)}>
                    Print Rx
                  </Button>
                </div>
              </div>

              {/* Medicine Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Medicine</th>
                      <th className="py-2.5 px-3">Dosage</th>
                      <th className="py-2.5 px-3">Frequency</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Instructions</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rx.medicines?.map((m, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{m.name}</td>
                        <td className="py-2.5 px-3">{m.dosage}</td>
                        <td className="py-2.5 px-3">{m.frequency}</td>
                        <td className="py-2.5 px-3">{m.duration}</td>
                        <td className="py-2.5 px-3 font-semibold">{m.quantity}</td>
                        <td className="py-2.5 px-3 text-slate-500">{m.instructions}</td>
                        <td className="py-2.5 px-3">
                          <Badge status={m.dispenseStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rx.generalAdvice && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <strong className="text-slate-800">Advice:</strong> {rx.generalAdvice}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Prescription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Medical Prescription"
        subtitle="Specify medications, dosage schedules, and dispensing quantities"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreatePrescription} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
              <select
                required
                value={formData.patient}
                onChange={(e) => setFormData((prev) => ({ ...prev, patient: e.target.value }))}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prescribing Doctor *</label>
              <select
                required
                value={formData.doctor}
                onChange={(e) => setFormData((prev) => ({ ...prev, doctor: e.target.value }))}
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Diagnosis</label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="e.g. Upper Respiratory Tract Infection"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Medicines Dynamic Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800">Prescribed Medications</label>
              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Medication Row
              </button>
            </div>

            <div className="space-y-3">
              {formData.medicines.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Medicine Name / Stock Select</label>
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                        placeholder="Type medicine or select below"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Dosage</label>
                      <input
                        type="text"
                        value={item.dosage}
                        onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                        placeholder="500mg"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Frequency</label>
                      <input
                        type="text"
                        value={item.frequency}
                        onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                        placeholder="1-0-1"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Duration</label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                        placeholder="5 days"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-center pt-3">
                      {formData.medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicineRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                        placeholder="Instructions (e.g. Take after meals with warm water)"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <select
                        onChange={(e) => handleMedicineChange(idx, 'medicine', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-600"
                      >
                        <option value="">Quick select from Pharmacy Stock</option>
                        {availableMeds.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.strength}) - Stock: {m.stockQuantity} {m.unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">General Advice & Dietary Instructions</label>
            <textarea
              rows={2}
              value={formData.generalAdvice}
              onChange={(e) => setFormData((prev) => ({ ...prev, generalAdvice: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Generate Prescription
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Prescription Pad Modal */}
      {selectedRxToPrint && (
        <Modal
          isOpen={!!selectedRxToPrint}
          onClose={() => setSelectedRxToPrint(null)}
          title="Print Prescription Pad"
          subtitle="Official hospital clinical prescription pad"
          maxWidth="max-w-2xl"
          footer={
            <Button variant="primary" size="sm" icon={Printer} onClick={() => window.print()}>
              Print Prescription Pad
            </Button>
          }
        >
          <div className="p-6 bg-white border border-slate-300 rounded-xl space-y-6 text-slate-800 printable-area">
            {/* Header with Hospital Branding */}
            <div className="flex items-center justify-between border-b-2 border-primary-700 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-primary-900 uppercase tracking-tight">
                  {settings.hospitalName}
                </h2>
                <p className="text-xs text-slate-500">{settings.tagline}</p>
                <p className="text-xs text-slate-500">
                  {settings.address?.street}, {settings.address?.city} • Ph: {settings.phone}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800">
                  Dr. {selectedRxToPrint.doctor?.user?.firstName} {selectedRxToPrint.doctor?.user?.lastName}
                </div>
                <div className="text-xs text-primary-700 font-semibold">
                  {selectedRxToPrint.doctor?.specialization}
                </div>
                <div className="text-[11px] text-slate-500">{selectedRxToPrint.doctor?.department?.name}</div>
              </div>
            </div>

            {/* Patient Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">PATIENT NAME</span>
                <strong>
                  {selectedRxToPrint.patient?.firstName} {selectedRxToPrint.patient?.lastName}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PATIENT ID</span>
                <strong className="font-mono">{selectedRxToPrint.patient?.patientId}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">AGE / GENDER</span>
                <strong>
                  {selectedRxToPrint.patient?.age} yrs / {selectedRxToPrint.patient?.gender}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">DATE</span>
                <strong>{formatDate(selectedRxToPrint.date)}</strong>
              </div>
            </div>

            {/* Rx Symbol & Medication Body */}
            <div>
              <div className="text-2xl font-serif font-black text-primary-800 mb-3">℞</div>
              <div className="space-y-4">
                {selectedRxToPrint.medicines?.map((m, i) => (
                  <div key={i} className="border-b border-slate-100 pb-2">
                    <div className="flex justify-between font-bold text-sm text-slate-900">
                      <span>
                        {i + 1}. {m.name} — {m.dosage}
                      </span>
                      <span className="text-xs font-mono text-slate-500">Qty: {m.quantity}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Schedule: <strong className="text-primary-800">{m.frequency}</strong> for {m.duration} •{' '}
                      <em>{m.instructions}</em>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedRxToPrint.generalAdvice && (
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-700">
                <strong>Advice & Instructions:</strong> {selectedRxToPrint.generalAdvice}
              </div>
            )}

            {/* Signature Area */}
            <div className="pt-8 flex justify-between items-end border-t border-slate-200">
              <div className="text-[10px] text-slate-400">
                Prescription ID: {selectedRxToPrint.prescriptionId} • Generated via CarePulse HMS
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Doctor's Signature</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
