import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = [
  { role: 'Super Admin', email: 'admin@hospital.com', pass: 'Admin@123', label: '👑 Super Admin', desc: 'Universal Full Access' },
  { role: 'Hospital Admin', email: 'hospadmin@hospital.com', pass: 'Admin@123', label: '🏥 Hospital Admin', desc: 'Hospital Operations' },
  { role: 'Doctor', email: 'doctor@hospital.com', pass: 'Doctor@123', label: '🩺 Doctor (Cardiology)', desc: 'EMR, Prescriptions, Rounds' },
  { role: 'Receptionist', email: 'receptionist@hospital.com', pass: 'Staff@123', label: '📋 Receptionist', desc: 'Patients, Check-ins, Bookings' },
  { role: 'Nurse', email: 'nurse@hospital.com', pass: 'Staff@123', label: '💉 Nurse', desc: 'Vitals, Wards & Daily Care' },
  { role: 'Pharmacist', email: 'pharmacist@hospital.com', pass: 'Staff@123', label: '💊 Pharmacist', desc: 'Medicines & Dispensing' },
  { role: 'Laboratory Staff', email: 'labtech@hospital.com', pass: 'Staff@123', label: '🔬 Lab Technician', desc: 'Tests & Results Entry' },
  { role: 'Accountant', email: 'accountant@hospital.com', pass: 'Staff@123', label: '💵 Billing / Accountant', desc: 'Invoices & Payments' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session validation error:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const switchDemoRole = async (email, password) => {
    return await login(email, password);
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchDemoRole,
        hasRole,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
