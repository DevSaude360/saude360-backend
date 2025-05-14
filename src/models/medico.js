const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Medico extends Model {}
Medico.init({
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
},  {
  sequelize,
  modelName: "Medico",
  tableName: "medico",
  underscored: true,
  timestamps: true,
});

module.exports = Medico;
