const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op }       = require("sequelize");
const Credencial   = require("../models/Credencial");
const Paciente     = require("../models/Paciente");
const Medico       = require("../models/Medico");

const router = express.Router();

/**
 * @route   POST /auth/register/paciente
 * @desc    Registra os dados de login de um paciente
 */
router.post("/register/paciente", async (req, res) => {
  try {
    const { name, data_nascimento, telefone, endereco, email, password } = req.body;

    const existeCred = await Credencial.findOne({ where: { email } });
    if (existeCred) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const cred = await Credencial.create({ email, password: hash });

    const paciente = await Paciente.create({
      name,
      data_nascimento,
      telefone,
      endereco,
      email,
      credencial_id: cred.id,
    });

    return res.status(201).json({
      message: "Paciente registrado com sucesso",
      paciente,
    });
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
    const { name, registro, especialidade, telefone, email, password } = req.body;

    const existe = await Credencial.findOne({
      where: { email }
    });
    if (existe) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    const hash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const cred = await Credencial.create({ email, password: hash });

    const medico = await Medico.create({
      name,
      registro,
      especialidade,
      telefone,
      email,
      credencial_id: cred.id,
    });

    return res.status(201).json({
      message: "Médico registrado com sucesso",
      medico,
    });
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

    const cred = await Credencial.findOne({ where: { email } });
    if (!cred) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    const match = await bcrypt.compare(password, cred.password);
    if (!match) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    const paciente = await Paciente.findOne({
      where: { credencial_id: cred.id },
    });
    if (!paciente) {
      return res.status(404).json({ error: "Perfil de paciente não encontrado" });
    }

    const token = jwt.sign(
        { pacienteId: paciente.id },
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

    const cred = await Credencial.findOne({ where: { email } });
    if (!cred) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    const match = await bcrypt.compare(password, cred.password);
    if (!match) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    const medico = await Medico.findOne({
      where: { credencial_id: cred.id },
    });
    if (!medico) {
      return res.status(404).json({ error: "Perfil de médico não encontrado" });
    }

    const token = jwt.sign(
        { medicoId: medico.id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    return res.json({ message: "Login bem-sucedido", token });
  } catch (err) {
    console.error("Erro no login de médico:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

module.exports = router;
