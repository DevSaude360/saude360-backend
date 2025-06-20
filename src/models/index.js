const sequelize   = require("../config/database");

const Credential = require("./credential");
const Patient   = require("./patient");
const Professional = require("./professional");
const Appointment   = require("./appointment");
const Exam = require('./Exam');
const ExamStatus = require('./ExamStatus');
const Document = require('./Document');

Credential.hasOne(Patient,   { foreignKey: "credential_id" });
Patient.belongsTo(Credential, { foreignKey: "credential_id" });

Credential.hasOne(Professional,     { foreignKey: "credential_id" });
Professional.belongsTo(Credential,  { foreignKey: "credential_id" });

Patient.hasMany(Appointment, { foreignKey: "patient_id", as: "appointments" });
Appointment.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

Professional.hasMany(Appointment, { foreignKey: "professional_id", as: "appointments" });
Appointment.belongsTo(Professional, { foreignKey: "professional_id", as: "professional" });

Exam.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Patient.hasMany(Exam, { foreignKey: 'patient_id', as: 'exams' });

Exam.belongsTo(ExamStatus, { foreignKey: 'status_id', as: 'status' });
ExamStatus.hasMany(Exam, { foreignKey: 'status_id' });

Patient.hasMany(Document, { foreignKey: 'patient_id', as: 'documents' });
Document.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

module.exports = {
    sequelize,
    Credential,
    Patient,
    Professional,
    Appointment,
    Exam,
    Document,
};