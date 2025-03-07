const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MedicoLogin = sequelize.define("MedicoLogin", {
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
  crm: {
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
    tableName: "medico_login",
  }
);

module.exports = MedicoLogin;