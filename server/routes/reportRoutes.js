const express = require('express');
const router = express.Router();
const {
  getFinancialReport,
  getClinicalReport,
  getAppointmentReport,
  getPatientReport,
  getInventoryReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/financial', getFinancialReport);
router.get('/clinical', getClinicalReport);
router.get('/appointments', getAppointmentReport);
router.get('/patients', getPatientReport);
router.get('/inventory', getInventoryReport);

module.exports = router;
