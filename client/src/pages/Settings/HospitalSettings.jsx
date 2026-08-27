import React, { useState, useEffect } from 'react';
import { Settings, Save, Building, Phone, Mail, DollarSign, Shield, Receipt } from 'lucide-react';
import { settingsApi } from '../../services/api';
import { Button } from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';
import { useHospitalConfig } from '../../context/HospitalConfigContext';

export const HospitalSettings = () => {
  const { showToast } = useNotification();
  const { settings, fetchSettings } = useHospitalConfig();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: '',
    tagline: '',
    registrationNumber: '',
    phone: '',
    emergencyHelpline: '',
    email: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    currency: '$',
    taxRatePercentage: 5,
    authorizedSignatoryName: '',
    invoiceFooterNote: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        hospitalName: settings.hospitalName || '',
        tagline: settings.tagline || '',
        registrationNumber: settings.registrationNumber || '',
        phone: settings.phone || '',
        emergencyHelpline: settings.emergencyHelpline || '',
        email: settings.email || '',
        website: settings.website || '',
        address: {
          street: settings.address?.street || '',
          city: settings.address?.city || '',
          state: settings.address?.state || '',
          country: settings.address?.country || '',
          postalCode: settings.address?.postalCode || '',
        },
        currency: settings.currency || '$',
        taxRatePercentage: settings.taxRatePercentage || 5,
        authorizedSignatoryName: settings.authorizedSignatoryName || '',
        invoiceFooterNote: settings.invoiceFooterNote || '',
      });
    }
  }, [settings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('addr_')) {
      const field = name.replace('addr_', '');
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await settingsApi.update(formData);
      if (res.data.success) {
        showToast('Hospital configuration updated successfully!', 'success');
        fetchSettings();
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
            <Settings className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hospital Configuration</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Branding, contact hotlines, tax rates, billing currency, and official invoice disclaimers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hospital Branding */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center">
            <Building className="w-4 h-4 mr-2 text-primary-600" />
            Hospital Identity & Registration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name *</label>
              <input
                type="text"
                required
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Healthcare Registration #</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Coordinates */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center">
            <Phone className="w-4 h-4 mr-2 text-primary-600" />
            Contact & Location Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reception Helpline</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency 24/7 Hotline</label>
              <input
                type="text"
                name="emergencyHelpline"
                value={formData.emergencyHelpline}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                name="addr_street"
                value={formData.address.street}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                name="addr_city"
                value={formData.address.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
              <input
                type="text"
                name="addr_state"
                value={formData.address.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Financial & Invoicing Rules */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center">
            <Receipt className="w-4 h-4 mr-2 text-primary-600" />
            Billing & Invoicing Rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500"
              >
                <option value="$">$ (USD)</option>
                <option value="₹">₹ (INR)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="AED">AED (Dirhams)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                name="taxRatePercentage"
                value={formData.taxRatePercentage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Authorized Signatory Name</label>
              <input
                type="text"
                name="authorizedSignatoryName"
                value={formData.authorizedSignatoryName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Footer Disclaimer / Note</label>
            <input
              type="text"
              name="invoiceFooterNote"
              value={formData.invoiceFooterNote}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" icon={Save} loading={submitting}>
            Save Hospital Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
