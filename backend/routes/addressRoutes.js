const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { isAuthenticatedUser } = require('../middlewares/auth');

router.get('/my', isAuthenticatedUser, addressController.getMyAddresses);
router.post('/my', isAuthenticatedUser, addressController.addAddress);
router.delete('/my/:id', isAuthenticatedUser, addressController.deleteAddress);
router.put('/my/:id/default', isAuthenticatedUser, addressController.setDefault);

module.exports = router;
