const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Medico = require("./medico");

const MedicoLogin = sequelize.define("MedicoLogin", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  medico_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "medico",
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
  tableName: "medico_login",
  timestamps: true,
});

MedicoLogin.belongsTo(Medico, { foreignKey: "medico_id" });
Medico.hasOne(MedicoLogin, { foreignKey: "medico_id" });

module.exports = MedicoLogin;