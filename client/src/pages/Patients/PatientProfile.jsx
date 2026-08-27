import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  DoorOpen,
  Receipt,
  Upload,
  Phone,
  Mail,
  MapPin,
  Shield,
  HeartPulse,
  AlertTriangle,
  Printer,
  PlusCircle,
} from 'lucide-react';
import { patientApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Tabs } from '../../components/common/Tabs';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import { useHospitalConfig } from '../../context/HospitalConfigContext';
import { useNotification } from '../../context/NotificationContext';

export const PatientProfile = () => {
  const { id } = useParams();
  const { formatCurrency } = useHospitalConfig();
  const { showToast } = useNotification();

  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Document upload modal state
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchPatientProfile = async () => {
    setLoading(true);
    try {
      const res = await patientApi.getById(id);
      if (res.data.success) {
        setPatientData(res.data);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientProfile();
  }, [id]);

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile) {
      showToast('Please select a file to upload', 'warning');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', docTitle || docFile.name);
      formData.append('file', docFile);

      const res = await patientApi.uploadDocument(patientData.patient._id, formData);
      if (res.data.success) {
        showToast('Document uploaded successfully!', 'success');
        setDocModalOpen(false);
        setDocTitle('');
        setDocFile(null);
        fetchPatientProfile();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        <p className="mt-2 text-xs text-slate-400">Loading comprehensive 360° patient file...</p>
      </div>
    );
  }

  if (!patientData || !patientData.patient) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-bold text-slate-800">Patient not found</h2>
        <Link to="/patients" className="mt-2 inline-block text-xs text-primary-600 font-semibold">
          ← Back to Patients Directory
        </Link>
      </div>
    );
  }

  const patient = patientData.patient;
  const records = patientData.records || {};

  const profileTabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'emr', label: 'EMR / Medical Records', icon: FileText, badge: records.medicalRecords?.length },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill, badge: records.prescriptions?.length },
    { id: 'lab', label: 'Laboratory Reports', icon: FlaskConical, badge: records.labReports?.length },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badge: records.appointments?.length },
    { id: 'admissions', label: 'Admissions & Beds', icon: DoorOpen, badge: records.admissions?.length },
    { id: 'billing', label: 'Billing History', icon: Receipt, badge: records.invoices?.length },
    { id: 'documents', label: 'Clinical Documents', icon: Upload, badge: patient.documents?.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/patients"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Patients Directory
        </Link>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" icon={Upload} onClick={() => setDocModalOpen(true)}>
            Upload Document
          </Button>
          <Link to={`/billing/create?patientId=${patient._id}`}>
            <Button variant="primary" size="sm" icon={Receipt}>
              Create Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Patient Header 360 Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {patient.firstName} {patient.lastName}
                </h1>
                <Badge status={patient.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                <span className="font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                  {patient.patientId}
                </span>
                <span>
                  {patient.age} yrs • {patient.gender}
                </span>
                <span>DOB: {formatDate(patient.dateOfBirth)}</span>
                <span className="inline-flex items-center font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  Blood Group: {patient.bloodGroup}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Contact & Insurance Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">{patient.phone}</span>
            </div>
            {patient.email && (
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">{patient.email}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
              <Shield className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-slate-600">
                Insurance: <strong className="text-slate-800">{patient.insurance?.provider || 'Self-Pay'}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <Tabs tabs={profileTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Dynamic Tab Content */}
      <div className="mt-4">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clinical Alerts & Allergies */}
            <div className="lg:col-span-2 space-y-6">
              {/* Allergy Alert Card */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-5">
                <div className="flex items-center space-x-2 text-rose-900 font-bold text-sm mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Clinical Allergies & Sensitivities</span>
                </div>
                {patient.allergies?.length === 0 ? (
                  <p className="text-xs text-rose-700">No known allergies recorded.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-white border border-rose-300 text-rose-800 rounded-lg text-xs font-bold shadow-sm"
                      >
                        ⚠️ {allergy}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Chronic Medical Conditions */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                  <HeartPulse className="w-4 h-4 mr-2 text-primary-600" />
                  Chronic Medical History
                </h3>
                {patient.medicalHistory?.length === 0 ? (
                  <p className="text-xs text-slate-400">No past chronic illnesses on record.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {patient.medicalHistory.map((h, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">{h.condition}</div>
                          {h.notes && <div className="text-[11px] text-slate-500">{h.notes}</div>}
                        </div>
                        <span className="text-slate-400">{formatDate(h.diagnosedDate)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Active Medications */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                  <Pill className="w-4 h-4 mr-2 text-primary-600" />
                  Current Medications
                </h3>
                {patient.currentMedications?.length === 0 ? (
                  <p className="text-xs text-slate-400">No active continuous medications.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {patient.currentMedications.map((m, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">{m.name}</div>
                          <div className="text-[11px] text-slate-500">{m.frequency}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded">
                          {m.dosage}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Demographics & Emergency */}
            <div className="space-y-6">
              {/* Emergency Contact */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Emergency Contact
                </h3>
                <div className="text-xs space-y-1.5">
                  <div className="font-bold text-slate-900 text-sm">
                    {patient.emergencyContact?.name || 'Not provided'}
                  </div>
                  <div className="text-slate-500">
                    Relationship: <strong className="text-slate-700">{patient.emergencyContact?.relationship || '—'}</strong>
                  </div>
                  <div className="text-slate-500">
                    Phone: <strong className="text-slate-700">{patient.emergencyContact?.phone || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Residential Address */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Address & Residence
                </h3>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>{patient.address?.street || 'No street address provided'}</div>
                  <div>
                    {patient.address?.city} {patient.address?.state} {patient.address?.postalCode}
                  </div>
                  <div>{patient.address?.country}</div>
                </div>
              </div>

              {/* Insurance Details */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Insurance Information
                </h3>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-slate-400">Provider:</span>{' '}
                    <span className="font-bold text-slate-800">{patient.insurance?.provider || 'Self Pay'}</span>
                  </div>
                  {patient.insurance?.policyNumber && (
                    <div>
                      <span className="text-slate-400">Policy Number:</span>{' '}
                      <span className="font-mono text-slate-800">{patient.insurance?.policyNumber}</span>
                    </div>
                  )}
                  {patient.insurance?.coverageAmount > 0 && (
                    <div>
                      <span className="text-slate-400">Coverage Limit:</span>{' '}
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(patient.insurance?.coverageAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMR & MEDICAL RECORDS */}
        {activeTab === 'emr' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Chronological Medical Records</h2>
              <Link to={`/medical-records?patientId=${patient._id}`}>
                <Button size="sm" variant="primary" icon={PlusCircle}>
                  New Clinical Encounter
                </Button>
              </Link>
            </div>

            {records.medicalRecords?.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No medical records created yet.</p>
              </div>
            ) : (
              records.medicalRecords.map((record) => (
                <div key={record._id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-card space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-primary-600 font-mono">{record.recordId}</span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{record.diagnosis}</h3>
                      <p className="text-xs text-slate-500">
                        Attending: Dr. {record.doctor?.user?.firstName} {record.doctor?.user?.lastName} • ICD:{' '}
                        {record.icdCode || 'N/A'}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(record.visitDate, true)}</span>
                  </div>

                  {/* Vitals Grid */}
                  {record.vitals && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-lg text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Blood Pressure</span>
                        <strong className="text-slate-800">{record.vitals.bloodPressure || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Pulse</span>
                        <strong className="text-slate-800">{record.vitals.pulse ? `${record.vitals.pulse} bpm` : '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Temperature</span>
                        <strong className="text-slate-800">{record.vitals.temperature ? `${record.vitals.temperature} °F` : '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">SpO2</span>
                        <strong className="text-slate-800">{record.vitals.spO2 ? `${record.vitals.spO2}%` : '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Weight / Height</span>
                        <strong className="text-slate-800">
                          {record.vitals.weight ? `${record.vitals.weight}kg` : '—'} / {record.vitals.height ? `${record.vitals.height}cm` : '—'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">BMI</span>
                        <strong className="text-slate-800">{record.vitals.bmi || '—'}</strong>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Chief Complaint & Symptoms:</span>
                      <p className="text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        {record.chiefComplaint}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Treatment Plan & Observations:</span>
                      <p className="text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                        {record.treatmentPlan}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Prescription Pad History</h2>
              <Link to="/prescriptions">
                <Button size="sm" variant="primary" icon={PlusCircle}>
                  New Prescription
                </Button>
              </Link>
            </div>

            {records.prescriptions?.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No prescriptions issued yet.</p>
              </div>
            ) : (
              records.prescriptions.map((rx) => (
                <div key={rx._id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-card space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-primary-600 font-mono">{rx.prescriptionId}</span>
                      <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                        Prescribed by Dr. {rx.doctor?.user?.firstName} {rx.doctor?.user?.lastName}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge status={rx.status} />
                      <span className="text-xs text-slate-400">{formatDate(rx.date)}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                          <th className="py-2 px-3">Medicine Name</th>
                          <th className="py-2 px-3">Dosage</th>
                          <th className="py-2 px-3">Frequency</th>
                          <th className="py-2 px-3">Duration</th>
                          <th className="py-2 px-3">Instructions</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rx.medicines?.map((m, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-semibold text-slate-800">{m.name}</td>
                            <td className="py-2 px-3">{m.dosage}</td>
                            <td className="py-2 px-3">{m.frequency}</td>
                            <td className="py-2 px-3">{m.duration}</td>
                            <td className="py-2 px-3 text-slate-500">{m.instructions}</td>
                            <td className="py-2 px-3">
                              <Badge status={m.dispenseStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rx.generalAdvice && (
                    <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>General Advice:</strong> {rx.generalAdvice}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: LABORATORY REPORTS */}
        {activeTab === 'lab' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Diagnostic Laboratory Reports</h2>
              <Link to="/laboratory">
                <Button size="sm" variant="primary" icon={PlusCircle}>
                  Request Lab Test
                </Button>
              </Link>
            </div>

            {records.labReports?.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No laboratory test records available.</p>
              </div>
            ) : (
              records.labReports.map((report) => (
                <div key={report._id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-card space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-primary-600 font-mono">{report.reportId}</span>
                      <h3 className="text-sm font-bold text-slate-800 mt-0.5">{report.test?.testName}</h3>
                      <p className="text-xs text-slate-400">Category: {report.test?.category}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge status={report.status} />
                      <span className="text-xs text-slate-400">{formatDate(report.requestedDate)}</span>
                    </div>
                  </div>

                  {report.results && report.results.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                            <th className="py-2 px-3">Parameter</th>
                            <th className="py-2 px-3">Observed Value</th>
                            <th className="py-2 px-3">Unit</th>
                            <th className="py-2 px-3">Reference Range</th>
                            <th className="py-2 px-3">Interpretation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {report.results.map((r, i) => (
                            <tr key={i} className={r.flag !== 'Normal' ? 'bg-rose-50/50' : ''}>
                              <td className="py-2 px-3 font-semibold text-slate-800">{r.parameter}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{r.value || 'Pending'}</td>
                              <td className="py-2 px-3 text-slate-500">{r.unit}</td>
                              <td className="py-2 px-3 text-slate-500">{r.normalRange}</td>
                              <td className="py-2 px-3">
                                <Badge status={r.flag} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {report.clinicalImpression && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>Clinical Impression:</strong> {report.clinicalImpression}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Appointment History</h2>
              <Link to="/appointments">
                <Button size="sm" variant="primary" icon={Calendar}>
                  Book Appointment
                </Button>
              </Link>
            </div>
            {records.appointments?.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No appointment records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Appointment ID</th>
                      <th className="py-3 px-4">Doctor</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.appointments.map((apt) => (
                      <tr key={apt._id}>
                        <td className="py-3 px-4 font-mono font-bold text-primary-600">{apt.appointmentId}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{apt.department?.name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatDate(apt.appointmentDate)} • {apt.timeSlot}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{apt.type}</td>
                        <td className="py-3 px-4">
                          <Badge status={apt.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ADMISSIONS */}
        {activeTab === 'admissions' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Inpatient Admission Records</h2>
            {records.admissions?.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
                No inpatient admission history for this patient.
              </div>
            ) : (
              records.admissions.map((adm) => (
                <div key={adm._id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-card space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-primary-600 font-mono">{adm.admissionId}</span>
                      <h3 className="text-sm font-bold text-slate-800 mt-0.5">{adm.admittingDiagnosis}</h3>
                      <p className="text-xs text-slate-500">
                        Ward: {adm.ward?.name} • Bed: <strong className="text-slate-800">{adm.bed?.bedNumber}</strong>
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge status={adm.status} />
                      <span className="text-xs text-slate-400">
                        {formatDate(adm.admissionDate)} → {adm.dischargeDate ? formatDate(adm.dischargeDate) : 'Ongoing'}
                      </span>
                    </div>
                  </div>

                  {adm.dailyCareNotes && adm.dailyCareNotes.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-2">Daily Nurse Logs & Vitals:</span>
                      <div className="space-y-2">
                        {adm.dailyCareNotes.map((note, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-lg text-xs border border-slate-100">
                            <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                              <span>Recorded Care Note</span>
                              <span>{formatDate(note.recordedAt, true)}</span>
                            </div>
                            <p className="text-slate-700">{note.note}</p>
                            {note.vitals && (
                              <div className="mt-2 text-[11px] text-slate-500 flex gap-3">
                                <span>BP: {note.vitals.bloodPressure || '—'}</span>
                                <span>Pulse: {note.vitals.pulse} bpm</span>
                                <span>Temp: {note.vitals.temperature} °F</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 7: BILLING & INVOICES */}
        {activeTab === 'billing' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Hospital Billing & Payments</h2>
              <Link to={`/billing/create?patientId=${patient._id}`}>
                <Button size="sm" variant="primary" icon={Receipt}>
                  Create New Bill
                </Button>
              </Link>
            </div>

            {records.invoices?.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No invoices issued for this patient.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Billing Date</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Paid Amount</th>
                      <th className="py-3 px-4">Due Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td className="py-3 px-4 font-mono font-bold text-primary-600">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(inv.billingDate)}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                        <td className="py-3 px-4 font-medium text-emerald-600">{formatCurrency(inv.paidAmount)}</td>
                        <td className="py-3 px-4 font-bold text-rose-600">{formatCurrency(inv.dueAmount)}</td>
                        <td className="py-3 px-4">
                          <Badge status={inv.paymentStatus} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/billing/invoices/${inv._id}`}
                            className="inline-flex items-center px-2.5 py-1.5 rounded bg-slate-100 hover:bg-primary-50 text-slate-700 hover:text-primary-700 text-xs font-semibold"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            View Bill
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Uploaded Clinical Documents</h2>
              <Button size="sm" variant="primary" icon={Upload} onClick={() => setDocModalOpen(true)}>
                Upload Document
              </Button>
            </div>

            {patient.documents?.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
                No clinical files or scans uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {patient.documents.map((doc, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-card flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-primary-600 mb-1">
                        <FileText className="w-5 h-5" />
                        <h4 className="font-bold text-sm text-slate-800 truncate">{doc.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400">Uploaded: {formatDate(doc.uploadedAt, true)}</p>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 text-xs font-semibold text-primary-600 hover:underline inline-flex items-center"
                    >
                      Open Document ↗
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Upload Modal */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Upload Patient Document"
        subtitle="Attach medical scans, discharge summaries, or IDs"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title *</label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Chest X-Ray Scan, Discharge Summary"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (PDF, Image, Doc) *</label>
            <input
              type="file"
              required
              onChange={(e) => setDocFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setDocModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={uploading}>
              Upload File
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
