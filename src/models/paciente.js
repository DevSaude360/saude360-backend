const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Paciente extends Model {}
Paciente.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  credencial_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "credencial", key: "id" },
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
}, {
  sequelize,
  modelName: "Paciente",
  tableName: "paciente",
  underscored: true,
  timestamps: true,
});

module.exports = Paciente;
