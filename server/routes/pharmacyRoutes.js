const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  adjustMedicineStock,
  deleteMedicine,
} = require('../controllers/pharmacyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router
  .route('/medicines')
  .get(getMedicines)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.PHARMACIST), createMedicine);

router
  .route('/medicines/:id')
  .get(getMedicineById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.PHARMACIST), updateMedicine)
  .delete(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), deleteMedicine);

router.post(
  '/medicines/:id/adjust-stock',
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.PHARMACIST),
  adjustMedicineStock
);

module.exports = router;
