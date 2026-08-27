const express = require('express');
const router = express.Router();
const {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require('../controllers/medicalRecordController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router
  .route('/')
  .get(getMedicalRecords)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR), createMedicalRecord);

router
  .route('/:id')
  .get(getMedicalRecordById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR), updateMedicalRecord)
  .delete(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), deleteMedicalRecord);

module.exports = router;
