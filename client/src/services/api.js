import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized response & error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not on login page, clear token
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Auth
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data),
  updateProfile: (data) => api.put('/auth/update-profile', data),
};

// Users
export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Patients
export const patientApi = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  uploadDocument: (id, formData) =>
    api.post(`/patients/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/patients/${id}`),
};

// Doctors
export const doctorApi = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
};

// Departments
export const departmentApi = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Appointments
export const appointmentApi = {
  getAll: (params) => api.get('/appointments', { params }),
  getAvailableSlots: (doctorId, date) =>
    api.get('/appointments/available-slots', { params: { doctorId, date } }),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  cancel: (id, data) => api.delete(`/appointments/${id}`, { data }),
};

// Medical Records (EMR)
export const medicalRecordApi = {
  getAll: (params) => api.get('/medical-records', { params }),
  getById: (id) => api.get(`/medical-records/${id}`),
  create: (data) => api.post('/medical-records', data),
  update: (id, data) => api.put(`/medical-records/${id}`, data),
  delete: (id) => api.delete(`/medical-records/${id}`),
};

// Prescriptions
export const prescriptionApi = {
  getAll: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post('/prescriptions', data),
  dispense: (id, data) => api.post(`/prescriptions/${id}/dispense`, data),
};

// Laboratory
export const laboratoryApi = {
  getTests: (params) => api.get('/laboratory/tests', { params }),
  createTest: (data) => api.post('/laboratory/tests', data),
  updateTest: (id, data) => api.put(`/laboratory/tests/${id}`, data),
  getReports: (params) => api.get('/laboratory/reports', { params }),
  getReportById: (id) => api.get(`/laboratory/reports/${id}`),
  requestTest: (data) => api.post('/laboratory/reports', data),
  updateReport: (id, data) => api.put(`/laboratory/reports/${id}`, data),
};

// Wards & Beds
export const wardBedApi = {
  getWards: () => api.get('/wards'),
  createWard: (data) => api.post('/wards', data),
  updateWard: (id, data) => api.put(`/wards/${id}`, data),
  getBeds: (params) => api.get('/beds', { params }),
  createBed: (data) => api.post('/beds', data),
  updateBed: (id, data) => api.put(`/beds/${id}`, data),
};

// Admissions
export const admissionApi = {
  getAll: (params) => api.get('/admissions', { params }),
  getById: (id) => api.get(`/admissions/${id}`),
  create: (data) => api.post('/admissions', data),
  addDailyNote: (id, data) => api.post(`/admissions/${id}/daily-notes`, data),
  discharge: (id, data) => api.post(`/admissions/${id}/discharge`, data),
};

// Billing & Invoices
export const billingApi = {
  getInvoices: (params) => api.get('/billing/invoices', { params }),
  getInvoiceById: (id) => api.get(`/billing/invoices/${id}`),
  createInvoice: (data) => api.post('/billing/invoices', data),
  updateInvoice: (id, data) => api.put(`/billing/invoices/${id}`, data),
};

// Payments
export const paymentApi = {
  getAll: (params) => api.get('/payments', { params }),
  recordPayment: (data) => api.post('/payments', data),
};

// Pharmacy
export const pharmacyApi = {
  getMedicines: (params) => api.get('/pharmacy/medicines', { params }),
  getMedicineById: (id) => api.get(`/pharmacy/medicines/${id}`),
  createMedicine: (data) => api.post('/pharmacy/medicines', data),
  updateMedicine: (id, data) => api.put(`/pharmacy/medicines/${id}`, data),
  adjustStock: (id, data) => api.post(`/pharmacy/medicines/${id}/adjust-stock`, data),
  deleteMedicine: (id) => api.delete(`/pharmacy/medicines/${id}`),
};

// Inventory & Supplies
export const inventoryApi = {
  getItems: (params) => api.get('/inventory/items', { params }),
  getItemById: (id) => api.get(`/inventory/items/${id}`),
  createItem: (data) => api.post('/inventory/items', data),
  updateItem: (id, data) => api.put(`/inventory/items/${id}`, data),
  adjustStock: (id, data) => api.post(`/inventory/items/${id}/adjust-stock`, data),
  getTransactions: (params) => api.get('/inventory/transactions', { params }),
};

// Suppliers
export const supplierApi = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
};

// Reports
export const reportApi = {
  getFinancial: (params) => api.get('/reports/financial', { params }),
  getClinical: (params) => api.get('/reports/clinical', { params }),
  getAppointments: (params) => api.get('/reports/appointments', { params }),
  getPatients: (params) => api.get('/reports/patients', { params }),
  getInventory: () => api.get('/reports/inventory'),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// Notifications
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Settings
export const settingApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  update: (data) => api.put('/settings', data),
};
export const settingsApi = settingApi;

// Audit Logs
export const auditLogApi = {
  getAll: (params) => api.get('/audit-logs', { params }),
};

// Roles & Permissions
export const roleApi = {
  getAll: () => api.get('/roles'),
  update: (data) => api.post('/roles', data),
};

export default api;
