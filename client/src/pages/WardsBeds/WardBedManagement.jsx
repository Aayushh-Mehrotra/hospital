import React, { useState, useEffect } from 'react';
import { BedDouble, Plus, Building2, User, CheckCircle2, AlertCircle, Wrench, Shield } from 'lucide-react';
import { wardBedApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNotification } from '../../context/NotificationContext';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

export const WardBedManagement = () => {
  const { showToast } = useNotification();
  const { formatCurrency } = useHospitalConfig();

  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState('ALL');

  // Modals
  const [wardModalOpen, setWardModalOpen] = useState(false);
  const [bedModalOpen, setBedModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [wardForm, setWardForm] = useState({
    name: '',
    code: '',
    type: 'General Ward Male',
    floor: '2nd Floor',
    capacity: 10,
    chargePerDay: 120,
  });

  const [bedForm, setBedForm] = useState({
    bedNumber: '',
    ward: '',
    features: 'Oxygen Port, Nurse Call Bell',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, bRes] = await Promise.all([wardBedApi.getWards(), wardBedApi.getBeds()]);
      if (wRes.data.success) setWards(wRes.data.wards);
      if (bRes.data.success) setBeds(bRes.data.beds);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWard = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await wardBedApi.createWard(wardForm);
      if (res.data.success) {
        showToast('Ward created successfully!', 'success');
        setWardModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBed = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        bedNumber: bedForm.bedNumber,
        ward: bedForm.ward,
        features: bedForm.features ? bedForm.features.split(',').map((s) => s.trim()) : [],
      };

      const res = await wardBedApi.createBed(payload);
      if (res.data.success) {
        showToast('Bed added to ward successfully!', 'success');
        setBedModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBedMaintenance = async (bed) => {
    const newStatus = bed.status === 'Maintenance' ? 'Available' : 'Maintenance';
    try {
      const res = await wardBedApi.updateBed(bed._id, { status: newStatus });
      if (res.data.success) {
        showToast(`Bed ${bed.bedNumber} marked as ${newStatus}`, 'success');
        fetchData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredBeds =
    selectedWard === 'ALL' ? beds : beds.filter((b) => b.ward?._id === selectedWard || b.ward === selectedWard);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BedDouble className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Wards & Bed Allocation</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive live bed occupancy map, ward charges, and equipment telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button variant="outline" size="sm" icon={Plus} onClick={() => setWardModalOpen(true)}>
            Add Ward
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setBedModalOpen(true)}>
            Add Bed
          </Button>
        </div>
      </div>

      {/* Ward Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {wards.map((ward) => {
          const stats = ward.bedStats || {};
          return (
            <div
              key={ward._id}
              onClick={() => setSelectedWard(ward._id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer shadow-card ${
                selectedWard === ward._id
                  ? 'border-primary-500 bg-primary-50/50 ring-2 ring-primary-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                    {ward.code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{ward.name}</h3>
                  <p className="text-[11px] text-slate-500">{ward.floor}</p>
                </div>
                <span className="text-xs font-extrabold text-slate-800">
                  {formatCurrency(ward.chargePerDay)}
                  <span className="text-[10px] text-slate-400 font-normal">/day</span>
                </span>
              </div>

              {/* Mini Occupancy Meter */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  {stats.available || 0} Available
                </span>
                <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">
                  {stats.occupied || 0} Occupied
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed Grid Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-extrabold text-slate-900">Interactive Bed Floor Plan</h2>
            <span className="text-xs text-slate-400">({filteredBeds.length} total beds)</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => setSelectedWard('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedWard === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Wards
            </button>
            <div className="flex items-center space-x-4 border-l border-slate-200 pl-3">
              <span className="flex items-center text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" /> Available
              </span>
              <span className="flex items-center text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5" /> Occupied
              </span>
              <span className="flex items-center text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-1.5" /> Maintenance
              </span>
            </div>
          </div>
        </div>

        {/* Visual Bed Tiles Grid */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : filteredBeds.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No beds configured in this ward.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBeds.map((bed) => {
              const isOccupied = bed.status === 'Occupied';
              const isMaintenance = bed.status === 'Maintenance';

              return (
                <div
                  key={bed._id}
                  className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                    isOccupied
                      ? 'bg-rose-50/50 border-rose-200'
                      : isMaintenance
                      ? 'bg-slate-100/60 border-slate-300'
                      : 'bg-emerald-50/40 border-emerald-200 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BedDouble
                          className={`w-5 h-5 ${
                            isOccupied ? 'text-rose-600' : isMaintenance ? 'text-slate-500' : 'text-emerald-600'
                          }`}
                        />
                        <span className="font-extrabold text-sm text-slate-900">{bed.bedNumber}</span>
                      </div>
                      <Badge status={bed.status} />
                    </div>

                    <div className="mt-2 text-[11px] text-slate-500">{bed.ward?.name}</div>

                    {isOccupied && bed.currentPatient && (
                      <div className="mt-3 p-2 bg-white rounded-lg border border-rose-200 text-xs">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Inpatient</span>
                        <strong className="text-slate-900 block truncate">
                          {bed.currentPatient?.firstName} {bed.currentPatient?.lastName}
                        </strong>
                        <span className="text-[11px] font-mono text-slate-500">{bed.currentPatient?.patientId}</span>
                      </div>
                    )}

                    {bed.features && bed.features.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {bed.features.map((f, i) => (
                          <span key={i} className="text-[9px] font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isOccupied && (
                    <div className="mt-4 pt-2 border-t border-slate-200/60 flex justify-end">
                      <button
                        onClick={() => handleToggleBedMaintenance(bed)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center"
                      >
                        <Wrench className="w-3 h-3 mr-1" />
                        {isMaintenance ? 'Mark Available' : 'Maintenance'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Ward Modal */}
      <Modal
        isOpen={wardModalOpen}
        onClose={() => setWardModalOpen(false)}
        title="Add Hospital Ward"
        subtitle="Configure room ward and daily tariff"
      >
        <form onSubmit={handleCreateWard} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Name *</label>
              <input
                type="text"
                required
                value={wardForm.name}
                onChange={(e) => setWardForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Pediatric Ward Wing A"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Code *</label>
              <input
                type="text"
                required
                value={wardForm.code}
                onChange={(e) => setWardForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="e.g. PED-A"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs uppercase focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Type</label>
              <select
                value={wardForm.type}
                onChange={(e) => setWardForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <option value="General Ward Male">General Ward Male</option>
                <option value="General Ward Female">General Ward Female</option>
                <option value="ICU">ICU</option>
                <option value="Semi-Private">Semi-Private</option>
                <option value="Private Deluxe">Private Deluxe</option>
                <option value="Pediatric">Pediatric</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor</label>
              <input
                type="text"
                value={wardForm.floor}
                onChange={(e) => setWardForm((prev) => ({ ...prev, floor: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Charge / Day ($)</label>
              <input
                type="number"
                value={wardForm.chargePerDay}
                onChange={(e) => setWardForm((prev) => ({ ...prev, chargePerDay: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setWardModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Create Ward
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Bed Modal */}
      <Modal
        isOpen={bedModalOpen}
        onClose={() => setBedModalOpen(false)}
        title="Add Bed to Ward"
        subtitle="Specify bed identification number and equipment"
      >
        <form onSubmit={handleCreateBed} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Number / Code *</label>
              <input
                type="text"
                required
                value={bedForm.bedNumber}
                onChange={(e) => setBedForm((prev) => ({ ...prev, bedNumber: e.target.value }))}
                placeholder="e.g. GWM-105"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Ward *</label>
              <select
                required
                value={bedForm.ward}
                onChange={(e) => setBedForm((prev) => ({ ...prev, ward: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">Choose Ward</option>
                {wards.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Features (comma separated)</label>
            <input
              type="text"
              value={bedForm.features}
              onChange={(e) => setBedForm((prev) => ({ ...prev, features: e.target.value }))}
              placeholder="Oxygen Port, Ventilator Support, Motorized"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setBedModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Add Bed
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
