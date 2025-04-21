const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Paciente = require("./Paciente");
const Medico   = require("./Medico");

const Consulta = sequelize.define("Consulta", {
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
  tableName: "consulta",
  timestamps: true,
});

Consulta.belongsTo(Paciente, { foreignKey: "paciente_id" });
Paciente.hasMany(Consulta, { foreignKey: "paciente_id" });

Consulta.belongsTo(Medico, { foreignKey: "medico_id" });
Medico.hasMany(Consulta, { foreignKey: "medico_id" });

module.exports = Consulta;