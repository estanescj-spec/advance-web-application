module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: { msg: 'Category name cannot be empty' },
                len: { args: [2, 100], msg: 'Category name must be between 2 and 100 characters' }
            }
        }
    }, {
        tableName: 'categories',
        timestamps: true,
        underscored: true
    });

    return Category;
};