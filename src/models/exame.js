const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");
const Paciente = require("./Paciente");

class Exame extends Model {}
Exame.init({
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
  tipo_exame: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data_solicitacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  data_coleta: {
    type: DataTypes.DATE,
  },
  data_resultado: {
    type: DataTypes.DATE,
  },
  resultado: {
    type: DataTypes.TEXT,
  },
  unidade: {
    type: DataTypes.STRING,
  },
  valor_referencia: {
    type: DataTypes.STRING,
  },
  observacoes: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM("solicitado", "coletado", "processado", "finalizado"),
    defaultValue: "solicitado",
  },
}, {
  sequelize,
  modelName: "Exame",
  tableName: "exame",
  underscored: true,
  timestamps: true,
});

module.exports = Exame;
