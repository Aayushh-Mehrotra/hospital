const express = require('express');
const router = express.Router();
const { getPayments, recordPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router
  .route('/')
  .get(getPayments)
  .post(
    authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.ACCOUNTANT, ROLES.RECEPTIONIST),
    recordPayment
  );

module.exports = router;
