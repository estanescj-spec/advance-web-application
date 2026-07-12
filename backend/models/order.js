module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        buyer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        address_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'addresses',
                key: 'id'
            }
        },
        payment_method: {
            type: DataTypes.ENUM('Cash on Delivery', 'Credit Card', 'Debit Card', 'GCash'),
            allowNull: false,
            defaultValue: 'Cash on Delivery'
        },
        status: {
            type: DataTypes.ENUM('pending', 'shipped', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending'
        },
        date_placed: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'orders',
        timestamps: true,
        underscored: true
    });

    return Order;
};