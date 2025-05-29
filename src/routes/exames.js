const express = require("express");
const router  = express.Router();
const Exame    = require("../models/exame");
const Patient = require("../models/patient");

/**
 * @route   POST /exames
 * @desc    Cadastra um novo exame para um paciente
 */
router.post("/", async (req, res) => {
  try {
    const {
      patientId,
      tipoExame,
      dataColeta,
      resultado,
      unidade,
      valorReferencia,
      observacoes
    } = req.body;

    const perfil = await Patient.findByPk(patientId);
    if (!perfil) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    const exame = await Exame.create({
      patient_id: patientId,
      tipo_exame: tipoExame,
      data_coleta: dataColeta,
      resultado,
      unidade,
      valor_referencia: valorReferencia,
      observacoes,
      status: dataColeta ? "coletado" : "solicitado",
    });

    return res.status(201).json({ message: "Exame cadastrado", exame });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /exames/patient/:patientId
 * @desc    Lista todos os exames de um paciente
 */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const exames = await Exame.findAll({
      where: { patient_id: req.params.patientId },
      order: [["data_solicitacao", "DESC"]],
    });
    return res.json({ exames });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /exames/:id
 * @desc    Busca um exame específico por ID
 */
router.get("/:id", async (req, res) => {
  try {
    const exame = await Exame.findByPk(req.params.id, {
      include: [{ model: Patient, attributes: ["id", "name", "crm"] }]
    });
    if (!exame) {
      return res.status(404).json({ error: "Exame não encontrado" });
    }
    return res.json({ exame });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;