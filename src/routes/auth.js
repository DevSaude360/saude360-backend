const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Medico      = require("../models/paciente");
const PacienteLogin = require("../models/pacienteLogin");
const Paciente    = require("../models/medico");
const MedicoLogin   = require("../models/medicoLogin");

const router = express.Router();

/**
 * @route   POST /auth/register/paciente
 * @desc    Registra os dados de login de um paciente
 */
router.post("/register/paciente", async (req, res) => {
  try {
    const { pacienteId, email, password } = req.body;

    const perfil = await Paciente.findByPk(pacienteId);
    if (!perfil) {
      return res.status(404).json({ error: "Paciente não encontrado" });
    }

    const exists = await PacienteLogin.findOne({
      where: { 
        [Sequelize.Op.or]: [
          { paciente_id: pacienteId },
          { email }
        ]
      }
    });
    if (exists) {
      return res.status(400).json({ error: "Login já cadastrado para este paciente ou e‑mail já usado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const login = await PacienteLogin.create({
      paciente_id: pacienteId,
      email,
      password: hash,
    });

    return res.status(201).json({ message: "Login de paciente criado", login });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route   POST /auth/register/medico
 * @desc    Registra os dados de login de um medico
 */
router.post("/register/medico", async (req, res) => {
  try {
    const { medicoId, email, password } = req.body;

    const perfil = await Medico.findByPk(medicoId);
    if (!perfil) {
      return res.status(404).json({ error: "Médico não encontrado" });
    }

    const exists = await MedicoLogin.findOne({
      where: {
        [Sequelize.Op.or]: [
          { medico_id: medicoId },
          { email }
        ]
      }
    });
    if (exists) {
      return res.status(400).json({ error: "Login já cadastrado para este médico ou e‑mail já usado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const login = await MedicoLogin.create({
      medico_id: medicoId,
      email,
      password: hash,
    });

    return res.status(201).json({ message: "Login de médico criado", login });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route   POST /auth/login/paciente
 * @desc    Autentica o paciente e gera um token JWT
 */
router.post("/login/paciente", async (req, res) => {
  try {
    const { email, password } = req.body;
    const login = await PacienteLogin.findOne({ where: { email } });
    if (!login) {
      return res.status(401).json({ error: "E‑mail ou senha inválidos" });
    }

    const match = await bcrypt.compare(password, login.password.trim());
    if (!match) {
      return res.status(401).json({ error: "E‑mail ou senha inválidos" });
    }

    const token = jwt.sign(
      { pacienteId: login.paciente_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ message: "Login bem‑sucedido", token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * @route   POST /auth/login/medico
 * @desc    Autentica o medico e gera um token JWT
 */
router.post("/login/medico", async (req, res) => {
  try {
    const { email, password } = req.body;
    const login = await MedicoLogin.findOne({ where: { email } });
    if (!login) {
      return res.status(401).json({ error: "E‑mail ou senha inválidos" });
    }

    const match = await bcrypt.compare(password, login.password.trim());
    if (!match) {
      return res.status(401).json({ error: "E‑mail ou senha inválidos" });
    }

    const token = jwt.sign(
      { medicoId: login.medico_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ message: "Login bem‑sucedido", token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
