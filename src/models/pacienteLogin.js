const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Paciente = require("./Paciente");

const PacienteLogin = sequelize.define("PacienteLogin", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "paciente",
      key: "id",
    },
  },
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
  tableName: "paciente_login",
  timestamps: true,
});

PacienteLogin.belongsTo(Paciente, { foreignKey: "paciente_id" });
Paciente.hasOne(PacienteLogin, { foreignKey: "paciente_id" });

module.exports = PacienteLogin;