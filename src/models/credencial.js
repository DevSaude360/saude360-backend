const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Credencial extends Model {}
Credencial.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
}, {
    sequelize,
    modelName: "Credencial",
    tableName: "credencial",
    underscored: true,
    timestamps: true,
});

module.exports = Credencial;
