const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const LaboratoryReport = require('../models/LaboratoryReport');
const Admission = require('../models/Admission');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Medicine = require('../models/Medicine');
const InventoryItem = require('../models/InventoryItem');
const Supplier = require('../models/Supplier');
const InventoryTransaction = require('../models/InventoryTransaction');

const generateUniqueId = async (Model, field, prefix, padLength = 4) => {
  const latestDoc = await Model.findOne().sort({ createdAt: -1 });
  let nextNumber = 1001;

  if (latestDoc && latestDoc[field]) {
    const rawId = latestDoc[field];
    const match = rawId.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }

  const generatedId = `${prefix}${String(nextNumber).padStart(padLength, '0')}`;
  return generatedId;
};

const generateInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;
  const latestDoc = await Invoice.findOne({ invoiceNumber: new RegExp(`^${prefix}`) }).sort({ createdAt: -1 });
  let nextNumber = 1;

  if (latestDoc && latestDoc.invoiceNumber) {
    const parts = latestDoc.invoiceNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

module.exports = {
  generateUniqueId,
  generateInvoiceNumber,
};
