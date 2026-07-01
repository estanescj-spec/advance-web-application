const db = require('../models');
const Order = db.Order;
const OrderLine = db.OrderLine;
const Product = db.Product;
const Cart = db.Cart;
const Address = db.Address;
const User = db.User;
const sequelize = db.sequelize;

/* ============================================================
   CHECKOUT — builds an Order from the buyer's current Cart
   ============================================================ */
exports.createOrder = async (req, res) => {
    const buyerId = req.user.id;
    const { address_id, payment_method } = req.body;

    if (!address_id) {
        return res.status(400).json({ error: 'address_id is required' });
    }

    // confirm the address belongs to this buyer
    const address = await Address.findOne({ where: { id: address_id, user_id: buyerId } });
    if (!address) {
        return res.status(400).json({ error: 'Invalid delivery address' });
    }

    const cartItems = await Cart.findAll({ where: { user_id: buyerId }, include: [{ model: Product }] });
    if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Your cart is empty' });
    }

    const transaction = await sequelize.transaction();

    try {
        // validate stock and active status before creating anything
        for (const item of cartItems) {
            const product = item.Product;
            if (!product || !product.is_active) {
                await transaction.rollback();
                return res.status(400).json({ error: `A product in your cart is no longer available` });
            }
            if (product.stock_quantity < item.quantity) {
                await transaction.rollback();
                return res.status(400).json({
                    error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`
                });
            }
        }

        const order = await Order.create({
            buyer_id: buyerId,
            address_id,
            payment_method: payment_method || 'Cash on Delivery',
            status: 'pending'
        }, { transaction });

        let total = 0;

        for (const item of cartItems) {
            const product = item.Product;

            await OrderLine.create({
                order_id: order.id,
                product_id: product.id,
                quantity: item.quantity,
                price_at_purchase: product.sell_price
            }, { transaction });

            await product.update(
                { stock_quantity: product.stock_quantity - item.quantity },
                { transaction }
            );

            total += parseFloat(product.sell_price) * item.quantity;
        }

        // empty the cart now that it's been converted into an order
        await Cart.destroy({ where: { user_id: buyerId }, transaction });

        await transaction.commit();

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order_id: order.id,
            total_price: total
        });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return res.status(500).json({ error: 'Error processing checkout', details: error.message });
    }
};

/* ============================================================
   MY ORDER HISTORY (buyer)
   ============================================================ */
exports.getMyOrders = async (req, res) => {
    try {
        const buyerId = req.user.id;

        const orders = await Order.findAll({
            where: { buyer_id: buyerId },
            include: [
                { model: OrderLine, include: [{ model: Product }] },
                { model: Address }
            ],
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({ success: true, rows: orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching orders' });
    }
};

/* ============================================================
   SINGLE ORDER (buyer can only view their own)
   ============================================================ */
exports.getMyOrderById = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const { id } = req.params;

        const order = await Order.findOne({
            where: { id, buyer_id: buyerId },
            include: [
                { model: OrderLine, include: [{ model: Product }] },
                { model: Address }
            ]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        return res.status(200).json({ success: true, result: order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching order' });
    }
};

/* ============================================================
   ADMIN: ALL ORDERS
   ============================================================ */
exports.adminGetAllOrders = async (req, res) => {
    try {
        const { status } = req.query;
        const whereClause = status ? { status } : {};

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: OrderLine, include: [{ model: Product }] },
                { model: Address },
                { model: User, as: 'Buyer', attributes: ['id', 'name', 'email'] }
            ],
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({ success: true, rows: orders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching all orders' });
    }
};

/* ============================================================
   ADMIN: UPDATE ORDER STATUS (pending -> completed | cancelled)
   ============================================================ */
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
    }

    const order = await Order.findByPk(id, { include: [{ model: OrderLine }] });
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    // restore stock if admin is cancelling a still-pending order
    if (status === 'cancelled' && order.status === 'pending') {
        const transaction = await sequelize.transaction();
        try {
            for (const line of order.OrderLines) {
                const product = await Product.findByPk(line.product_id, { transaction });
                if (product) {
                    await product.update(
                        { stock_quantity: product.stock_quantity + line.quantity },
                        { transaction }
                    );
                }
            }
            await order.update({ status }, { transaction });
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            return res.status(500).json({ error: 'Error cancelling order' });
        }
    } else {
        await order.update({ status });
    }

    return res.status(200).json({ success: true, message: `Order status updated to ${status}`, order });
};

/* ============================================================
   BUYER: CANCEL THEIR OWN ORDER (only while still pending)
   ============================================================ */
exports.cancelOrder = async (req, res) => {
    const buyerId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({
        where: { id, buyer_id: buyerId },
        include: [{ model: OrderLine }]
    });

    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
        return res.status(400).json({ error: `Cannot cancel order. Current status: ${order.status}` });
    }

    const transaction = await sequelize.transaction();

    try {
        for (const line of order.OrderLines) {
            const product = await Product.findByPk(line.product_id, { transaction });
            if (product) {
                await product.update(
                    { stock_quantity: product.stock_quantity + line.quantity },
                    { transaction }
                );
            }
        }

        await order.update({ status: 'cancelled' }, { transaction });
        await transaction.commit();

        return res.status(200).json({ success: true, message: 'Order cancelled and stock restored' });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return res.status(500).json({ error: 'Error cancelling order', details: error.message });
    }
};