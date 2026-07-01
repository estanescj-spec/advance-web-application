const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

// Logged-in buyer
router.post('/', isAuthenticatedUser, orderController.createOrder);
router.get('/my', isAuthenticatedUser, orderController.getMyOrders);
router.get('/my/:id', isAuthenticatedUser, orderController.getMyOrderById);
router.put('/:id/cancel', isAuthenticatedUser, orderController.cancelOrder);

// Admin only
router.get('/admin/all', isAuthenticatedUser, authorizeRoles('admin'), orderController.adminGetAllOrders);
router.put('/admin/:id/status', isAuthenticatedUser, authorizeRoles('admin'), orderController.updateOrderStatus);

module.exports = router;