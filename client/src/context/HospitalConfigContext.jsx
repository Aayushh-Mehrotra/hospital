import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingApi } from '../services/api';

const HospitalConfigContext = createContext(null);

export const HospitalConfigProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    hospitalName: 'CarePulse Super Speciality Hospital',
    tagline: 'Excellence in Healthcare & Compassionate Patient Service',
    currency: { code: 'USD', symbol: '$' },
    phone: '+1 (800) 555-CARE',
    emergencyHelpline: '+1 (800) 911-HELP',
    email: 'contact@carepulse-hospital.org',
    address: {
      street: '450 Healthcare Boulevard, Medical District',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States',
    },
    taxRatePercentage: 5.0,
    invoicePrefix: 'INV-2026-',
    authorizedSignatoryName: 'Dr. Arthur Pendelton, MD (Medical Director)',
    invoiceFooterNote: 'Thank you for choosing CarePulse Hospital. We wish you a swift and complete recovery.',
  });

  const fetchSettings = async () => {
    try {
      const res = await settingApi.getSettings();
      if (res.data.success && res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error('Failed to load hospital settings:', err.message);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const formatCurrency = (amount) => {
    const symbol = settings?.currency?.symbol || '$';
    const val = Number(amount) || 0;
    return `${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <HospitalConfigContext.Provider
      value={{
        settings,
        fetchSettings,
        formatCurrency,
      }}
    >
      {children}
    </HospitalConfigContext.Provider>
  );
};

export const useHospitalConfig = () => {
  const context = useContext(HospitalConfigContext);
  if (!context) {
    throw new Error('useHospitalConfig must be used within a HospitalConfigProvider');
  }
  return context;
};
