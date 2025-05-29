const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Credential = require("../models/credential");
const Patient = require("../models/patient");
const Profissional = require("../models/professional");

const router = express.Router();
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

/**
 * @route   POST /authentication/init-password
 * @desc    Define a senha inicial para a credencial de um usuário
 */
router.post("/init-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }

    const cred = await Credential.findOne({ where: { email } });
    if (!cred) {
      return res.status(404).json({ error: "Credencial não encontrada para este e-mail." });
    }

    if (cred.password) {
      return res.status(400).json({ error: "Senha já configurada para esta credencial." });
    }

    const patient = await Patient.findOne({ where: { credential_id: cred.id } });
    const profissional = await Profissional.findOne({ where: { credential_id: cred.id } });

    if (!patient && !profissional) {
      return res.status(404).json({ error: "Nenhum perfil de usuário (paciente ou profissional) encontrado associado a este e-mail." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await cred.update({ password: hash });

    let userTypeMessage = "";
    if (patient) {
      await patient.update({ has_password: true });
      userTypeMessage = "patient";
    } else if (profissional) {
      await profissional.update({ has_password: true });
      userTypeMessage = "profissional";
    }

    return res.status(200).json({ message: `Senha do ${userTypeMessage} definida com sucesso!` });
  } catch (err) {
    console.error(`Erro ao definir senha inicial do ${userTypeMessage || 'usuário'}:`, err);
    return res.status(500).json({ error: `Erro interno no servidor ao definir senha do ${userTypeMessage || 'usuário'}.` });
  }
});

/**
 * @route   POST /authentication/login
 * @desc    Autentica um usuário e gera um token JWT
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const cred = await Credential.findOne({ where: { email } });
    if (!cred) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    if (!cred.password) {
      return res.status(401).json({ error: "Senha não configurada para este usuário. Por favor, defina sua senha primeiro usando o endpoint /init-password." });
    }

    const match = await bcrypt.compare(password, cred.password);
    if (!match) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    let userPayload = null;
    let userType = null;
    let userId = null;
    let userName = null;

    const patient = await Patient.findOne({ where: { credential_id: cred.id } });
    if (patient) {
      if (!patient.has_password) {
        console.warn(`Credencial ${cred.id} tem senha, mas paciente ${patient.id} está com has_password=false.`);
      }
      userType = 'patient';
      userId = patient.id;
      userName = patient.name;
      userPayload = {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        birthDate: patient.birthDate,
        phone_number: patient.phone_number,
        address: patient.address,
        userType,
        credentialId: cred.id,
      };
    } else {
      const profissional = await Profissional.findOne({ where: { credential_id: cred.id } });
      if (profissional) {
        if (!profissional.has_password) {
          console.warn(`Credencial ${cred.id} tem senha, mas profissional ${profissional.id} está com has_password=false.`);
        }
        userType = 'profissional';
        userId = profissional.id;
        userName = profissional.name;
        userPayload = {
          id: profissional.id,
          name: profissional.name,
          email: profissional.email,
          register: profissional.register,
          specialty: profissional.specialty,
          phone_number: profissional.phone_number,
          userType,
          credentialId: cred.id,
        };
      }
    }

    if (!userPayload) {
      console.error(`Login: Credencial ${cred.id} válida, mas nenhum perfil (paciente ou profissional) associado.`);
      return res.status(404).json({ error: "Perfil de usuário não encontrado para esta credencial." });
    }

    const tokenPayload = {
      userId: userId,
      credentialId: cred.id,
      userType: userType,
      email: cred.email,
      name: userName,
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.json({ message: `Login de ${userType} bem-sucedido`, token, user: userPayload });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ error: "Erro interno no servidor durante o login." });
  }
});

module.exports = router;