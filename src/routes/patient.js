const express = require("express");
const router  = express.Router();

const Patient = require("../models/patient");
const Credential = require("../models/credential");

/**
 * @route   POST /patient
 * @desc    Registra os dados de um paciente e a sua credencial
 */
router.post("/", async (req, res) => {
  try {
    const { name, birth_date, phone_number, address, email } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios para registrar paciente." });
    }

    const existeCred = await Credential.findOne({ where: { email } });
    if (existeCred) {
      return res.status(400).json({ error: "E-mail já cadastrado para uma credencial." });
    }

    const cred = await Credential.create({ email });

    const patient = await Patient.create({
      name,
      birth_date,
      phone_number,
      address,
      email,
      credential_id: cred.id,
      has_password: false,
    });

    return res.status(201).json({
      message: "Paciente registrado com sucesso.",
      patient: {
        id: patient.id,
        email: patient.email,
        credential_id: cred.id
      },
    });
  } catch (err) {
    console.error("Erro ao registrar paciente:", err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ error: "Erro de validação ao registrar paciente.", details: messages });
    }
    return res.status(500).json({ error: "Erro interno no servidor ao registrar paciente." });
  }
});

/**
 * @route   GET /patient
 * @desc    Lista todos os pacientes
 */
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.findAll({ order: [["name", "ASC"]] });
    return res.json({ patients });
  } catch (err) {
    console.error("Erro ao listar pacientes:", err);
    return res.status(500).json({ error: "Falha ao listar pacientes.", details: err.message });
  }
});

/**
 * @route   GET /patient/:id
 * @desc    Consulta um paciente por ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({ error: "Paciente não encontrado." });
    }

    return res.json({ patient });
  } catch (err) {
    console.error("Erro ao consultar paciente por ID:", err);

    if (err.name === 'SequelizeDatabaseError' && err.original && err.original.code === '22P02') {
      return res.status(400).json({ error: 'ID do paciente inválido.' });
    }
    return res.status(500).json({ error: "Falha ao consultar paciente.", details: err.message });
  }
});

/**
 * @route   PUT /patient/:id
 * @desc    Edita um paciente por ID
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, birth_date, phone_number, address, credential_id, has_password } = req.body;

    let patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({ error: "Paciente não encontrado." });
    }

    if (email && email !== patient.email) {
      const existingPatientComEmail = await Patient.findOne({ where: { email, id: { [Op.ne]: patient.id } } });
      if (existingPatientComEmail) {
        return res.status(400).json({ error: "Email já cadastrado para outro paciente." });
      }
    }

    patient.name = name !== undefined ? name : patient.name;
    patient.email = email !== undefined ? email : patient.email;
    patient.birth_date = birth_date !== undefined ? birth_date : patient.birth_date;
    patient.phone_number = phone_number !== undefined ? phone_number : patient.phone_number;
    patient.address = address !== undefined ? address : patient.address;
    patient.credential_id = credential_id !== undefined ? credential_id : patient.credential_id;
    patient.has_password = has_password !== undefined ? has_password : patient.has_password;

    await patient.save();

    return res.json({ message: "Paciente atualizado com sucesso!", patient });
  } catch (err) {
    console.error("Erro ao atualizar paciente:", err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ error: "Erro de validação", details: messages });
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: "Erro de restrição: email já pode estar em uso.", details: err.errors.map(e => e.message) });
    }
    return res.status(500).json({ error: "Falha ao atualizar paciente.", details: err.message });
  }
});

/**
 * @route   DELETE /patient/:id
 * @desc    Deleta um paciente por ID
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({ error: "Paciente não encontrado." });
    }

    await patient.destroy();

    return res.json({ message: "Paciente removido com sucesso." });
  } catch (err) {
    console.error("Erro ao deletar paciente:", err);
    return res.status(500).json({ error: "Falha ao deletar paciente.", details: err.message });
  }
});

module.exports = router;