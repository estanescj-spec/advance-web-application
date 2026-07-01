const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

// Admin only — all analytics endpoints
router.get('/summary', isAuthenticatedUser, authorizeRoles('admin'), reportController.getSalesSummary);
router.get('/revenue-over-time', isAuthenticatedUser, authorizeRoles('admin'), reportController.getRevenueOverTime);
router.get('/top-products', isAuthenticatedUser, authorizeRoles('admin'), reportController.getTopProducts);
router.get('/order-volume', isAuthenticatedUser, authorizeRoles('admin'), reportController.getOrderVolumeOverTime);

module.exports = router;