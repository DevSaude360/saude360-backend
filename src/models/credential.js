const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database"); // Ajuste o caminho se necessário

class Credential extends Model {}

Credential.init({
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
    modelName: "Credential",
    tableName: "credential",
    underscored: true,
    timestamps: true,
});

module.exports = Credential;
