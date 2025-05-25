const express = require("express");
const router  = express.Router();

const Paciente = require("../models/Paciente");

/**
 * @route   POST /pacientes
 * @desc    Cadastra um novo paciente
 */ 
router.post("/", async (req, res) => {
  try {
    const { name, email, data_nascimento, telefone, endereco } = req.body;

    const existingPaciente = await Paciente.findOne({ where: { email } });
    if (existingPaciente) {
      return res.status(400).json({ error: "Email já cadastrado para outro paciente" });
    }

    const paciente = await Paciente.create({
      name,
      email,
      data_nascimento,
      telefone,
      endereco
    });

    return res.status(201).json({ message: "Paciente cadastrado", paciente });
  } catch (err) {
    console.error("Erro ao cadastrar paciente:", err);
    return res.status(500).json({ error: "Falha ao cadastrar paciente", details: err.message });
  }
});


/**
 * @route   GET /pacientes
 * @desc    Lista todos os pacientes
 */
router.get("/", async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({ order: [["id", "ASC"]] });
    return res.json({ pacientes });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;