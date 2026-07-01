module.exports = (sequelize, DataTypes) => {
    const Cart = sequelize.define('Cart', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
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
        }
    }, {
        tableName: 'carts',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['user_id', 'product_id'] } // prevent duplicate rows for the same product
        ]
    });

    return Cart;
};