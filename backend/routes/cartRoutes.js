const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticatedUser } = require('../middlewares/auth');

// All cart routes require login (buyer's own cart)
router.get('/', isAuthenticatedUser, cartController.getCart);
router.post('/', isAuthenticatedUser, cartController.addToCart);
router.put('/:id', isAuthenticatedUser, cartController.updateCartItem);
router.delete('/:id', isAuthenticatedUser, cartController.removeFromCart);
router.delete('/', isAuthenticatedUser, cartController.clearCart);

module.exports = router;