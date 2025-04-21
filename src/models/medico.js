const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Medico = sequelize.define("Medico", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  registro: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  especialidade: DataTypes.STRING,
  telefone: DataTypes.STRING,
  endereco: DataTypes.TEXT,
}, {
  tableName: "medico",
  timestamps: true,
});

module.exports = Medico;