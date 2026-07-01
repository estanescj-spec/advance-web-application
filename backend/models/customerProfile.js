module.exports = (sequelize, DataTypes) => {
    const CustomerProfile = sequelize.define('CustomerProfile', {
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
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                is: {
                    args: /^[0-9+\-\s()]{7,20}$/,
                    msg: 'Phone number format is invalid'
                }
            }
        },
        image_path: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                is: {
                    args: /\.(jpg|jpeg|png|webp)$/i,
                    msg: 'Image path must end in .jpg, .jpeg, .png, or .webp'
                }
            }
        }
    }, {
        tableName: 'customer_profiles',
        timestamps: true,
        underscored: true
    });

    return CustomerProfile;
};