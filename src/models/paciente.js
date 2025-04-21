const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Paciente = sequelize.define("Paciente", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  crm: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  data_nascimento: DataTypes.DATE,
  telefone: DataTypes.STRING,
  endereco: DataTypes.TEXT,
}, {
  tableName: "paciente",
  timestamps: true,
});

module.exports = Paciente;