const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

/* ============================================================
   MODEL DEFINERS
   ============================================================ */

// User Management
const UserDefiner = require('./user');               // role: 'user' | 'admin'
const CustomerProfileDefiner = require('./customerProfile');
const AddressDefiner = require('./address');

// Category Management
const CategoryDefiner = require('./category');

// Product Management
const ProductDefiner = require('./product');
const ProductCategoryDefiner = require('./productCategory');

// Cart Management
const CartDefiner = require('./cart');                // includes `quantity` column

// Review Management
const ReviewDefiner = require('./review');            // includes optional `order_id` for verified purchase

// Order Management
const OrderDefiner = require('./order');               // includes `status`: 'pending' | 'completed' | 'cancelled'
const OrderLineDefiner = require('./orderLine');

/* ============================================================
   INITIALIZE MODELS
   ============================================================ */

const db = {};

// User Management
db.User = UserDefiner(sequelize, DataTypes);
db.CustomerProfile = CustomerProfileDefiner(sequelize, DataTypes);
db.Address = AddressDefiner(sequelize, DataTypes);

// Category Management
db.Category = CategoryDefiner(sequelize, DataTypes);

// Product Management
db.Product = ProductDefiner(sequelize, DataTypes);
db.ProductCategory = ProductCategoryDefiner(sequelize, DataTypes);

// Cart Management
db.Cart = CartDefiner(sequelize, DataTypes);

// Review Management
db.Review = ReviewDefiner(sequelize, DataTypes);

// Order Management
db.Order = OrderDefiner(sequelize, DataTypes);
db.OrderLine = OrderLineDefiner(sequelize, DataTypes);

/* ============================================================
   ASSOCIATIONS
   ============================================================ */

// --- User Management ---
db.User.hasOne(db.CustomerProfile, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.CustomerProfile.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.Address, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Address.belongsTo(db.User, { foreignKey: 'user_id' });

// --- Category Management (many-to-many)
db.Product.belongsToMany(db.Category, {
   through: db.ProductCategory,
   foreignKey: 'product_id',
   otherKey: 'category_id',
   onDelete: 'RESTRICT'
});
db.Category.belongsToMany(db.Product, {
   through: db.ProductCategory,
   foreignKey: 'category_id',
   otherKey: 'product_id',
   onDelete: 'RESTRICT'
});

// --- Cart Management ---
db.User.hasMany(db.Cart, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Cart.belongsTo(db.User, { foreignKey: 'user_id' });

db.Product.hasMany(db.Cart, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Cart.belongsTo(db.Product, { foreignKey: 'product_id' });

// --- Review Management ---
db.Product.hasMany(db.Review, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Review.belongsTo(db.Product, { foreignKey: 'product_id' });

db.User.hasMany(db.Review, { foreignKey: 'customer_id', onDelete: 'CASCADE' });
db.Review.belongsTo(db.User, { as: 'Customer', foreignKey: 'customer_id' });

db.Order.hasMany(db.Review, { foreignKey: 'order_id', onDelete: 'SET NULL' });
db.Review.belongsTo(db.Order, { foreignKey: 'order_id' });

// --- Order Management ---
db.User.hasMany(db.Order, { foreignKey: 'buyer_id', onDelete: 'CASCADE' });
db.Order.belongsTo(db.User, { as: 'Buyer', foreignKey: 'buyer_id' });

db.Address.hasMany(db.Order, { foreignKey: 'address_id', onDelete: 'RESTRICT' });
db.Order.belongsTo(db.Address, { foreignKey: 'address_id' });

db.Order.hasMany(db.OrderLine, { foreignKey: 'order_id', onDelete: 'CASCADE' });
db.OrderLine.belongsTo(db.Order, { foreignKey: 'order_id' });

db.Product.hasMany(db.OrderLine, { foreignKey: 'product_id', onDelete: 'RESTRICT' });
db.OrderLine.belongsTo(db.Product, { foreignKey: 'product_id' });

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;