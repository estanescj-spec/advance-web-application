module.exports = (sequelize, DataTypes) => {
    const Address = sequelize.define('Address', {
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
        address_line: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Address line cannot be empty' },
                len: { args: [5, 255], msg: 'Address line must be between 5 and 255 characters' }
            }
        },
        zipcode: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Zipcode cannot be empty' },
                is: {
                    args: /^[0-9A-Za-z\- ]{3,20}$/,
                    msg: 'Zipcode format is invalid'
                }
            }
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'City cannot be empty' },
                is: {
                    args: /^[A-Za-z\s.'-]{2,100}$/,
                    msg: 'City must contain only letters, spaces, and punctuation'
                }
            }
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'addresses',
        timestamps: true,
        underscored: true,
        hooks: {
            // Ensure only one default address per user
            beforeSave: async (address, options) => {
                if (address.is_default) {
                    await sequelize.models.Address.update(
                        { is_default: false },
                        {
                            where: { user_id: address.user_id, id: { [sequelize.Sequelize.Op.ne]: address.id || 0 } },
                            transaction: options.transaction
                        }
                    );
                }
            },
            // If the default address is deleted, promote the next oldest remaining address
            afterDestroy: async (address, options) => {
                if (address.is_default) {
                    const nextAddress = await sequelize.models.Address.findOne({
                        where: { user_id: address.user_id },
                        order: [['created_at', 'ASC']],
                        transaction: options.transaction
                    });
                    if (nextAddress) {
                        await nextAddress.update(
                            { is_default: true },
                            { transaction: options.transaction }
                        );
                    }
                }
            }
        }
    });

    return Address;
};