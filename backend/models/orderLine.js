module.exports = (sequelize, DataTypes) => {
    const OrderLine = sequelize.define('OrderLine', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'orders',
                key: 'id'
            }
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id'
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: { args: [1], msg: 'Quantity must be at least 1' }
            }
        },
        price_at_purchase: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: { args: [0], msg: 'Price at purchase cannot be negative' }
            }
        }
    }, {
        tableName: 'order_lines',
        timestamps: true,
        underscored: true
    });

    return OrderLine;
};