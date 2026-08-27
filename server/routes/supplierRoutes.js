const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router
  .route('/')
  .get(getSuppliers)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), createSupplier);

router
  .route('/:id')
  .get(getSupplierById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), updateSupplier);

module.exports = router;
