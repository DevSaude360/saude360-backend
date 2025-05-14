const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Consulta extends Model {}
Consulta.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  paciente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "paciente", key: "id" },
  },
  medico_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "medico", key: "id" },
  },
  data_consulta: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  motivo: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "agendada",
  },
}, {
  sequelize,
  modelName: "Consulta",
  tableName: "consulta",
  underscored: true,
  timestamps: true,
});

module.exports = Consulta;