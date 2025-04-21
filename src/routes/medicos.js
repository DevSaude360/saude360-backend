const express = require("express");
const router  = express.Router();

const Medico = require("../models/Medico");

/**
 * @route   POST /medicos
 * @desc    Cadastra um novo médico
 */
router.post("/", async (req, res) => {
  try {
    const { name, registro, especialidade, telefone, endereco } = req.body;

    const exists = await Medico.findOne({ where: { registro } });
    if (exists) {
      return res.status(400).json({ error: "Registro já cadastrado para outro médico" });
    }

    const medico = await Medico.create({
      name,
      registro,
      especialidade,
      telefone,
      endereco
    });

    return res.status(201).json({ message: "Médico cadastrado", medico });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /medicos
 * @desc    Lista todos os médicos
 */
router.get("/", async (req, res) => {
  try {
    const medicos = await Medico.findAll({ order: [["id", "ASC"]] });
    return res.json({ medicos });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;