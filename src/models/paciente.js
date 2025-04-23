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
  data_nascimento: DataTypes.DATE,
  telefone: DataTypes.STRING,
  endereco: DataTypes.TEXT,
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
  tableName: "paciente",
  timestamps: true,
});

module.exports = Paciente;
