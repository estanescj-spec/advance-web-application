const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const { censoringProfanityFilter } = require('../middlewares/profanityFilter');

// Public
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getSingleCategory);

// Admin only
router.get('/admin/all', isAuthenticatedUser, authorizeRoles('admin'), categoryController.adminGetAllCategories);
router.post('/admin', isAuthenticatedUser, authorizeRoles('admin'), censoringProfanityFilter('name'), categoryController.createCategory);
router.put('/admin/:id', isAuthenticatedUser, authorizeRoles('admin'), censoringProfanityFilter('name'), categoryController.updateCategory);
router.put('/admin/:id/status', isAuthenticatedUser, authorizeRoles('admin'), categoryController.setActiveStatus);
router.delete('/admin/:id', isAuthenticatedUser, authorizeRoles('admin'), categoryController.deleteCategory);

module.exports = router;