const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op }   = require("sequelize");

const Medico   = require("../models/Medico");
const Paciente    = require("../models/paciente");

const router = express.Router();

/**
 * @route   POST /auth/register/paciente
 * @desc    Registra os dados de login de um paciente
 */
router.post("/register/paciente", async (req, res) => {
  try {
    const {
      name,
      data_nascimento,
      telefone,
      endereco,
      email,
      password
    } = req.body;

    const existe = await Paciente.findOne({
      where: {
        [Op.or]: [
          { email }
        ]
      }
    });
    if (existe) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const paciente = await Paciente.create({
      name,
      data_nascimento,
      telefone,
      endereco,
      email,
      password: hash,
    });

    return res
      .status(201)
      .json({ message: "Paciente registrado com sucesso", paciente });
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
    const {
      name,
      registro,
      especialidade,
      telefone,
      email,
      password
    } = req.body;

    const existe = await Medico.findOne({
      where: {
        [Op.or]: [
          { email },
          { registro }
        ]
      }
    });
    if (existe) {
      return res.status(400).json({ error: "E-mail ou registro já cadastrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const medico = await Medico.create({
      name,
      registro,
      especialidade,
      telefone,
      email,
      password: hash,
    });

    return res.status(201).json({ message: "Médico registrado com sucesso", medico });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

/**
 * @route   POST /auth/login/paciente
 * @desc    Autentica o paciente e gera um token JWT
 */
router.post("/login/paciente", async (req, res) => {
  try {
    const { email, password } = req.body;

    const login = await PacienteLogin.findOne({ where: { email } });
    if (!login) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    const match = await bcrypt.compare(password, login.password.trim());
    if (!match) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    const token = jwt.sign(
      { pacienteId: login.paciente_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ message: "Login bem-sucedido", token });
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

    const medico = await Medico.findOne({ where: { email } });
    if (!medico) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    const match = await bcrypt.compare(password, medico.password.trim());
    if (!match) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    const token = jwt.sign(
      { medicoId: medico.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ message: "Login bem-sucedido", token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
