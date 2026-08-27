import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, Search, CheckCircle, Clock, Printer, FileText, AlertCircle } from 'lucide-react';
import { laboratoryApi, patientApi, doctorApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { formatDate } from '../../utils/formatters';
import { useNotification } from '../../context/NotificationContext';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

export const LabManagement = () => {
  const { showToast } = useNotification();
  const { formatCurrency, settings } = useHospitalConfig();

  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dropdowns
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Request form state
  const [requestData, setRequestData] = useState({
    patient: '',
    doctor: '',
    test: '',
    priority: 'Normal',
  });

  // Result entry form state
  const [resultData, setResultData] = useState({
    results: [],
    clinicalImpression: '',
    remarks: '',
  });

  // Print Report Modal
  const [selectedReportToPrint, setSelectedReportToPrint] = useState(null);

  const fetchLabData = async () => {
    setLoading(true);
    try {
      const [repRes, testRes] = await Promise.all([
        laboratoryApi.getReports({ search, status: statusFilter }),
        laboratoryApi.getTests(),
      ]);
      if (repRes.data.success) setReports(repRes.data.reports);
      if (testRes.data.success) setTests(testRes.data.tests);
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
    const timer = setTimeout(fetchLabData, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleRequestTest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await laboratoryApi.requestTest(requestData);
      if (res.data.success) {
        showToast('Laboratory test requested successfully!', 'success');
        setIsRequestModalOpen(false);
        fetchLabData();
        setRequestData({ patient: '', doctor: '', test: '', priority: 'Normal' });
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openResultModal = (report) => {
    setSelectedReport(report);
    setResultData({
      results: (report.results || []).map((r) => ({
        parameter: r.parameter,
        value: r.value || '',
        unit: r.unit || '',
        normalRange: r.normalRange || '',
        flag: r.flag || 'Normal',
      })),
      clinicalImpression: report.clinicalImpression || '',
      remarks: report.remarks || '',
    });
    setIsResultModalOpen(true);
  };

  const handleResultParamChange = (index, field, value) => {
    const updated = [...resultData.results];
    updated[index][field] = value;
    setResultData((prev) => ({ ...prev, results: updated }));
  };

  const handleSaveResults = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        status: 'Completed',
        results: resultData.results,
        clinicalImpression: resultData.clinicalImpression,
        remarks: resultData.remarks,
      };

      const res = await laboratoryApi.updateReport(selectedReport._id, payload);
      if (res.data.success) {
        showToast('Laboratory results recorded and verified!', 'success');
        setIsResultModalOpen(false);
        fetchLabData();
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
            <FlaskConical className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Diagnostic Laboratory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Process test requests, enter verified results with reference ranges, and generate printable reports.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsRequestModalOpen(true)}>
          Request Lab Test
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'reports', label: 'Test Requests & Results', icon: FileText, badge: reports.length },
          { id: 'catalog', label: 'Laboratory Test Catalog', icon: FlaskConical, badge: tests.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by Report ID, Test, or Patient..."
              className="w-full md:w-80"
            />

            <div className="flex items-center gap-2">
              {['', 'Requested', 'Sample Collected', 'Completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === st
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st || 'All Reports'}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                <p className="mt-2 text-xs text-slate-400">Loading lab reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-20 text-center">
                <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No laboratory reports found</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Report ID</th>
                      <th className="py-3 px-4">Test Name</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Requesting Doctor</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {reports.map((report) => (
                      <tr key={report._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary-600">{report.reportId}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{report.test?.testName}</div>
                          <div className="text-[11px] text-slate-500">{report.test?.category}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {report.patient?.firstName} {report.patient?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500">ID: {report.patient?.patientId}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          Dr. {report.doctor?.user?.firstName} {report.doctor?.user?.lastName}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              report.priority === 'STAT (Emergency)' || report.priority === 'Urgent'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {report.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge status={report.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {report.status !== 'Completed' && (
                              <Button variant="primary" size="sm" onClick={() => openResultModal(report)}>
                                Enter Results
                              </Button>
                            )}
                            {report.status === 'Completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                icon={Printer}
                                onClick={() => setSelectedReportToPrint(report)}
                              >
                                Print Report
                              </Button>
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
        </div>
      )}

      {/* TAB 2: TEST CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div
              key={test._id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                      {test.testCode}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1.5">{test.testName}</h3>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    {formatCurrency(test.price)}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <div>
                    Category: <strong className="text-slate-700">{test.category}</strong>
                  </div>
                  <div>
                    Sample: <strong className="text-slate-700">{test.sampleType}</strong>
                  </div>
                  <div>Turnaround: ~{test.turnaroundTimeHours} Hours</div>
                </div>

                {test.parameters && test.parameters.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Parameters Evaluated ({test.parameters.length})
                    </span>
                    <div className="space-y-1 text-xs">
                      {test.parameters.slice(0, 3).map((p, i) => (
                        <div key={i} className="flex justify-between text-slate-600">
                          <span>{p.name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{p.normalRange}</span>
                        </div>
                      ))}
                      {test.parameters.length > 3 && (
                        <span className="text-[10px] text-primary-600 font-semibold block">
                          +{test.parameters.length - 3} more parameters...
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setRequestData((prev) => ({ ...prev, test: test._id }));
                    setIsRequestModalOpen(true);
                  }}
                >
                  Order Test
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Lab Test Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Order Diagnostic Test"
        subtitle="Request laboratory investigation for patient"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleRequestTest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
            <select
              required
              value={requestData.patient}
              onChange={(e) => setRequestData((prev) => ({ ...prev, patient: e.target.value }))}
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Laboratory Test *</label>
            <select
              required
              value={requestData.test}
              onChange={(e) => setRequestData((prev) => ({ ...prev, test: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">Choose Test</option>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.testName} ({t.category}) — {formatCurrency(t.price)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Requesting Doctor *</label>
              <select
                required
                value={requestData.doctor}
                onChange={(e) => setRequestData((prev) => ({ ...prev, doctor: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">Choose Doctor</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    Dr. {d.user?.firstName} {d.user?.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={requestData.priority}
                onChange={(e) => setRequestData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="STAT (Emergency)">STAT (Emergency)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Submit Lab Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enter Test Results Modal */}
      {selectedReport && (
        <Modal
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          title={`Enter Results: ${selectedReport.test?.testName}`}
          subtitle={`Report ID: ${selectedReport.reportId} • Patient: ${selectedReport.patient?.firstName} ${selectedReport.patient?.lastName}`}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSaveResults} className="space-y-4">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Measured Values & Interpretation</span>
              {resultData.results.map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-4">
                    <span className="font-bold text-xs text-slate-800 block">{r.parameter}</span>
                    <span className="text-[11px] text-slate-400">Ref: {r.normalRange} {r.unit}</span>
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Observed Value *</label>
                    <input
                      type="text"
                      required
                      value={r.value}
                      onChange={(e) => handleResultParamChange(i, 'value', e.target.value)}
                      placeholder="e.g. 14.5"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Flag</label>
                    <select
                      value={r.flag}
                      onChange={(e) => handleResultParamChange(i, 'flag', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Low">Low</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Impression / Summary</label>
              <textarea
                rows={2}
                value={resultData.clinicalImpression}
                onChange={(e) => setResultData((prev) => ({ ...prev, clinicalImpression: e.target.value }))}
                placeholder="Pathologist or laboratory summary..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsResultModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="success" size="sm" loading={submitting}>
                Save & Verify Report
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Printable Lab Report Modal */}
      {selectedReportToPrint && (
        <Modal
          isOpen={!!selectedReportToPrint}
          onClose={() => setSelectedReportToPrint(null)}
          title="Print Diagnostic Report"
          subtitle="Official laboratory test certificate"
          maxWidth="max-w-3xl"
          footer={
            <Button variant="primary" size="sm" icon={Printer} onClick={() => window.print()}>
              Print Diagnostic Certificate
            </Button>
          }
        >
          <div className="p-6 bg-white border border-slate-300 rounded-xl space-y-6 text-slate-800 printable-area">
            {/* Branding Header */}
            <div className="flex items-center justify-between border-b-2 border-primary-700 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-primary-900 uppercase tracking-tight">
                  {settings.hospitalName}
                </h2>
                <p className="text-xs text-slate-500">Department of Diagnostic Pathology & Clinical Biochemistry</p>
                <p className="text-xs text-slate-500">{settings.phone} • {settings.email}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-slate-900 block">
                  REPORT #: {selectedReportToPrint.reportId}
                </span>
                <span className="text-xs text-slate-500">Sample: {formatDate(selectedReportToPrint.requestedDate)}</span>
              </div>
            </div>

            {/* Patient Header Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">PATIENT NAME</span>
                <strong>{selectedReportToPrint.patient?.firstName} {selectedReportToPrint.patient?.lastName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PATIENT ID</span>
                <strong className="font-mono">{selectedReportToPrint.patient?.patientId}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">AGE / GENDER</span>
                <strong>{selectedReportToPrint.patient?.age} yrs / {selectedReportToPrint.patient?.gender}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">REFERRED BY</span>
                <strong>Dr. {selectedReportToPrint.doctor?.user?.lastName}</strong>
              </div>
            </div>

            {/* Report Title */}
            <div className="text-center py-2 bg-primary-50 rounded-lg border border-primary-100">
              <h3 className="text-sm font-extrabold text-primary-900 uppercase tracking-wider">
                {selectedReportToPrint.test?.testName}
              </h3>
            </div>

            {/* Parameter Table */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Investigation</th>
                  <th className="py-2.5 px-3">Observed Value</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Reference Range</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedReportToPrint.results?.map((r, i) => (
                  <tr key={i} className={r.flag !== 'Normal' ? 'bg-rose-50/50 font-semibold' : ''}>
                    <td className="py-2.5 px-3">{r.parameter}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.value}</td>
                    <td className="py-2.5 px-3 text-slate-500">{r.unit}</td>
                    <td className="py-2.5 px-3 text-slate-500">{r.normalRange}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          r.flag === 'Normal' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                        }`}
                      >
                        {r.flag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedReportToPrint.clinicalImpression && (
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-700">
                <strong>Clinical Impression:</strong> {selectedReportToPrint.clinicalImpression}
              </div>
            )}

            {/* Signatures */}
            <div className="pt-10 flex justify-between items-end border-t border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400">Electronic verification: Certified Diagnostic Lab</span>
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">Verified Pathologist</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
