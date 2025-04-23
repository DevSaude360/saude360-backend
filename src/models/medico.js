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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      this.setDataValue("password", value);
    },
  },
}, {
  tableName: "medico",
  timestamps: true,
});

module.exports = Medico;
