const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router
  .route('/')
  .get(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), getUsers)
  .post(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), createUser);

router
  .route('/:id')
  .get(getUserById)
  .put(authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN), updateUser)
  .delete(authorize(ROLES.SUPER_ADMIN), deleteUser);

module.exports = router;
