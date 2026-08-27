const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('../config/db');
const { errorHandler, notFound } = require('../middleware/errorMiddleware');
const seedData = require('../utils/seed');
const User = require('../models/User');

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure DB connected
let dbConnected = false;
app.use(async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      const count = await User.countDocuments();
      if (count === 0) {
        await seedData();
      }
    } catch (err) {
      console.error('DB connect error:', err);
    }
  }
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'CarePulse Hospital Management System API (Vercel Serverless)',
  });
});

// Mount Routes
app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/users', require('../routes/userRoutes'));
app.use('/api/patients', require('../routes/patientRoutes'));
app.use('/api/departments', require('../routes/departmentRoutes'));
app.use('/api/doctors', require('../routes/doctorRoutes'));
app.use('/api/appointments', require('../routes/appointmentRoutes'));
app.use('/api/medical-records', require('../routes/medicalRecordRoutes'));
app.use('/api/prescriptions', require('../routes/prescriptionRoutes'));
app.use('/api/laboratory', require('../routes/laboratoryRoutes'));
app.use('/api', require('../routes/wardBedRoutes'));
app.use('/api/admissions', require('../routes/admissionRoutes'));
app.use('/api/billing', require('../routes/billingRoutes'));
app.use('/api/payments', require('../routes/paymentRoutes'));
app.use('/api/pharmacy', require('../routes/pharmacyRoutes'));
app.use('/api/inventory', require('../routes/inventoryRoutes'));
app.use('/api/suppliers', require('../routes/supplierRoutes'));
app.use('/api/reports', require('../routes/reportRoutes'));
app.use('/api/dashboard', require('../routes/dashboardRoutes'));
app.use('/api/notifications', require('../routes/notificationRoutes'));
app.use('/api/settings', require('../routes/settingRoutes'));
app.use('/api/audit-logs', require('../routes/auditLogRoutes'));
app.use('/api/roles', require('../routes/roleRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
