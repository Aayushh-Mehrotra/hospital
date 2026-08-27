import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { HospitalConfigProvider } from './context/HospitalConfigContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { Login } from './pages/Auth/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { PatientList } from './pages/Patients/PatientList';
import { PatientProfile } from './pages/Patients/PatientProfile';
import { DoctorList } from './pages/Doctors/DoctorList';
import { DepartmentList } from './pages/Departments/DepartmentList';
import { AppointmentList } from './pages/Appointments/AppointmentList';
import { MedicalRecordList } from './pages/MedicalRecords/MedicalRecordList';
import { PrescriptionList } from './pages/Prescriptions/PrescriptionList';
import { LabManagement } from './pages/Laboratory/LabManagement';
import { WardBedManagement } from './pages/WardsBeds/WardBedManagement';
import { AdmissionList } from './pages/Admissions/AdmissionList';
import { InvoiceList } from './pages/Billing/InvoiceList';
import { CreateInvoice } from './pages/Billing/CreateInvoice';
import { InvoiceDetails } from './pages/Billing/InvoiceDetails';
import { PrintableInvoice } from './pages/Billing/PrintableInvoice';
import { PaymentList } from './pages/Payments/PaymentList';
import { PharmacyList } from './pages/Pharmacy/PharmacyList';
import { InventoryList } from './pages/Inventory/InventoryList';
import { SupplierList } from './pages/Suppliers/SupplierList';
import { Reports } from './pages/Reports/Reports';
import { NotificationCenter } from './pages/Notifications/NotificationCenter';
import { UserList } from './pages/Users/UserList';
import { RolesPermissions } from './pages/Roles/RolesPermissions';
import { HospitalSettings } from './pages/Settings/HospitalSettings';
import { AuditLogList } from './pages/AuditLogs/AuditLogList';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <HospitalConfigProvider>
            <Routes>
              {/* Public Authentication Route */}
              <Route path="/login" element={<Login />} />

              {/* Dedicated Full-Screen Printable Invoice */}
              <Route
                path="/billing/invoices/:id/print"
                element={
                  <ProtectedRoute>
                    <PrintableInvoice />
                  </ProtectedRoute>
                }
              />

              {/* Protected Main Application Routes with DashboardLayout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />

                {/* Clinical & Patient Modules */}
                <Route path="patients" element={<PatientList />} />
                <Route path="patients/:id" element={<PatientProfile />} />
                <Route path="doctors" element={<DoctorList />} />
                <Route path="departments" element={<DepartmentList />} />
                <Route path="appointments" element={<AppointmentList />} />
                <Route path="medical-records" element={<MedicalRecordList />} />
                <Route path="prescriptions" element={<PrescriptionList />} />
                <Route path="laboratory" element={<LabManagement />} />

                {/* Inpatient & Bed Modules */}
                <Route path="wards-beds" element={<WardBedManagement />} />
                <Route path="admissions" element={<AdmissionList />} />

                {/* Billing & Finance Modules */}
                <Route path="billing" element={<InvoiceList />} />
                <Route path="billing/create" element={<CreateInvoice />} />
                <Route path="billing/invoices/:id" element={<InvoiceDetails />} />
                <Route path="payments" element={<PaymentList />} />

                {/* Pharmacy, Inventory & Procurement */}
                <Route path="pharmacy" element={<PharmacyList />} />
                <Route path="inventory" element={<InventoryList />} />
                <Route path="suppliers" element={<SupplierList />} />

                {/* Analytics & Administrative */}
                <Route path="reports" element={<Reports />} />
                <Route path="notifications" element={<NotificationCenter />} />
                <Route path="users" element={<UserList />} />
                <Route path="roles" element={<RolesPermissions />} />
                <Route path="settings" element={<HospitalSettings />} />
                <Route path="audit-logs" element={<AuditLogList />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </HospitalConfigProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
