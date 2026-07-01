const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

// Public
router.post('/register', userController.register);
router.post('/login', userController.login);

// Logged-in user
router.get('/me', isAuthenticatedUser, userController.getMe);
router.put('/me', isAuthenticatedUser, userController.updateMe);

// Admin only
router.get('/admin/users', isAuthenticatedUser, authorizeRoles('admin'), userController.listUsers);
router.put('/admin/users/:id/status', isAuthenticatedUser, authorizeRoles('admin'), userController.setActiveStatus);
router.put('/admin/users/:id/role', isAuthenticatedUser, authorizeRoles('admin'), userController.setRole);
router.delete('/admin/users/:id', isAuthenticatedUser, authorizeRoles('admin'), userController.deleteUser);
router.put('/admin/users/:id/restore', isAuthenticatedUser, authorizeRoles('admin'), userController.restoreUser);

module.exports = router;