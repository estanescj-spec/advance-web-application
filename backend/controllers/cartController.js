const db = require('../models');
const Cart = db.Cart;
const Product = db.Product;

/* ============================================================
   GET MY CART
   ============================================================ */
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cartItems = await Cart.findAll({
            where: { user_id: userId },
            include: [{ model: Product }]
        });

        return res.status(200).json({ success: true, rows: cartItems });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching cart' });
    }
};

/* ============================================================
   ADD TO CART (or increase quantity if it's already in there)
   ============================================================ */
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, quantity } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'product_id is required' });
        }

        const qtyToAdd = quantity ? parseInt(quantity) : 1;
        if (qtyToAdd < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const [item, created] = await Cart.findOrCreate({
            where: { user_id: userId, product_id },
            defaults: { quantity: qtyToAdd }
        });

        if (!created) {
            await item.update({ quantity: item.quantity + qtyToAdd });
        }

        return res.status(200).json({ success: true, message: 'Added to cart', item });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error(error);
        return res.status(500).json({ error: 'Error adding to cart', details: error.message });
    }
};

/* ============================================================
   UPDATE QUANTITY (set to an exact number)
   ============================================================ */
exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params; // cart row id
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        const item = await Cart.findOne({ where: { id, user_id: userId } });
        if (!item) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        await item.update({ quantity: parseInt(quantity) });
        return res.status(200).json({ success: true, message: 'Cart updated', item });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error(error);
        return res.status(500).json({ error: 'Error updating cart item' });
    }
};

/* ============================================================
   REMOVE ONE ITEM FROM CART
   ============================================================ */
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params; // cart row id

        const deleted = await Cart.destroy({ where: { id, user_id: userId } });
        if (!deleted) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        return res.status(200).json({ success: true, message: 'Removed from cart' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error removing from cart' });
    }
};

/* ============================================================
   CLEAR ENTIRE CART (e.g. after checkout)
   ============================================================ */
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        await Cart.destroy({ where: { user_id: userId } });
        return res.status(200).json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error clearing cart' });
    }
};