const sequelize   = require("../config/database");

const Credencial = require("./Credencial");
const Paciente   = require("./Paciente");
const Medico     = require("./Medico");
const Consulta   = require("./Consulta");
const Exame      = require("./Exame");

Credencial.hasOne(Paciente,   { foreignKey: "credencial_id" });
Paciente.belongsTo(Credencial, { foreignKey: "credencial_id" });

Credencial.hasOne(Medico,     { foreignKey: "credencial_id" });
Medico.belongsTo(Credencial,  { foreignKey: "credencial_id" });

Paciente.hasMany(Consulta,    { foreignKey: "paciente_id" });
Consulta.belongsTo(Paciente,  { foreignKey: "paciente_id" });

Medico.hasMany(Consulta,      { foreignKey: "medico_id" });
Consulta.belongsTo(Medico,    { foreignKey: "medico_id" });

Paciente.hasMany(Exame,       { foreignKey: "paciente_id" });
Exame.belongsTo(Paciente,     { foreignKey: "paciente_id" });

module.exports = {
    sequelize,
    Credencial,
    Paciente,
    Medico,
    Consulta,
    Exame,
};