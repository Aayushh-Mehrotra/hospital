const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router
  .route('/')
  .get(getDoctors)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), createDoctor);

router
  .route('/:id')
  .get(getDoctorById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR), updateDoctor)
  .delete(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), deleteDoctor);

module.exports = router;
