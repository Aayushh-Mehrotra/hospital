const express = require('express');
const router = express.Router();
const {
  getWards,
  createWard,
  updateWard,
  getBeds,
  createBed,
  updateBed,
} = require('../controllers/wardBedController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

// Wards
router
  .route('/wards')
  .get(getWards)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), createWard);

router
  .route('/wards/:id')
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), updateWard);

// Beds
router
  .route('/beds')
  .get(getBeds)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.NURSE), createBed);

router
  .route('/beds/:id')
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.NURSE, ROLES.RECEPTIONIST), updateBed);

module.exports = router;
