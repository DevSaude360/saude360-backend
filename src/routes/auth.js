const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const Credencial = require("../models/Credencial");
const Paciente = require("../models/Paciente");
const Medico = require("../models/Medico");

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
 * @route   POST /auth/register/paciente
 * @desc    Registra os dados de um paciente e sua credencial
 */
router.post("/register/paciente", async (req, res) => {
  try {
    const { name, data_nascimento, telefone, endereco, email } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios para registrar paciente." });
    }

    const existeCred = await Credencial.findOne({ where: { email } });
    if (existeCred) {
      return res.status(400).json({ error: "E-mail já cadastrado para uma credencial." });
    }

    const cred = await Credencial.create({ email });

    const paciente = await Paciente.create({
      name,
      data_nascimento,
      telefone,
      endereco,
      email,
      credencial_id: cred.id,
      has_password: false,
    });

    return res.status(201).json({
      message: "Paciente registrado com sucesso.",
      paciente: {
        id: paciente.id,
        email: paciente.email,
        credencial_id: cred.id
      },
    });
  } catch (err) {
    console.error("Erro ao registrar paciente:", err);
    return res.status(500).json({ error: "Erro interno no servidor ao registrar paciente." });
  }
});

/**
 * @route   POST /auth/senha-inicial/paciente
 * @desc    Define a senha inicial para a credencial de um paciente
 */
router.post("/senha-inicial/paciente", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }

    const cred = await Credencial.findOne({ where: { email } });
    if (!cred) {
      return res.status(404).json({ error: "Credencial não encontrada para este e-mail." });
    }

    // Verifica se a credencial pertence a um paciente
    const paciente = await Paciente.findOne({ where: { credencial_id: cred.id } });
    if (!paciente) {
      return res.status(404).json({ error: "Nenhum paciente encontrado associado a este e-mail para definir a senha." });
    }

    if (cred.password) { // Verifica se a senha já foi definida (não é mais nula)
      return res.status(400).json({ error: "Senha já configurada para esta credencial de paciente." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await cred.update({ password: hash });
    await paciente.update({ has_password: true });

    return res.status(200).json({ message: "Senha do paciente definida com sucesso!" });
  } catch (err) {
    console.error("Erro ao definir senha inicial do paciente:", err);
    return res.status(500).json({ error: "Erro interno no servidor ao definir senha do paciente." });
  }
});

/**
 * @route   POST /auth/login/paciente
 * @desc    Autentica o paciente e gera um token JWT
 * @access  Public
 */
router.post("/login/paciente", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const cred = await Credencial.findOne({ where: { email } });
    if (!cred) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const paciente = await Paciente.findOne({ where: { credencial_id: cred.id } });
    if (!paciente) {
      return res.status(404).json({ error: "Perfil de paciente não encontrado para este e-mail." });
    }

    if (!cred.password || !paciente.has_password) {
      return res.status(401).json({ error: "Senha não configurada para este paciente. Por favor, defina sua senha primeiro." });
    }

    const match = await bcrypt.compare(password, cred.password);
    if (!match) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const payload = {
      userId: paciente.id,
      credencialId: cred.id,
      userType: 'paciente',
      email: cred.email
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.json({ message: "Login de paciente bem-sucedido", token, user: payload });
  } catch (err) {
    console.error("Erro no login de paciente:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});

/**
 * @route   POST /auth/register/medico
 * @desc    Registra os dados de login de um medico
 */
router.post("/register/medico", async (req, res) => {
  try {
    const { name, registro, especialidade, telefone, email, password } = req.body;

    if (!email || !name || !registro || !password) {
      return res.status(400).json({ error: "Nome, registro (CRM/CFM), e-mail e senha são obrigatórios para médico." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha para médico deve ter pelo menos 6 caracteres." });
    }

    const existeCred = await Credencial.findOne({ where: { email } });
    if (existeCred) {
      return res.status(400).json({ error: "E-mail já cadastrado para uma credencial." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
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
      medico: {
        id: medico.id,
        name: medico.name,
        email: medico.email,
        registro: medico.registro
      },
    });
  } catch (err) {
    console.error("Erro ao registrar médico:", err);
    return res.status(500).json({ error: "Erro interno no servidor ao registrar médico." });
  }
});

/**
 * @route   POST /auth/login/medico
 * @desc    Autentica o medico e gera um token JWT
 */
router.post("/login/medico", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const cred = await Credencial.findOne({ where: { email } });
    if (!cred || !cred.password) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const match = await bcrypt.compare(password, cred.password);
    if (!match) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const medico = await Medico.findOne({ where: { credencial_id: cred.id } });
    if (!medico) {
      console.error(`Login Medico: Credencial ${cred.id} encontrada, mas nenhum médico associado.`);
      return res.status(404).json({ error: "Perfil de médico não encontrado." });
    }

    const payload = {
      userId: medico.id,
      credencialId: cred.id,
      userType: 'medico',
      email: cred.email
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.json({ message: "Login de médico bem-sucedido", token, user: payload });
  } catch (err) {
    console.error("Erro no login de médico:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});


/**
 * @route   GET /auth/credenciais
 * @desc    Lista todas as credenciais
 */
router.get("/credenciais", authenticateToken, async (req, res) => {
  try {
    const credenciais = await Credencial.findAll({
      attributes: ['id', 'email', 'createdAt', 'updatedAt']
    });
    return res.json({ credenciais });
  } catch (err) {
    console.error("Erro ao listar credenciais:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});

/**
 * @route   GET /auth/credenciais/:id
 * @desc    Busca uma credencial específica pelo ID
 */
router.get("/credenciais/:id", authenticateToken, async (req, res) => {
  try {
    const cred = await Credencial.findByPk(req.params.id, {
      attributes: ['id', 'email', 'createdAt', 'updatedAt']
    });
    if (!cred) {
      return res.status(404).json({ error: "Credencial não encontrada." });
    }

    return res.json({ credencial: cred });
  } catch (err) {
    console.error("Erro ao buscar credencial:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});

/**
 * @route   PUT /auth/credenciais/:id/alterar-email
 * @desc    Atualiza o e-mail de uma credencial
 */
router.put("/credenciais/:id/alterar-email", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { newEmail } = req.body;

  if (!newEmail) {
    return res.status(400).json({ error: "O novo e-mail é obrigatório." });
  }

  try {
    const credToUpdate = await Credencial.findByPk(id);
    if (!credToUpdate) {
      return res.status(404).json({ error: "Credencial não encontrada." });
    }

    const existingCredWithNewEmail = await Credencial.findOne({ where: { email: newEmail, id: { [Op.ne]: id } } });
    if (existingCredWithNewEmail) {
      return res.status(400).json({ error: "O novo e-mail já está em uso por outra credencial." });
    }

    const oldEmail = credToUpdate.email;
    await credToUpdate.update({ email: newEmail });

    const paciente = await Paciente.findOne({ where: { credencial_id: id } });
    if (paciente && paciente.email === oldEmail) {
      await paciente.update({ email: newEmail });
    } else {
      const medico = await Medico.findOne({ where: { credencial_id: id } });
      if (medico && medico.email === oldEmail) {
        await medico.update({ email: newEmail });
      }
    }

    return res.status(200).json({ message: "E-mail da credencial atualizado.", credencial: {id: credToUpdate.id, email: newEmail} });
  } catch (err) {
    console.error("Erro ao atualizar e-mail da credencial:", err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: "O novo e-mail fornecido já está em uso." });
    }
    return res.status(500).json({ error: "Erro interno no servidor ao atualizar e-mail." });
  }
});

router.put("/credenciais/:id/alterar-senha", authenticateToken, async (req, res) => {
  try {
    const targetCredencialId = parseInt(req.params.id);
    const { newPassword, oldPassword } = req.body;
    const actor = req.user;

    if (isNaN(targetCredencialId)) {
      return res.status(400).json({ error: "ID da credencial inválido na URL." });
    }

    if (actor.credencialId !== targetCredencialId) {
      return res.status(403).json({ error: "Não autorizado. Você só pode alterar a sua própria senha." });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Senha antiga e nova senha são obrigatórias." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ error: "A nova senha deve ser diferente da senha antiga." });
    }

    const targetCredencial = await Credencial.findByPk(targetCredencialId);

    if (!targetCredencial) {
      return res.status(404).json({ error: "Credencial não encontrada." });
    }

    if (!targetCredencial.password) {
      return res.status(400).json({ error: "Senha inicial não configurada." });
    }

    const match = await bcrypt.compare(oldPassword, targetCredencial.password);
    if (!match) {
      return res.status(401).json({ error: "Senha antiga incorreta." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await targetCredencial.update({ password: hash });

    if (actor.userType === 'paciente') {
      const pacienteAssociado = await Paciente.findOne({ where: { credencial_id: targetCredencial.id } });
      if (pacienteAssociado && !pacienteAssociado.has_password) {
        await pacienteAssociado.update({ has_password: true });
      }
    }

    return res.status(200).json({ message: "Senha alterada com sucesso!" });

  } catch (err) {
    console.error("Erro ao alterar senha da credencial:", err);
    return res.status(500).json({ error: "Erro interno no servidor ao alterar senha." });
  }
});

module.exports = router;