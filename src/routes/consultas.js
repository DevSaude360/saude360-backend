const express = require("express");
const router  = express.Router();
const Consulta = require("../models/consulta");
const Paciente = require("../models/Paciente");
const Medico   = require("../models/Medico");

/**
 * @route   POST /consultas
 * @desc    Agenda uma nova consulta
 */
router.post("/", async (req, res) => {
  try {
    const { pacienteId, medicoId, dataConsulta, motivo } = req.body;

    const perfilPac = await Paciente.findByPk(pacienteId);
    if (!perfilPac) return res.status(404).json({ error: "Paciente não encontrado" });

    const perfilMed = await Medico.findByPk(medicoId);
    if (!perfilMed) return res.status(404).json({ error: "Médico não encontrado" });

    const nova = await Consulta.create({
      paciente_id: pacienteId,
      medico_id: medicoId,
      data_consulta: dataConsulta,
      motivo,
    });

    res.status(201).json({ message: "Consulta agendada", consulta: nova });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @routes   GET /consultas/paciente/:pacienteId
 * @desc     Lista todas as consultas de um paciente
 */
router.get("/paciente/:pacienteId", async (req, res) => {
  try {
    const consultas = await Consulta.findAll({
      where: { paciente_id: req.params.pacienteId },
      include: [{ model: Medico, attributes: ["id", "name", "registro", "especialidade"] }],
      order: [["data_consulta", "ASC"]],
    });
    res.json({ consultas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @routes   GET /consultas/medico/:medicoId
 * @desc     Lista todas as consultas de um médico (todos os pacientes)
 */
router.get("/medico/:medicoId", async (req, res) => {
  try {
    const consultas = await Consulta.findAll({
      where: { medico_id: req.params.medicoId },
      include: [{ model: Paciente, attributes: ["id", "name", "crm"] }],
      order: [["data_consulta", "ASC"]],
    });
    res.json({ consultas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @router   GET /consultas/medico/:medicoId/paciente/:pacienteId
 * @desc     Lista consultas de um médico para um paciente específico
 */
router.get("/medico/:medicoId/paciente/:pacienteId", async (req, res) => {
  try {
    const { medicoId, pacienteId } = req.params;
    const consultas = await Consulta.findAll({
      where: { medico_id: medicoId, paciente_id: pacienteId },
      order: [["data_consulta", "ASC"]],
    });
    res.json({ consultas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;