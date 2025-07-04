const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Exam extends Model {}

Exam.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patient',
      key: 'id',
    }
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'appointments',
      key: 'id'
    }
  },
  examType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  requestDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  collectionDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resultDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  referenceValue: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'exam_statuses',
      key: 'id',
    }
  },
}, {
  sequelize,
  modelName: "Exam",
  tableName: "exams",
  underscored: true,
  timestamps: true,
});

module.exports = Exam;