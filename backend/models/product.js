module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Name cannot be empty' },
                len: { args: [2, 255], msg: 'Name must be between 2 and 255 characters' }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        cost_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: { args: [0], msg: 'Cost price cannot be negative' }
            }
        },
        sell_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: { args: [0], msg: 'Sell price cannot be negative' }
            }
        },
        stock_quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: { args: [0], msg: 'Stock quantity cannot be negative' }
            }
        },
        color: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        storage: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        img_path: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isValidImagePath(value) {
                    if (!value) return;
                    if (!/\.(jpg|jpeg|png|webp)$/i.test(value)) {
                        throw new Error('Image path must end in .jpg, .jpeg, .png, or .webp');
                    }
                }
            }
        }
    }, {
        tableName: 'products',
        timestamps: true,
        underscored: true,
        paranoid: true,
        deletedAt: 'deleted_at'
    });

    return Product;
};