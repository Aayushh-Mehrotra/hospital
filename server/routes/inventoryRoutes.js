const express = require('express');
const router = express.Router();
const {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  adjustInventoryStock,
  getInventoryTransactions,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/transactions', getInventoryTransactions);

router
  .route('/items')
  .get(getInventoryItems)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.PHARMACIST), createInventoryItem);

router
  .route('/items/:id')
  .get(getInventoryItemById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.PHARMACIST), updateInventoryItem);

router.post(
  '/items/:id/adjust-stock',
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.PHARMACIST),
  adjustInventoryStock
);

module.exports = router;
