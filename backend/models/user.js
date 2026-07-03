const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
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
                len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' }
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: { msg: 'Must be a valid email address' }
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: { args: [6, 255], msg: 'Password must be at least 6 characters' }
            }
        },
        role: {
            type: DataTypes.ENUM('admin', 'user'),
            allowNull: false,
            defaultValue: 'user'
        },
        // Admin-controlled activate/deactivate (separate from soft delete)
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        underscored: true,
        paranoid: true,        // enables soft delete: destroy() sets deleted_at, restore() clears it
        deletedAt: 'deleted_at',
        defaultScope: {
            attributes: { exclude: ['password'] } // never leak password hash by default
        },
        scopes: {
            withPassword: { attributes: {} } // use User.scope('withPassword') for login checks
        },
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        }
    });

    // Instance helper for login
    User.prototype.checkPassword = function (plainPassword) {
        return bcrypt.compare(plainPassword, this.password);
    };

    return User;
};