const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { isAuthenticatedUser } = require('../middlewares/auth');
const upload = require('../utils/multer.js');

// Public
router.get('/product/:product_id', reviewController.getProductReviews);

// Logged-in buyer
router.post('/', isAuthenticatedUser, upload.single('photo'), reviewController.addReview);
router.put('/:id', isAuthenticatedUser, upload.single('photo'), reviewController.updateReview);
router.delete('/:id', isAuthenticatedUser, reviewController.deleteReview);

module.exports = router;