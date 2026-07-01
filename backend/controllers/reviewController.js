const db = require('../models');
const Review = db.Review;
const Order = db.Order;
const OrderLine = db.OrderLine;
const User = db.User;

/* ============================================================
   ADD REVIEW (verified purchase only — must have a completed order)
   ============================================================ */
exports.addReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, rating, comment } = req.body;

        if (!product_id || !rating) {
            return res.status(400).json({ error: 'product_id and rating are required' });
        }

        // find a completed order by this buyer that contains this product
        const verifiedOrder = await Order.findOne({
            where: { buyer_id: userId, status: 'completed' },
            include: [{
                model: OrderLine,
                where: { product_id: parseInt(product_id) }
            }]
        });

        if (!verifiedOrder) {
            return res.status(403).json({
                error: 'Only verified buyers with a completed order for this product can leave a review'
            });
        }

        let imagePath = null;
        if (req.file) {
            imagePath = 'images/' + req.file.filename;
        }

        const review = await Review.create({
            product_id: parseInt(product_id),
            customer_id: userId,
            order_id: verifiedOrder.id,
            rating: parseInt(rating),
            comment: comment || null,
            photo_path: imagePath
        });

        return res.status(201).json({ success: true, message: 'Review submitted successfully', review });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'You have already reviewed this product. Update your existing review instead.' });
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error(error);
        return res.status(500).json({ error: 'Error submitting review', details: error.message });
    }
};

/* ============================================================
   UPDATE MY REVIEW
   ============================================================ */
exports.updateReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { rating, comment } = req.body;

        const review = await Review.findOne({ where: { id, customer_id: userId } });
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        let imagePath = review.photo_path;
        if (req.file) {
            imagePath = 'images/' + req.file.filename;
        }

        await review.update({
            rating: rating !== undefined ? parseInt(rating) : review.rating,
            comment: comment !== undefined ? comment : review.comment,
            photo_path: imagePath
        });

        return res.status(200).json({ success: true, message: 'Review updated successfully', review });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error(error);
        return res.status(500).json({ error: 'Error updating review' });
    }
};

/* ============================================================
   DELETE MY REVIEW
   ============================================================ */
exports.deleteReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const deleted = await Review.destroy({ where: { id, customer_id: userId } });
        if (!deleted) {
            return res.status(404).json({ error: 'Review not found' });
        }

        return res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error deleting review' });
    }
};

/* ============================================================
   GET REVIEWS FOR A PRODUCT (public)
   ============================================================ */
exports.getProductReviews = async (req, res) => {
    try {
        const { product_id } = req.params;

        const reviews = await Review.findAll({
            where: { product_id },
            include: [{ model: User, as: 'Customer', attributes: ['id', 'name'] }],
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({ success: true, rows: reviews });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching reviews' });
    }
};