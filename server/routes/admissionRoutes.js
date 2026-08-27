const express = require('express');
const router = express.Router();
const {
  getAdmissions,
  getAdmissionById,
  createAdmission,
  addDailyCareNote,
  dischargePatient,
} = require('../controllers/admissionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router
  .route('/')
  .get(getAdmissions)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.NURSE), createAdmission);

router.route('/:id').get(getAdmissionById);

router.post(
  '/:id/daily-notes',
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR, ROLES.NURSE),
  addDailyCareNote
);

router.post(
  '/:id/discharge',
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR),
  dischargePatient
);

module.exports = router;
