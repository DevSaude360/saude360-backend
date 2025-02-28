const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/**
 * @route   POST /auth/register
 * @desc    Registra um novo usuário
 * @access  Público
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "E-mail já cadastrado!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "Usuário registrado com sucesso!", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /auth/login
 * @desc    Autentica o usuário e gera um token JWT
 * @access  Público
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "E-mail ou senha inválidos!" });
    }

    const hashFromDB = String(user.password).trim();

    const isMatch = await bcrypt.compare(password, hashFromDB);

    if (!isMatch) {
      return res.status(401).json({ error: "E-mail ou senha inválidos!" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login bem-sucedido!", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/test-compare", async (req, res) => {
  try {
    const { password, hash } = req.body;

    const isMatch = await bcrypt.compare(password, hash);

    res.json({ isMatch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
