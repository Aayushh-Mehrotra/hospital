const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const LaboratoryTest = require('../models/LaboratoryTest');
const LaboratoryReport = require('../models/LaboratoryReport');
const Ward = require('../models/Ward');
const Bed = require('../models/Bed');
const Admission = require('../models/Admission');
const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');
const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const HospitalSettings = require('../models/HospitalSettings');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { ROLES, APPOINTMENT_STATUSES, BED_STATUSES, ADMISSION_STATUSES, INVOICE_STATUSES, PAYMENT_METHODS, LAB_STATUSES, PRESCRIPTION_STATUSES } = require('../config/constants');

const seedData = async () => {
  console.log('🌱 Starting comprehensive database seeding for CarePulse HMS...');

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Role.deleteMany({}),
    Department.deleteMany({}),
    Doctor.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    MedicalRecord.deleteMany({}),
    Prescription.deleteMany({}),
    LaboratoryTest.deleteMany({}),
    LaboratoryReport.deleteMany({}),
    Ward.deleteMany({}),
    Bed.deleteMany({}),
    Admission.deleteMany({}),
    Supplier.deleteMany({}),
    Medicine.deleteMany({}),
    InventoryItem.deleteMany({}),
    InventoryTransaction.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    HospitalSettings.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // 1. Hospital Settings
  const settings = await HospitalSettings.create({
    hospitalName: 'CarePulse Super Speciality Hospital',
    tagline: 'Excellence in Healthcare & Compassionate Patient Service',
    registrationNumber: 'HOSP-MED-2024-9988',
    email: 'contact@carepulse-hospital.org',
    phone: '+1 (800) 555-CARE',
    emergencyHelpline: '+1 (800) 911-HELP',
    website: 'https://carepulse-hospital.org',
    address: {
      street: '450 Healthcare Boulevard, Medical District',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States',
    },
    currency: { code: 'USD', symbol: '$' },
    taxRatePercentage: 5.0,
    invoicePrefix: 'INV-2026-',
    authorizedSignatoryName: 'Dr. Arthur Pendelton, MD (Medical Director)',
    invoiceFooterNote: 'Thank you for choosing CarePulse Hospital. We wish you a swift and complete recovery.',
  });

  // 2. Departments
  const departments = await Department.create([
    { name: 'Cardiology', code: 'CARD', description: 'Comprehensive heart and cardiovascular disease treatment', floor: '3rd Floor, Wing A', contactPhone: '+1 555-0101', icon: 'Activity' },
    { name: 'Orthopedics', code: 'ORTH', description: 'Bone, joint, spine, and musculoskeletal care', floor: '2nd Floor, Wing B', contactPhone: '+1 555-0102', icon: 'Bone' },
    { name: 'Pediatrics', code: 'PED', description: 'Specialized healthcare for infants, children, and adolescents', floor: '1st Floor, Wing C', contactPhone: '+1 555-0103', icon: 'Smile' },
    { name: 'Neurology', code: 'NEUR', description: 'Brain, spinal cord, and nervous system disorders', floor: '4th Floor, Wing A', contactPhone: '+1 555-0104', icon: 'Brain' },
    { name: 'General Medicine', code: 'GENM', description: 'Primary healthcare, internal medicine, and chronic disease management', floor: '1st Floor, Wing A', contactPhone: '+1 555-0105', icon: 'Stethoscope' },
    { name: 'Dermatology', code: 'DERM', description: 'Skin, hair, and aesthetic treatments', floor: '2nd Floor, Wing C', contactPhone: '+1 555-0106', icon: 'Sparkles' },
    { name: 'Emergency & Trauma', code: 'EMERG', description: '24/7 Level-1 emergency and critical resuscitation unit', floor: 'Ground Floor, Main Entrance', contactPhone: '+1 555-0911', icon: 'Ambulance' },
    { name: 'Radiology & Imaging', code: 'RAD', description: 'Advanced MRI, CT, Ultrasonography, and digital X-ray services', floor: 'Basement 1, Wing B', contactPhone: '+1 555-0107', icon: 'Radio' },
  ]);

  // 3. Users for all 8 Roles
  const users = await User.create([
    { username: 'admin', email: 'admin@hospital.com', password: 'Admin@123', role: ROLES.SUPER_ADMIN, firstName: 'Alexander', lastName: 'Wright', phone: '+1 555-0001' },
    { username: 'hospadmin', email: 'hospadmin@hospital.com', password: 'Admin@123', role: ROLES.HOSPITAL_ADMIN, firstName: 'Eleanor', lastName: 'Vance', phone: '+1 555-0002' },
    { username: 'dr_cardio', email: 'doctor@hospital.com', password: 'Doctor@123', role: ROLES.DOCTOR, firstName: 'Marcus', lastName: 'Brody', phone: '+1 555-0003', department: departments[0]._id },
    { username: 'dr_pediatric', email: 'pediatrician@hospital.com', password: 'Doctor@123', role: ROLES.DOCTOR, firstName: 'Sarah', lastName: 'Jenkins', phone: '+1 555-0004', department: departments[2]._id },
    { username: 'dr_ortho', email: 'ortho@hospital.com', password: 'Doctor@123', role: ROLES.DOCTOR, firstName: 'David', lastName: 'Chen', phone: '+1 555-0005', department: departments[1]._id },
    { username: 'receptionist', email: 'receptionist@hospital.com', password: 'Staff@123', role: ROLES.RECEPTIONIST, firstName: 'Clara', lastName: 'Oswald', phone: '+1 555-0006' },
    { username: 'nurse_head', email: 'nurse@hospital.com', password: 'Staff@123', role: ROLES.NURSE, firstName: 'Hannah', lastName: 'Abbott', phone: '+1 555-0007' },
    { username: 'pharmacist', email: 'pharmacist@hospital.com', password: 'Staff@123', role: ROLES.PHARMACIST, firstName: 'Simon', lastName: 'Riley', phone: '+1 555-0008' },
    { username: 'labtech', email: 'labtech@hospital.com', password: 'Staff@123', role: ROLES.LABORATORY_STAFF, firstName: 'Walter', lastName: 'Bishop', phone: '+1 555-0009' },
    { username: 'accountant', email: 'accountant@hospital.com', password: 'Staff@123', role: ROLES.ACCOUNTANT, firstName: 'Gillian', lastName: 'Foster', phone: '+1 555-0010' },
  ]);

  // 4. Doctors Profiles
  const defaultSchedule = [
    { day: 'Monday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    { day: 'Tuesday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    { day: 'Wednesday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    { day: 'Thursday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
    { day: 'Friday', startTime: '09:00', endTime: '16:00', slotDurationMinutes: 30, isAvailable: true },
  ];

  const doctors = await Doctor.create([
    {
      doctorId: 'DOC-1001',
      user: users[2]._id,
      department: departments[0]._id,
      specialization: 'Senior Interventional Cardiologist',
      qualifications: ['MD (Cardiology)', 'FACC', 'MBBS (Johns Hopkins)'],
      experienceYears: 14,
      licenseNumber: 'MED-NY-84920',
      consultationFee: 120,
      roomNumber: 'OPD-301',
      bio: 'Leading cardiologist specializing in angioplasty, heart failure, and preventative cardiovascular health.',
      schedule: defaultSchedule,
      status: 'Active',
    },
    {
      doctorId: 'DOC-1002',
      user: users[3]._id,
      department: departments[2]._id,
      specialization: 'Consultant Pediatrician',
      qualifications: ['MD (Pediatrics)', 'DCH', 'FAAP'],
      experienceYears: 10,
      licenseNumber: 'MED-NY-72109',
      consultationFee: 90,
      roomNumber: 'OPD-105',
      bio: 'Dedicated pediatrician focused on neonatal care, childhood development, and immunizations.',
      schedule: defaultSchedule,
      status: 'Active',
    },
    {
      doctorId: 'DOC-1003',
      user: users[4]._id,
      department: departments[1]._id,
      specialization: 'Orthopedic & Joint Replacement Surgeon',
      qualifications: ['MS (Orthopedics)', 'MCh', 'Fellowship in Arthroscopy'],
      experienceYears: 16,
      licenseNumber: 'MED-NY-61944',
      consultationFee: 110,
      roomNumber: 'OPD-204',
      bio: 'Expert in arthroscopic knee and hip surgeries, sports injuries, and trauma reconstruction.',
      schedule: defaultSchedule,
      status: 'Active',
    },
  ]);

  // Set head doctors on departments
  await Department.findByIdAndUpdate(departments[0]._id, { headDoctor: doctors[0]._id });
  await Department.findByIdAndUpdate(departments[2]._id, { headDoctor: doctors[1]._id });
  await Department.findByIdAndUpdate(departments[1]._id, { headDoctor: doctors[2]._id });

  // 5. Patients
  const patients = await Patient.create([
    {
      patientId: 'PAT-1001',
      firstName: 'Robert',
      lastName: 'Sterling',
      gender: 'Male',
      dateOfBirth: new Date('1978-04-15'),
      age: 48,
      bloodGroup: 'O+',
      phone: '+1 (555) 234-5678',
      email: 'robert.sterling@example.com',
      address: { street: '742 Evergreen Terrace', city: 'New York', state: 'NY', postalCode: '10021' },
      emergencyContact: { name: 'Margaret Sterling', relationship: 'Spouse', phone: '+1 (555) 234-5679' },
      allergies: ['Penicillin', 'Sulfa Drugs'],
      medicalHistory: [{ condition: 'Hypertension', diagnosedDate: new Date('2019-06-10'), notes: 'Controlled with ACE inhibitors' }],
      currentMedications: [{ name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily in morning' }],
      insurance: { provider: 'BlueCross BlueShield', policyNumber: 'BCBS-994821', groupNumber: 'GRP-104', coverageAmount: 50000, validUntil: new Date('2027-12-31') },
      status: 'Active',
      registeredBy: users[5]._id,
    },
    {
      patientId: 'PAT-1002',
      firstName: 'Sophia',
      lastName: 'Rodriguez',
      gender: 'Female',
      dateOfBirth: new Date('1992-09-23'),
      age: 33,
      bloodGroup: 'A+',
      phone: '+1 (555) 345-6789',
      email: 'sophia.rodriguez@example.com',
      address: { street: '128 Willow Creek Way', city: 'Brooklyn', state: 'NY', postalCode: '11201' },
      emergencyContact: { name: 'Carlos Rodriguez', relationship: 'Brother', phone: '+1 (555) 345-6780' },
      allergies: ['Peanuts'],
      medicalHistory: [{ condition: 'Mild Asthma', diagnosedDate: new Date('2015-02-14') }],
      currentMedications: [{ name: 'Albuterol Inhaler', dosage: '90mcg', frequency: 'As needed for wheezing' }],
      insurance: { provider: 'UnitedHealthcare', policyNumber: 'UHC-440192', groupNumber: 'GRP-99', coverageAmount: 40000, validUntil: new Date('2027-08-31') },
      status: 'Active',
      registeredBy: users[5]._id,
    },
    {
      patientId: 'PAT-1003',
      firstName: 'Ethan',
      lastName: 'Miller',
      gender: 'Male',
      dateOfBirth: new Date('2018-11-04'),
      age: 7,
      bloodGroup: 'B+',
      phone: '+1 (555) 456-7890',
      email: 'jessica.miller@example.com',
      guardian: { name: 'Jessica Miller', relationship: 'Mother', phone: '+1 (555) 456-7890' },
      address: { street: '304 Oak Ridge Lane', city: 'Queens', state: 'NY', postalCode: '11375' },
      allergies: ['None known'],
      insurance: { provider: 'Aetna Health', policyNumber: 'AET-883011', coverageAmount: 25000, validUntil: new Date('2026-11-30') },
      status: 'Active',
      registeredBy: users[5]._id,
    },
    {
      patientId: 'PAT-1004',
      firstName: 'Emily',
      lastName: 'Watson',
      gender: 'Female',
      dateOfBirth: new Date('1965-03-12'),
      age: 61,
      bloodGroup: 'AB-',
      phone: '+1 (555) 567-8901',
      email: 'emily.watson@example.com',
      address: { street: '88 Central Park West', city: 'New York', state: 'NY', postalCode: '10023' },
      emergencyContact: { name: 'George Watson', relationship: 'Spouse', phone: '+1 (555) 567-8902' },
      allergies: ['Aspirin', 'Iodine Contrast'],
      medicalHistory: [{ condition: 'Osteoarthritis (Bilateral Knees)', diagnosedDate: new Date('2021-08-19') }],
      insurance: { provider: 'Medicare Advantage', policyNumber: 'MED-110293', coverageAmount: 75000, validUntil: new Date('2028-12-31') },
      status: 'Inpatient',
      registeredBy: users[5]._id,
    },
    {
      patientId: 'PAT-1005',
      firstName: 'Lucas',
      lastName: 'Kim',
      gender: 'Male',
      dateOfBirth: new Date('1990-12-01'),
      age: 35,
      bloodGroup: 'O-',
      phone: '+1 (555) 678-9012',
      email: 'lucas.kim@example.com',
      address: { street: '512 Hudson St', city: 'Hoboken', state: 'NJ', postalCode: '07030' },
      allergies: ['None'],
      status: 'Active',
      registeredBy: users[5]._id,
    },
  ]);

  // 6. Laboratory Test Catalog
  const labTests = await LaboratoryTest.create([
    {
      testCode: 'LAB-T101',
      testName: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      description: 'Comprehensive analysis of red blood cells, white blood cells, hemoglobin, hematocrit, and platelets.',
      price: 35,
      sampleType: 'Whole Blood (EDTA)',
      parameters: [
        { name: 'Hemoglobin', unit: 'g/dL', normalRange: '13.5 - 17.5', maleRange: '13.5 - 17.5', femaleRange: '12.0 - 15.5' },
        { name: 'White Blood Cell (WBC)', unit: 'x10^3/uL', normalRange: '4.5 - 11.0' },
        { name: 'Platelet Count', unit: 'x10^3/uL', normalRange: '150 - 450' },
        { name: 'Red Blood Cell (RBC)', unit: 'x10^6/uL', normalRange: '4.3 - 5.9' },
      ],
      turnaroundTimeHours: 4,
      status: 'Active',
    },
    {
      testCode: 'LAB-T102',
      testName: 'Lipid Profile Comprehensive',
      category: 'Biochemistry',
      description: 'Fasting lipid panel to assess cardiovascular risk.',
      price: 55,
      sampleType: 'Serum',
      parameters: [
        { name: 'Total Cholesterol', unit: 'mg/dL', normalRange: '< 200' },
        { name: 'HDL Cholesterol', unit: 'mg/dL', normalRange: '> 40 (Male) / > 50 (Female)' },
        { name: 'LDL Cholesterol', unit: 'mg/dL', normalRange: '< 100' },
        { name: 'Triglycerides', unit: 'mg/dL', normalRange: '< 150' },
      ],
      turnaroundTimeHours: 8,
      status: 'Active',
    },
    {
      testCode: 'LAB-T103',
      testName: 'Glycated Hemoglobin (HbA1c)',
      category: 'Biochemistry',
      description: 'Measures average blood sugar levels over the past 3 months.',
      price: 40,
      sampleType: 'Whole Blood',
      parameters: [
        { name: 'HbA1c', unit: '%', normalRange: '< 5.7 (Normal), 5.7-6.4 (Prediabetes), >=6.5 (Diabetes)' },
      ],
      turnaroundTimeHours: 6,
      status: 'Active',
    },
    {
      testCode: 'LAB-T104',
      testName: 'Digital Chest X-Ray (PA View)',
      category: 'Radiology',
      description: 'Standard chest radiograph to evaluate lungs, heart contours, and bony thorax.',
      price: 75,
      sampleType: 'Radiographic Imaging',
      parameters: [
        { name: 'Lungs & Pleura', normalRange: 'Clear lung fields without focal consolidation' },
        { name: 'Cardiac Silhouette', normalRange: 'Normal cardiothoracic ratio (< 0.5)' },
        { name: 'Bony Cage & Diaphragm', normalRange: 'Intact and normal contours' },
      ],
      turnaroundTimeHours: 2,
      status: 'Active',
    },
  ]);

  // 7. Suppliers
  const suppliers = await Supplier.create([
    { supplierId: 'SUP-1001', companyName: 'Pfizer Bio-Pharma Dist.', contactPerson: 'Michael Scott', phone: '+1 555-8801', email: 'orders@pfizer-dist.com', address: '235 E 42nd St, New York, NY', suppliedCategories: ['Medicines', 'Vaccines'], rating: 5 },
    { supplierId: 'SUP-1002', companyName: 'Medtronic Surgical Supplies', contactPerson: 'Laura Croft', phone: '+1 555-8802', email: 'sales@medtronic-supplies.com', address: '710 Medtronic Pkwy, Minneapolis, MN', suppliedCategories: ['Surgical Supplies', 'Medical Equipment'], rating: 5 },
    { supplierId: 'SUP-1003', companyName: 'Cardinal Health Logistics', contactPerson: 'James Gordon', phone: '+1 555-8803', email: 'support@cardinal-health.com', address: '7000 Cardinal Pl, Dublin, OH', suppliedCategories: ['PPE', 'Consumables', 'Laboratory Supplies'], rating: 4 },
  ]);

  // 8. Pharmacy Medicines
  const medicines = await Medicine.create([
    {
      medicineId: 'MED-1001',
      name: 'Amoxicillin & Clavulanate 625mg',
      genericName: 'Amoxicillin + Clavulanic Acid',
      category: 'Antibiotics',
      form: 'Tablet',
      strength: '625mg',
      supplier: suppliers[0]._id,
      batchNumber: 'AMX-2026-B1',
      manufacturingDate: new Date('2025-01-10'),
      expiryDate: new Date('2027-01-10'),
      purchasePrice: 4.5,
      sellingPrice: 12.0,
      stockQuantity: 280,
      reorderLevel: 50,
      unit: 'Strips',
      storageLocation: 'Shelf A1',
      status: 'Active',
    },
    {
      medicineId: 'MED-1002',
      name: 'Atorvastatin Calcium 20mg',
      genericName: 'Atorvastatin',
      category: 'Cardiovascular',
      form: 'Tablet',
      strength: '20mg',
      supplier: suppliers[0]._id,
      batchNumber: 'ATV-2025-C4',
      manufacturingDate: new Date('2024-11-01'),
      expiryDate: new Date('2026-11-01'),
      purchasePrice: 3.2,
      sellingPrice: 9.5,
      stockQuantity: 15, // LOW STOCK
      reorderLevel: 40,
      unit: 'Strips',
      storageLocation: 'Shelf B2',
      status: 'Active',
    },
    {
      medicineId: 'MED-1003',
      name: 'Paracetamol / Acetaminophen 500mg',
      genericName: 'Acetaminophen',
      category: 'Analgesics / Pain Relief',
      form: 'Tablet',
      strength: '500mg',
      supplier: suppliers[0]._id,
      batchNumber: 'PCM-2025-A9',
      manufacturingDate: new Date('2025-02-15'),
      expiryDate: new Date('2027-02-15'),
      purchasePrice: 0.8,
      sellingPrice: 3.0,
      stockQuantity: 650,
      reorderLevel: 100,
      unit: 'Strips',
      storageLocation: 'Shelf A3',
      status: 'Active',
    },
    {
      medicineId: 'MED-1004',
      name: 'Metformin Hydrochloride 500mg SR',
      genericName: 'Metformin',
      category: 'Antidiabetic',
      form: 'Tablet',
      strength: '500mg SR',
      supplier: suppliers[0]._id,
      batchNumber: 'MET-2024-D2',
      manufacturingDate: new Date('2024-04-01'),
      expiryDate: new Date('2026-09-15'), // EXPIRING SOON (< 90 days from late 2026 reference)
      purchasePrice: 2.0,
      sellingPrice: 6.5,
      stockQuantity: 120,
      reorderLevel: 30,
      unit: 'Strips',
      storageLocation: 'Shelf C1',
      status: 'Active',
    },
    {
      medicineId: 'MED-1005',
      name: 'Normal Saline (0.9% NaCl) 500ml',
      genericName: 'Sodium Chloride IV',
      category: 'IV Fluids & Electrolytes',
      form: 'IV Infusion',
      strength: '0.9% 500ml',
      supplier: suppliers[2]._id,
      batchNumber: 'NS-2025-E8',
      manufacturingDate: new Date('2025-03-01'),
      expiryDate: new Date('2027-03-01'),
      purchasePrice: 1.5,
      sellingPrice: 8.0,
      stockQuantity: 180,
      reorderLevel: 50,
      unit: 'Bottles',
      storageLocation: 'IV Storage Room',
      status: 'Active',
    },
  ]);

  // 9. Hospital Supplies & Inventory
  const inventoryItems = await InventoryItem.create([
    { itemId: 'ITM-1001', name: 'Sterile Surgical Gloves (Size 7.5)', category: 'Surgical Supplies', supplier: suppliers[1]._id, quantity: 450, unit: 'Pairs', unitPrice: 2.5, reorderLevel: 100, storageLocation: 'OR Supply Room 1', status: 'In Stock' },
    { itemId: 'ITM-1002', name: 'N95 Protective Respirator Masks', category: 'PPE', supplier: suppliers[2]._id, quantity: 8, unit: 'Boxes', unitPrice: 18.0, reorderLevel: 25, storageLocation: 'PPE Locker B', status: 'Low Stock' },
    { itemId: 'ITM-1003', name: 'Disposable Sterile Syringes 5ml with Needle', category: 'Consumables', supplier: suppliers[2]._id, quantity: 1200, unit: 'Units', unitPrice: 0.45, reorderLevel: 300, storageLocation: 'Ward Supply Rack', status: 'In Stock' },
    { itemId: 'ITM-1004', name: 'Non-Contact Infrared Thermometers', category: 'Medical Equipment', supplier: suppliers[1]._id, quantity: 24, unit: 'Units', unitPrice: 45.0, reorderLevel: 5, storageLocation: 'Biomedical Depot', status: 'In Stock' },
  ]);

  // 10. Wards and Beds
  const wards = await Ward.create([
    { name: 'Intensive Care Unit (ICU)', code: 'ICU-A', type: 'ICU', floor: '4th Floor, Critical Care Wing', capacity: 8, chargePerDay: 450, status: 'Active' },
    { name: 'General Ward (Male)', code: 'GWM-1', type: 'General Ward Male', floor: '2nd Floor, Wing A', capacity: 12, chargePerDay: 120, status: 'Active' },
    { name: 'General Ward (Female)', code: 'GWF-1', type: 'General Ward Female', floor: '2nd Floor, Wing B', capacity: 12, chargePerDay: 120, status: 'Active' },
    { name: 'Executive Deluxe Suite', code: 'DLX-S', type: 'Private Deluxe', floor: '5th Floor, VIP Wing', capacity: 6, chargePerDay: 350, status: 'Active' },
  ]);

  const beds = await Bed.create([
    { bedNumber: 'ICU-01', ward: wards[0]._id, status: BED_STATUSES.AVAILABLE, features: ['Oxygen Port', 'Ventilator Support', 'Cardiac Monitor', 'Motorized Bed'] },
    { bedNumber: 'ICU-02', ward: wards[0]._id, status: BED_STATUSES.AVAILABLE, features: ['Oxygen Port', 'Cardiac Monitor', 'Motorized Bed'] },
    { bedNumber: 'GWM-101', ward: wards[1]._id, status: BED_STATUSES.AVAILABLE, features: ['Oxygen Port', 'Nurse Call Bell'] },
    { bedNumber: 'GWM-102', ward: wards[1]._id, status: BED_STATUSES.AVAILABLE, features: ['Oxygen Port', 'Nurse Call Bell'] },
    { bedNumber: 'GWF-201', ward: wards[2]._id, status: BED_STATUSES.OCCUPIED, currentPatient: patients[3]._id, features: ['Oxygen Port', 'Cardiac Monitor', 'Nurse Call Bell'] },
    { bedNumber: 'GWF-202', ward: wards[2]._id, status: BED_STATUSES.AVAILABLE, features: ['Nurse Call Bell'] },
    { bedNumber: 'DLX-501', ward: wards[3]._id, status: BED_STATUSES.AVAILABLE, features: ['Private Bath', 'Companion Bed', 'Smart TV', 'Oxygen Port'] },
  ]);

  // 11. Patient Admission
  const admission = await Admission.create({
    admissionId: 'ADM-1001',
    patient: patients[3]._id,
    doctor: doctors[2]._id,
    ward: wards[2]._id,
    bed: beds[4]._id,
    admissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    admittingDiagnosis: 'Severe Osteoarthritis of Left Knee - Pre-Op Prep',
    reasonForAdmission: 'Scheduled Total Knee Arthroplasty (TKA)',
    status: ADMISSION_STATUSES.ADMITTED,
    dailyCareNotes: [
      {
        recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        recordedBy: users[6]._id,
        note: 'Patient admitted, pre-op vitals stable. IV cannula inserted in left forearm.',
        vitals: { bloodPressure: '128/82', pulse: 74, temperature: 98.6, spO2: 99 },
      },
    ],
    admittedBy: users[5]._id,
  });

  // Link admission on bed
  await Bed.findByIdAndUpdate(beds[4]._id, { currentAdmission: admission._id });

  // 12. Appointments
  const today = new Date();
  const appointments = await Appointment.create([
    {
      appointmentId: 'APT-1001',
      patient: patients[0]._id,
      doctor: doctors[0]._id,
      department: departments[0]._id,
      appointmentDate: today,
      timeSlot: '09:30 AM - 10:00 AM',
      type: 'In-Person Consultation',
      status: APPOINTMENT_STATUSES.CHECKED_IN,
      reasonForVisit: 'Routine cardiac checkup & blood pressure review',
      symptoms: ['Occasional mild palpitations', 'Fatigue on exertion'],
      checkedInAt: today,
      bookedBy: users[5]._id,
    },
    {
      appointmentId: 'APT-1002',
      patient: patients[1]._id,
      doctor: doctors[0]._id,
      department: departments[0]._id,
      appointmentDate: today,
      timeSlot: '11:00 AM - 11:30 AM',
      type: 'Follow-up',
      status: APPOINTMENT_STATUSES.SCHEDULED,
      reasonForVisit: 'Cholesterol panel review and lifestyle counseling',
      symptoms: ['None currently'],
      bookedBy: users[5]._id,
    },
    {
      appointmentId: 'APT-1003',
      patient: patients[2]._id,
      doctor: doctors[1]._id,
      department: departments[2]._id,
      appointmentDate: today,
      timeSlot: '02:00 PM - 02:30 PM',
      type: 'In-Person Consultation',
      status: APPOINTMENT_STATUSES.CONFIRMED,
      reasonForVisit: 'Annual pediatric developmental wellness check',
      symptoms: ['Slight dry cough for 2 days'],
      bookedBy: users[5]._id,
    },
  ]);

  // 13. Medical Records (EMR)
  const medicalRecord = await MedicalRecord.create({
    recordId: 'EMR-1001',
    patient: patients[0]._id,
    doctor: doctors[0]._id,
    appointment: appointments[0]._id,
    visitDate: today,
    chiefComplaint: 'Chest tightness after brisk walking, occasional shortness of breath.',
    symptoms: ['Substernal discomfort', 'Fatigue', 'Dyspnea on moderate exertion'],
    vitals: {
      bloodPressure: '138/88',
      pulse: 78,
      temperature: 98.4,
      spO2: 98,
      respiratoryRate: 16,
      weight: 82,
      height: 178,
      bmi: 25.9,
    },
    diagnosis: 'Essential Stage 1 Hypertension with Exertional Angina Suspect',
    icdCode: 'I10 / I20.9',
    treatmentPlan: 'Initiate statin therapy, adjust anti-hypertensive regimen, ordered resting ECG and lipid profile.',
    clinicalNotes: 'Heart sounds normal S1/S2, no murmurs. Lungs clear to auscultation bilaterally. Advised sodium restriction < 2g/day.',
    recommendedTests: [labTests[1]._id],
    followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  // 14. Prescriptions
  const prescription = await Prescription.create({
    prescriptionId: 'RX-1001',
    patient: patients[0]._id,
    doctor: doctors[0]._id,
    medicalRecord: medicalRecord._id,
    date: today,
    diagnosis: 'Stage 1 Hypertension & Hyperlipidemia',
    medicines: [
      {
        medicine: medicines[1]._id,
        name: 'Atorvastatin Calcium 20mg',
        dosage: '20mg',
        frequency: '0-0-1 (Once daily at bedtime)',
        duration: '30 days',
        instructions: 'Take after dinner at bedtime',
        quantity: 30,
        dispenseStatus: 'Pending',
      },
      {
        medicine: medicines[2]._id,
        name: 'Paracetamol / Acetaminophen 500mg',
        dosage: '500mg',
        frequency: '1-0-1 (As needed for pain/headache)',
        duration: '5 days',
        instructions: 'Take with water after meals when needed',
        quantity: 10,
        dispenseStatus: 'Pending',
      },
    ],
    generalAdvice: 'Limit dietary sodium to < 2g/day. Walk 30 minutes daily. Avoid smoking and alcohol.',
    status: PRESCRIPTION_STATUSES.PENDING,
  });

  // 15. Laboratory Reports
  const labReports = await LaboratoryReport.create([
    {
      reportId: 'LAB-R1001',
      test: labTests[1]._id,
      patient: patients[0]._id,
      doctor: doctors[0]._id,
      requestedDate: today,
      sampleCollectedDate: today,
      completedDate: today,
      status: LAB_STATUSES.COMPLETED,
      priority: 'Normal',
      results: [
        { parameter: 'Total Cholesterol', value: '235', unit: 'mg/dL', normalRange: '< 200', flag: 'High' },
        { parameter: 'HDL Cholesterol', value: '42', unit: 'mg/dL', normalRange: '> 40', flag: 'Normal' },
        { parameter: 'LDL Cholesterol', value: '158', unit: 'mg/dL', normalRange: '< 100', flag: 'High' },
        { parameter: 'Triglycerides', value: '175', unit: 'mg/dL', normalRange: '< 150', flag: 'High' },
      ],
      clinicalImpression: 'Mixed dyslipidemia with elevated LDL and total cholesterol.',
      remarks: 'Correlate clinically with cardiovascular risk factors.',
      performedBy: users[8]._id,
      verifiedBy: users[8]._id,
    },
    {
      reportId: 'LAB-R1002',
      test: labTests[0]._id,
      patient: patients[1]._id,
      doctor: doctors[0]._id,
      requestedDate: today,
      status: LAB_STATUSES.REQUESTED,
      priority: 'Normal',
      results: [
        { parameter: 'Hemoglobin', value: '', unit: 'g/dL', normalRange: '12.0 - 15.5' },
        { parameter: 'White Blood Cell (WBC)', value: '', unit: 'x10^3/uL', normalRange: '4.5 - 11.0' },
        { parameter: 'Platelet Count', value: '', unit: 'x10^3/uL', normalRange: '150 - 450' },
      ],
    },
  ]);

  // 16. Invoices & Billing
  const invoice1 = await Invoice.create({
    invoiceNumber: 'INV-2026-0001',
    patient: patients[0]._id,
    doctor: doctors[0]._id,
    appointment: appointments[0]._id,
    items: [
      { description: 'Cardiology Specialist Consultation (Dr. Marcus Brody)', category: 'Consultation', quantity: 1, unitPrice: 120, discountPercentage: 0, taxPercentage: 0, amount: 120 },
      { description: 'Lipid Profile Comprehensive Lab Test', category: 'Laboratory', quantity: 1, unitPrice: 55, discountPercentage: 0, taxPercentage: 5, amount: 57.75 },
    ],
    subTotal: 175.0,
    discountTotal: 0.0,
    taxTotal: 2.75,
    totalAmount: 177.75,
    paidAmount: 177.75,
    dueAmount: 0.0,
    paymentStatus: INVOICE_STATUSES.PAID,
    paymentMethod: PAYMENT_METHODS.CARD,
    billingDate: today,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    generatedBy: users[9]._id,
  });

  const invoice2 = await Invoice.create({
    invoiceNumber: 'INV-2026-0002',
    patient: patients[3]._id,
    doctor: doctors[2]._id,
    admission: admission._id,
    items: [
      { description: 'Inpatient Room & Bed Charges (GWF - 2 Days)', category: 'Room / Bed Charge', quantity: 2, unitPrice: 120, discountPercentage: 10, taxPercentage: 0, amount: 216.0 },
      { description: 'Orthopedic Specialist Daily Rounds (Dr. David Chen)', category: 'Consultation', quantity: 2, unitPrice: 110, discountPercentage: 0, taxPercentage: 0, amount: 220.0 },
      { description: 'Nursing Care & Monitoring Charges', category: 'Nursing Care', quantity: 2, unitPrice: 40, discountPercentage: 0, taxPercentage: 0, amount: 80.0 },
    ],
    subTotal: 540.0,
    discountTotal: 24.0,
    taxTotal: 0.0,
    totalAmount: 516.0,
    paidAmount: 300.0,
    dueAmount: 216.0,
    paymentStatus: INVOICE_STATUSES.PARTIALLY_PAID,
    paymentMethod: PAYMENT_METHODS.INSURANCE,
    billingDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    generatedBy: users[9]._id,
  });

  // 17. Payments
  await Payment.create([
    {
      paymentId: 'PAY-1001',
      invoice: invoice1._id,
      patient: patients[0]._id,
      amount: 177.75,
      paymentMethod: PAYMENT_METHODS.CARD,
      transactionReference: 'TXN-VISA-994102',
      status: 'Success',
      paymentDate: today,
      notes: 'Full payment cleared via POS terminal',
      receivedBy: users[9]._id,
    },
    {
      paymentId: 'PAY-1002',
      invoice: invoice2._id,
      patient: patients[3]._id,
      amount: 300.0,
      paymentMethod: PAYMENT_METHODS.INSURANCE,
      transactionReference: 'MEDICARE-PREAUTH-7721',
      status: 'Success',
      paymentDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      notes: 'Initial insurance co-pay authorization',
      receivedBy: users[9]._id,
    },
  ]);

  // 18. Notifications
  await Notification.create([
    { recipient: users[2]._id, title: 'New Appointment Check-in', message: 'Patient Robert Sterling (PAT-1001) has checked in for OPD-301.', type: 'Info', module: 'Appointments' },
    { targetRole: 'Pharmacist', title: 'Low Stock Alert', message: 'Atorvastatin 20mg is below reorder level (15 remaining).', type: 'Warning', module: 'Pharmacy' },
    { targetRole: 'Laboratory Staff', title: 'New Lab Request', message: 'CBC Test requested for patient Sophia Rodriguez.', type: 'Info', module: 'Laboratory' },
  ]);

  // 19. Initial Audit Log
  await AuditLog.create({
    user: users[0]._id,
    userName: 'Alexander Wright',
    userRole: 'Super Admin',
    action: 'SYSTEM_SEED',
    module: 'System',
    details: 'System database initialized with demo hospital dataset',
    ipAddress: '127.0.0.1',
  });

  console.log('✅ Demo database seeded successfully!');
  console.log('---------------------------------------------------------');
  console.log('👑 Super Admin:       admin@hospital.com       / Admin@123');
  console.log('🏥 Hospital Admin:    hospadmin@hospital.com   / Admin@123');
  console.log('🩺 Doctor (Cardio):   doctor@hospital.com      / Doctor@123');
  console.log('🩺 Doctor (Pediatric):pediatrician@hospital.com/ Doctor@123');
  console.log('🩺 Doctor (Ortho):    ortho@hospital.com       / Doctor@123');
  console.log('📋 Receptionist:      receptionist@hospital.com/ Staff@123');
  console.log('💉 Nurse:             nurse@hospital.com       / Staff@123');
  console.log('💊 Pharmacist:        pharmacist@hospital.com  / Staff@123');
  console.log('🔬 Lab Staff:         labtech@hospital.com     / Staff@123');
  console.log('💵 Accountant:        accountant@hospital.com  / Staff@123');
  console.log('---------------------------------------------------------');
};

// If run directly via node utils/seed.js
if (require.main === module) {
  require('dotenv').config();
  const { connectDB, disconnectDB } = require('../config/db');

  connectDB().then(async () => {
    await seedData();
    await disconnectDB();
    process.exit(0);
  });
}

module.exports = seedData;
