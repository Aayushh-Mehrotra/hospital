const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router
  .route('/')
  .get(getDepartments)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), createDepartment);

router
  .route('/:id')
  .get(getDepartmentById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), updateDepartment)
  .delete(authorize(ROLES.SUPER_ADMIN), deleteDepartment);

module.exports = router;
