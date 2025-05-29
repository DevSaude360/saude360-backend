const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Patient extends Model {}
Patient.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  credential_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "credential", key: "id" },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  birthDate: DataTypes.DATE,
  phone_number: DataTypes.STRING,
  address: DataTypes.TEXT,
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  has_password: {
    allowNull: false,
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  sequelize,
  modelName: "Patient",
  tableName: "patient",
  underscored: true,
  timestamps: true,
});

module.exports = Patient;
