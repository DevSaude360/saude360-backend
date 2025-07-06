const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./Patient');

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Patient,
            key: 'id',
        },
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    iconName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'folder',
    },
    colorHex: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '#757575',
    },
}, {
    tableName: 'category',
    timestamps: true,
});

Category.belongsTo(Patient, { foreignKey: 'patient_id' });
Patient.hasMany(Category, { foreignKey: 'patient_id' });


module.exports = Category;
