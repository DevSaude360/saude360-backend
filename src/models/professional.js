const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Professional extends Model {}
Professional.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  credential_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "credential", key: "id" },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  register: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  specialty: DataTypes.STRING,
  phone_number: DataTypes.STRING,
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
},  {
  sequelize,
  modelName: "Professional",
  tableName: "professional",
  underscored: true,
  timestamps: true,
});

module.exports = Professional;
