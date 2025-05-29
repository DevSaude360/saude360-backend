const sequelize   = require("../config/database");

const Credential = require("./credential");
const Patient   = require("./patient");
const Professional = require("./professional");

const Appointment   = require("./appointment");
const Exame      = require("./Exame");

Credential.hasOne(Patient,   { foreignKey: "credential_id" });
Patient.belongsTo(Credential, { foreignKey: "credential_id" });

Credential.hasOne(Professional,     { foreignKey: "credential_id" });
Professional.belongsTo(Credential,  { foreignKey: "credential_id" });

Patient.hasMany(Appointment, { foreignKey: "patient_id", as: "appointments" });
Appointment.belongsTo(Patient, { foreignKey: "patient_id", as: "patient" });

Professional.hasMany(Appointment, { foreignKey: "professional_id", as: "appointments" });
Appointment.belongsTo(Professional, { foreignKey: "professional_id", as: "professional" });

Patient.hasMany(Exame,       { foreignKey: "patient_id" });
Exame.belongsTo(Patient,     { foreignKey: "patient_id" });

module.exports = {
    sequelize,
    Credential,
    Patient,
    Professional,
    Appointment,
    Exame,
};