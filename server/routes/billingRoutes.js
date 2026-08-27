const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
} = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router
  .route('/invoices')
  .get(getInvoices)
  .post(
    authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.ACCOUNTANT, ROLES.RECEPTIONIST),
    createInvoice
  );

router
  .route('/invoices/:id')
  .get(getInvoiceById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.ACCOUNTANT), updateInvoice);

module.exports = router;
