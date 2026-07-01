module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define('Review', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'products',
                key: 'id'
            }
        },
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // set this to enforce "verified purchase" reviews in your controller
            references: {
                model: 'orders',
                key: 'id'
            }
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: { args: [1], msg: 'Rating must be at least 1' },
                max: { args: [5], msg: 'Rating cannot be more than 5' }
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        photo_path: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                is: {
                    args: /\.(jpg|jpeg|png|webp)$/i,
                    msg: 'Photo path must end in .jpg, .jpeg, .png, or .webp'
                }
            }
        }
    }, {
        tableName: 'reviews',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['product_id', 'customer_id'] } // one review per customer per product
        ]
    });

    return Review;
};