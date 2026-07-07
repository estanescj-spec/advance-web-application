const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const { censoringProfanityFilter } = require('../middlewares/profanityFilter');
const upload = require('../utils/multer.js');

// Public
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getSingleProduct);

// Admin only
router.get('/admin/all', isAuthenticatedUser, authorizeRoles('admin'), productController.adminGetAllProducts);
router.post('/admin', isAuthenticatedUser, authorizeRoles('admin'), censoringProfanityFilter('name', 'description'), upload.array('images', 5), productController.createProduct);
router.put('/admin/:id', isAuthenticatedUser, authorizeRoles('admin'), censoringProfanityFilter('name', 'description'), upload.array('images', 5), productController.updateProduct);
router.put('/admin/:id/status', isAuthenticatedUser, authorizeRoles('admin'), productController.setActiveStatus);
router.delete('/admin/:id', isAuthenticatedUser, authorizeRoles('admin'), productController.deleteProduct);
router.put('/admin/:id/restore', isAuthenticatedUser, authorizeRoles('admin'), productController.restoreProduct);

module.exports = router;