# CarePulse — Enterprise Hospital Management System (HMS)

A complete, production-ready Hospital Management System built with pure **JavaScript on the MERN Stack** (MongoDB, Express, React, Node.js).

---

## 🚀 Live Services & Ports

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **Database**: MongoDB Atlas (`cluster0.sehuqee.mongodb.net/hospital_management`)

---

## 👥 Demo User Accounts (8 RBAC Roles)

A **1-Click Role Switcher** is present on the login screen (`/login`) for instantaneous demo access:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@hospital.com` | `Admin@123` |
| **Hospital Admin** | `hospadmin@hospital.com` | `Admin@123` |
| **Doctor (Cardiology)** | `doctor@hospital.com` | `Doctor@123` |
| **Receptionist** | `receptionist@hospital.com` | `Staff@123` |
| **Nurse** | `nurse@hospital.com` | `Staff@123` |
| **Pharmacist** | `pharmacist@hospital.com` | `Staff@123` |
| **Laboratory Staff** | `labtech@hospital.com` | `Staff@123` |
| **Accountant** | `accountant@hospital.com` | `Staff@123` |

---

## 📦 Features Implemented

1. **Patient 360° Profile**: Demographics, live BMI calculation, EMR history, prescriptions, diagnostic lab reports, admissions, billing, and document uploads.
2. **Appointment Scheduling**: Real-time slot generator, double-booking prevention, and check-in workflow.
3. **Electronic Medical Records (EMR)**: Vitals tracking, chief complaints, ICD-10 diagnosis, and clinical plans.
4. **Digital Prescription Pad & Dispensing**: Multi-line medication builder, pharmacy stock auto-deduction, and printable prescription pads.
5. **Diagnostic Laboratory**: Test catalog, priority tracking (Normal/Urgent/STAT), parameter flagging (Normal/High/Low/Critical), and printable diagnostic reports.
6. **Wards & Live Bed Floor Plan**: Visual color-coded bed map (Available, Occupied, Maintenance), patient admission and discharge workflow.
7. **Billing & A4 Tax Invoices**: Itemized service billing, automated tax/discount calculations, partial payment ledger, and dedicated A4 printable invoice page.
8. **Pharmacy & Inventory**: Batch tracking, expiry alerts, low-stock warnings, and transaction logs.
9. **Analytics & Executive Dashboards**: Recharts visualizations for revenue trajectory and doctor caseload.
10. **Role-Based Access Control & Audit Logs**: Granular permission matrix and immutable activity logging.

---

## 🛠️ How to Run

### 1. Start Backend Server
```powershell
cd server
$env:Path = "C:\Program Files\nodejs;$env:Path"
node server.js
```

### 2. Start Frontend Client
```powershell
cd client
$env:Path = "C:\Program Files\nodejs;$env:Path"
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
