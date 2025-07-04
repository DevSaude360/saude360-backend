const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Prescription extends Model {}

Prescription.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    medication_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dosage: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    frequency: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    duration: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    additional_instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'ACTIVE',
        allowNull: false,
    },
    appointment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "appointments",
            key: "id"
        }
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "patients",
            key: "id"
        }
    }
}, {
    sequelize,
    modelName: "Prescription",
    tableName: "prescriptions",
    underscored: true,
    timestamps: true,
});

module.exports = Prescription;
