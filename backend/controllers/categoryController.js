const db = require('../models');
const Category = db.Category;
const Product = db.Product;

/* ============================================================
   PUBLIC: LIST ACTIVE CATEGORIES
   ============================================================ */
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { is_active: true },
            order: [['name', 'ASC']]
        });
        return res.status(200).json({ success: true, rows: categories });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching categories' });
    }
};

/* ============================================================
   PUBLIC: GET SINGLE CATEGORY (with its active products)
   ============================================================ */
exports.getSingleCategory = async (req, res) => {
    try {
        const category = await Category.findOne({
            where: { id: req.params.id, is_active: true },
            include: [{ model: Product, where: { is_active: true }, required: false }]
        });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        return res.status(200).json({ success: true, result: category });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching category' });
    }
};

/* ============================================================
   ADMIN: LIST ALL CATEGORIES (active + inactive)
   ============================================================ */
exports.adminGetAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ order: [['name', 'ASC']] });
        return res.status(200).json({ success: true, rows: categories });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error fetching categories' });
    }
};

/* ============================================================
   ADMIN: CREATE CATEGORY
   ============================================================ */
exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const existing = await Category.findOne({ where: { name } });
        if (existing) {
            return res.status(409).json({ error: 'A category with this name already exists' });
        }

        const category = await Category.create({ name });
        return res.status(201).json({ success: true, message: 'Category created successfully', category });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error(error);
        return res.status(500).json({ error: 'Error creating category' });
    }
};

/* ============================================================
   ADMIN: UPDATE CATEGORY
   ============================================================ */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        if (name && name !== category.name) {
            const existing = await Category.findOne({ where: { name } });
            if (existing) {
                return res.status(409).json({ error: 'A category with this name already exists' });
            }
        }

        await category.update({ name: name || category.name });
        return res.status(200).json({ success: true, message: 'Category updated successfully', category });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error(error);
        return res.status(500).json({ error: 'Error updating category' });
    }
};

/* ============================================================
   ADMIN: ACTIVATE / DEACTIVATE
   ============================================================ */
exports.setActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        await category.update({ is_active });

        return res.status(200).json({
            success: true,
            message: `Category ${is_active ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error updating category status' });
    }
};

/* ============================================================
   ADMIN: DELETE CATEGORY (hard delete — blocked if products exist)
   ============================================================ */
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // With many-to-many relationship, check join table via association helper
        const productCount = await category.countProducts();
        if (productCount > 0) {
            return res.status(409).json({
                error: `Cannot delete category — ${productCount} product(s) still assigned to it. Reassign or remove them first.`
            });
        }

        await category.destroy(); // hard delete — no paranoid mode on Category
        return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        // covers the DB-level RESTRICT constraint too, as a safety net
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ error: 'Cannot delete category — products are still assigned to it' });
        }
        console.error(error);
        return res.status(500).json({ error: 'Error deleting category' });
    }
};