const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  HOSPITAL_ADMIN: 'Hospital Admin',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist',
  NURSE: 'Nurse',
  PHARMACIST: 'Pharmacist',
  LABORATORY_STAFF: 'Laboratory Staff',
  ACCOUNTANT: 'Accountant',
};

const APPOINTMENT_STATUSES = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked In',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

const BED_STATUSES = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  MAINTENANCE: 'Maintenance',
};

const ADMISSION_STATUSES = {
  ADMITTED: 'Admitted',
  DISCHARGED: 'Discharged',
  TRANSFERRED: 'Transferred',
};

const INVOICE_STATUSES = {
  PENDING: 'Pending',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const PAYMENT_METHODS = {
  CASH: 'Cash',
  CARD: 'Card',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  INSURANCE: 'Insurance',
};

const LAB_STATUSES = {
  REQUESTED: 'Requested',
  SAMPLE_COLLECTED: 'Sample Collected',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  DELIVERED: 'Delivered',
};

const PRESCRIPTION_STATUSES = {
  PENDING: 'Pending',
  PARTIALLY_DISPENSED: 'Partially Dispensed',
  DISPENSED: 'Dispensed',
};

const INVENTORY_CATEGORIES = {
  MEDICINES: 'Medicines',
  SURGICAL: 'Surgical Supplies',
  EQUIPMENT: 'Medical Equipment',
  PPE: 'PPE',
  CONSUMABLES: 'Consumables',
  OFFICE: 'Office Supplies',
  LABORATORY: 'Laboratory Supplies',
};

module.exports = {
  ROLES,
  APPOINTMENT_STATUSES,
  BED_STATUSES,
  ADMISSION_STATUSES,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
  LAB_STATUSES,
  PRESCRIPTION_STATUSES,
  INVENTORY_CATEGORIES,
};
