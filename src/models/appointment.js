const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Appointment extends Model {}
Appointment.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Patient", key: "id" },
  },
  professional_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Professional", key: "id" },
  },
  appointment_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
  },
  status_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  professional_rejection_reason: { type: DataTypes.TEXT, allowNull: true, },
  professional_suggested_date: { type: DataTypes.DATE, allowNull: true, },
  professional_suggestion_reason: { type: DataTypes.TEXT, allowNull: true, },
  patient_reschedule_rejection_reason: { type: DataTypes.TEXT, allowNull: true, },
  patient_suggestion_reason: { type: DataTypes.TEXT, allowNull: true, }
}, {
  sequelize,
  modelName: "Appointment",
  tableName: "appointments",
  underscored: true,
  timestamps: true,
});

module.exports = Appointment;