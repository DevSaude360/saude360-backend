const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Paciente = require("../models/pacienteLogin");
const Medico = require("../models/medicoLogin");

const router = express.Router();

/**
 * @route   POST /auth/register/paciente
 * @desc    Registra um novo paciente
 * @access  Público
 */
router.post("/register/paciente", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingPaciente = await Paciente.findOne({ where: { email } });
    if (existingPaciente) {
      return res.status(400).json({ error: "E-mail já cadastrado!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const paciente = await Paciente.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "Paciente registrado com sucesso!", paciente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /auth/register/medico
 * @desc    Registra um novo medico
 * @access  Público
 */
router.post("/register/medico", async (req, res) => {
  try {
    const { name, email, crm, password } = req.body;

    const existingMedico = await Medico.findOne({ where: { email } });
    if (existingMedico) {
      return res.status(400).json({ error: "E-mail já cadastrado!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const medico = await Medico.create({ name, email, crm, password: hashedPassword });

    res.status(201).json({ message: "Paciente registrado com sucesso!", medico });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error);
  }
});

/**
 * @route   POST /auth/login/paciente
 * @desc    Autentica o paciente e gera um token JWT
 * @access  Público
 */
router.post("/login/paciente", async (req, res) => {
  try {
    const { email, password } = req.body;

    const paciente = await Paciente.findOne({ where: { email } });
    if (!paciente) {
      return res.status(401).json({ error: "E-mail ou senha inválidos!" });
    }

    const hashFromDB = String(paciente.password).trim();

    const isMatch = await bcrypt.compare(password, hashFromDB);

    if (!isMatch) {
      return res.status(401).json({ error: "E-mail ou senha inválidos!" });
    }

    const token = jwt.sign({ id: paciente.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login bem-sucedido!", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /auth/login/medico
 * @desc    Autentica o medico e gera um token JWT
 * @access  Público
 */
router.post("/login/medico", async (req, res) => {
  try {
    const { email, password } = req.body;

    const medico = await Medico.findOne({ where: { email } });
    if (!medico) {
      return res.status(401).json({ error: "E-mail ou senha inválidos!" });
    }

    const hashFromDB = String(medico.password).trim();

    const isMatch = await bcrypt.compare(password, hashFromDB);

    if (!isMatch) {
      return res.status(401).json({ error: "E-mail ou senha inválidos!" });
    }

    const token = jwt.sign({ id: medico.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login bem-sucedido!", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
