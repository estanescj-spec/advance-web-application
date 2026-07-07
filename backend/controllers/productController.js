const db = require('../models');
const Product = db.Product;
const Category = db.Category;
const Review = db.Review;
const User = db.User;
const { Op } = require('sequelize');

function toTrimmedString(value) {
    if (value === undefined || value === null) return '';
    return String(value).trim();
}

function parseStrictPrice(value, fieldName) {
    const text = toTrimmedString(value);
    if (text === '') return { error: `${fieldName} is required` };

    const number = Number(text);
    if (!Number.isFinite(number)) return { error: `${fieldName} must be a valid number` };
    if (number <= 0) return { error: `${fieldName} must be greater than 0` };

    return { value: number };
}

function parseStockQuantity(value) {
    const text = toTrimmedString(value);
    if (text === '') return { value: 0 };

    const number = Number(text);
    if (!Number.isFinite(number) || !Number.isInteger(number)) {
        return { error: 'stock_quantity must be a whole number' };
    }
    if (number < 0) return { error: 'stock_quantity cannot be negative' };

    return { value: number };
}

function parseBoolean(value, defaultValue = true) {
    if (value === undefined || value === null || value === '') return defaultValue;
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return defaultValue;
}

function parseCategoryIds(rawCategoryIds, rawCategoryId) {
    if (Array.isArray(rawCategoryIds) && rawCategoryIds.length) {
        return rawCategoryIds.map(id => parseInt(id)).filter(Number.isFinite);
    }

    if (typeof rawCategoryIds === 'string' && rawCategoryIds.trim()) {
        try {
            const parsed = JSON.parse(rawCategoryIds);
            if (Array.isArray(parsed)) {
                return parsed.map(id => parseInt(id)).filter(Number.isFinite);
            }
        } catch {
            return rawCategoryIds
                .split(',')
                .map(id => parseInt(id.trim()))
                .filter(Number.isFinite);
        }
    }

    if (rawCategoryId !== undefined && rawCategoryId !== null && rawCategoryId !== '') {
        return [parseInt(rawCategoryId)].filter(Number.isFinite);
    }

    return null;
}

async function validateCategoryIds(categoryIds) {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) return { error: 'At least one category is required' };

    const uniqueIds = [...new Set(categoryIds)];
    const found = await Category.findAll({ where: { id: uniqueIds } });
    if (found.length !== uniqueIds.length) {
        return { error: 'One or more selected categories do not exist' };
    }

    return { value: uniqueIds };
}

    function buildValidationMessage(error, fallbackMessage) {
        if (error && Array.isArray(error.errors) && error.errors.length) {
            return error.errors.map(err => err.message).join(', ');
        }

        if (error && error.message) {
            return error.message;
        }

        return fallbackMessage;
    }
/* ============================================================
   PUBLIC: LIST PRODUCTS (with filters) — only active products
   ============================================================ */
exports.getAllProducts = async (req, res) => {
    try {
        const { category, min_price, max_price, storage, color, rating, availability, search } = req.query;

        let whereClause = { is_active: true };
        let categoryWhere = {};

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        if (category) {
            categoryWhere.name = category;
        }

        if (min_price || max_price) {
            whereClause.sell_price = {};
            if (min_price) whereClause.sell_price[Op.gte] = parseFloat(min_price);
            if (max_price) whereClause.sell_price[Op.lte] = parseFloat(max_price);
        }

        if (storage) {
            whereClause.storage = { [Op.like]: `%${storage}%` };
        }

        if (color) {
            whereClause.color = { [Op.like]: `%${color}%` };
        }

        if (availability) {
            if (availability === 'in_stock') {
                whereClause.stock_quantity = { [Op.gt]: 0 };
            } else if (availability === 'low_stock') {
                whereClause.stock_quantity = { [Op.and]: [{ [Op.gt]: 0 }, { [Op.lte]: 5 }] };
            } else if (availability === 'out_of_stock') {
                whereClause.stock_quantity = 0;
            }
        }

        let products = await Product.findAll({
            where: whereClause,
            include: [
                { model: Category, where: categoryWhere },
                { model: Review }
            ]
        });

        if (rating) {
            const reqRating = parseFloat(rating);
            products = products.filter(p => {
                if (p.Reviews.length === 0) return reqRating === 0;
                const avg = p.Reviews.reduce((sum, r) => sum + r.rating, 0) / p.Reviews.length;
                return avg >= reqRating;
            });
        }

        return res.status(200).json({ success: true, rows: products });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching products', details: error.message });
    }
};

/* ============================================================
   PUBLIC: GET SINGLE PRODUCT (with category + reviews)
   ============================================================ */
exports.getSingleProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { id: req.params.id, is_active: true },
            include: [
                { model: Category },
                {
                    model: Review,
                    include: [{ model: User, as: 'Customer', attributes: ['id', 'name'] }]
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        return res.status(200).json({ success: true, result: product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching product' });
    }
};

/* ============================================================
   ADMIN: LIST ALL PRODUCTS (active + inactive, optional deleted)
   ============================================================ */
exports.adminGetAllProducts = async (req, res) => {
    try {
        const includeDeleted = req.query.include_deleted === 'true';

        const products = await Product.findAll({
            include: [{ model: Category }],
            order: [['id', 'DESC']],
            paranoid: !includeDeleted
        });

        return res.status(200).json({ success: true, rows: products });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching products' });
    }
};

/* ============================================================
   ADMIN: CREATE PRODUCT
   ============================================================ */
exports.createProduct = async (req, res) => {
    try {
        const name = toTrimmedString(req.body.name);
        const description = toTrimmedString(req.body.description);
        const color = toTrimmedString(req.body.color);
        const storage = toTrimmedString(req.body.storage);
        const { category_id, category_ids } = req.body;
        const costPrice = parseStrictPrice(req.body.cost_price, 'cost_price');
        const sellPrice = parseStrictPrice(req.body.sell_price, 'sell_price');
        const stock = parseStockQuantity(req.body.stock_quantity);

        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }
        if (name.length < 2 || name.length > 255) {
            return res.status(400).json({ error: 'name must be between 2 and 255 characters' });
        }

        if (costPrice.error) return res.status(400).json({ error: costPrice.error });
        if (sellPrice.error) return res.status(400).json({ error: sellPrice.error });
        if (stock.error) return res.status(400).json({ error: stock.error });
        if (sellPrice.value <= costPrice.value) {
            return res.status(400).json({ error: 'sell_price must be greater than cost_price' });
        }

        const categoriesToSet = parseCategoryIds(category_ids, category_id);
        const categoryCheck = await validateCategoryIds(categoriesToSet);
        if (categoryCheck.error) {
            return res.status(400).json({ error: categoryCheck.error });
        }

        let images = [];
        if (req.files && req.files.length) {
            images = req.files.map(f => 'images/' + f.filename);
        }

        const product = await Product.create({
            name,
            description,
            cost_price: costPrice.value,
            sell_price: sellPrice.value,
            stock_quantity: stock.value,
            color,
            storage,
            images,
            is_active: parseBoolean(req.body.is_active, true)
        });

        // Associate categories (accept single category_id or category_ids array)
        await product.setCategories(categoryCheck.value);

        return res.status(201).json({ success: true, message: 'Product created successfully', product });
    } catch (error) {
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ error: buildValidationMessage(error, 'Invalid product data') });
        }
        console.error(error);
            return res.status(500).json({ error: 'Error creating product', details: error.parent?.sqlMessage || error.message, query: error.sql });
    }
};

/* ============================================================
   ADMIN: UPDATE PRODUCT
   ============================================================ */
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const name = req.body.name !== undefined ? toTrimmedString(req.body.name) : undefined;
        const description = req.body.description !== undefined ? toTrimmedString(req.body.description) : undefined;
        const color = req.body.color !== undefined ? toTrimmedString(req.body.color) : undefined;
        const storage = req.body.storage !== undefined ? toTrimmedString(req.body.storage) : undefined;
        const { category_id, category_ids } = req.body;
        const costPrice = req.body.cost_price !== undefined ? parseStrictPrice(req.body.cost_price, 'cost_price') : null;
        const sellPrice = req.body.sell_price !== undefined ? parseStrictPrice(req.body.sell_price, 'sell_price') : null;
        const stock = req.body.stock_quantity !== undefined ? parseStockQuantity(req.body.stock_quantity) : null;
        const isActiveProvided = req.body.is_active !== undefined;

        const product = await Product.findByPk(id, { paranoid: false });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.deleted_at) {
            return res.status(409).json({ error: 'Restore this product before editing it' });
        }

        if (name !== undefined && (name.length < 2 || name.length > 255)) {
            return res.status(400).json({ error: 'name must be between 2 and 255 characters' });
        }
        if (costPrice && costPrice.error) return res.status(400).json({ error: costPrice.error });
        if (sellPrice && sellPrice.error) return res.status(400).json({ error: sellPrice.error });
        if (stock && stock.error) return res.status(400).json({ error: stock.error });

        const effectiveCost = costPrice ? costPrice.value : Number(product.cost_price);
        const effectiveSell = sellPrice ? sellPrice.value : Number(product.sell_price);
        if (effectiveSell <= effectiveCost) {
            return res.status(400).json({ error: 'sell_price must be greater than cost_price' });
        }

        let images = product.images || [];
        if (req.files && req.files.length) {
            images = req.files.map(f => 'images/' + f.filename);
        }

        await product.update({
            name: name !== undefined && name !== '' ? name : product.name,
            description: description !== undefined ? description : product.description,
            cost_price: costPrice ? costPrice.value : product.cost_price,
            sell_price: sellPrice ? sellPrice.value : product.sell_price,
            stock_quantity: stock ? stock.value : product.stock_quantity,
            color: color !== undefined ? color : product.color,
            storage: storage !== undefined ? storage : product.storage,
            images,
            is_active: isActiveProvided
                ? parseBoolean(req.body.is_active, product.is_active)
                : product.is_active
        });

        // Update category associations if provided
        const categoriesToSet = parseCategoryIds(category_ids, category_id);
        if (categoriesToSet !== null) {
            const categoryCheck = await validateCategoryIds(categoriesToSet);
            if (categoryCheck.error) {
                return res.status(400).json({ error: categoryCheck.error });
            }
            await product.setCategories(categoryCheck.value);
        }

        return res.status(200).json({ success: true, message: 'Product updated successfully', product });
    } catch (error) {
            if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ error: buildValidationMessage(error, 'Invalid product data') });
        }
        console.error(error);
        return res.status(500).json({ error: 'Error updating product', details: error.parent?.sqlMessage || error.message, query: error.sql });
    }
};

/* ============================================================
   ADMIN: ACTIVATE / DEACTIVATE
   ============================================================ */
exports.setActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await product.update({ is_active });

        return res.status(200).json({
            success: true,
            message: `Product ${is_active ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error updating product status' });
    }
};

/* ============================================================
   ADMIN: SOFT DELETE
   ============================================================ */
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await product.destroy(); // soft delete
        return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error deleting product' });
    }
};

/* ============================================================
   ADMIN: RESTORE
   ============================================================ */
exports.restoreProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id, { paranoid: false });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await product.restore();
        return res.status(200).json({ success: true, message: 'Product restored successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error restoring product' });
    }
};