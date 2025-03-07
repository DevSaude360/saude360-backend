const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PacienteLogin = sequelize.define("PacienteLogin", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
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
},{
    timestamps: true,
    tableName: "paciente_login",
  }
);

module.exports = PacienteLogin;