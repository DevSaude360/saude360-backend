const express = require("express");
const router  = express.Router();
const Exame    = require("../models/exame");
const Paciente = require("../models/Paciente");

/**
 * @route   POST /exames
 * @desc    Cadastra um novo exame para um paciente
 */
router.post("/", async (req, res) => {
  try {
    const {
      pacienteId,
      tipoExame,
      dataColeta,
      resultado,
      unidade,
      valorReferencia,
      observacoes
    } = req.body;

    const perfil = await Paciente.findByPk(pacienteId);
    if (!perfil) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    const exame = await Exame.create({
      paciente_id: pacienteId,
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
 * @route   GET /exames/paciente/:pacienteId
 * @desc    Lista todos os exames de um paciente
 */
router.get("/paciente/:pacienteId", async (req, res) => {
  try {
    const exames = await Exame.findAll({
      where: { paciente_id: req.params.pacienteId },
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
      include: [{ model: Paciente, attributes: ["id", "name", "crm"] }]
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