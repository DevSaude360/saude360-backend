const express = require("express");
const router  = express.Router();
const { Op } = require("sequelize");

const Professional = require("../models/Professional");
const Credential = require("../models/credential");

/**
 * @route   POST /professionals
 * @desc    Registra os dados de um profissional e a sua credencial
 */
router.post("/", async (req, res) => {
  try {
    const { name, register, specialty, phone_number, email } = req.body;

    if (!email || !name || !register ) {
      return res.status(400).json({ error: "Nome, registro (CRM/CFM, etc.) e e-mail são obrigatórios para o profissional." });
    }

    const existeCred = await Credential.findOne({ where: { email } });
    if (existeCred) {
      return res.status(400).json({ error: "E-mail já cadastrado para uma credencial." });
    }

    const cred = await Credential.create({ email });

    const professional = await Professional.create({
      name,
      register,
      specialty,
      phone_number,
      email,
      credential_id: cred.id,
      has_password: false,
    });

    return res.status(201).json({
      message: "Profissional registrado com sucesso. O próximo passo é definir a senha.",
      professional: {
        id: professional.id,
        name: professional.name,
        email: professional.email,
        register: professional.register,
        credential_id: cred.id
      },
    });
  } catch (err) {
    console.error("Erro ao registrar profissional:", err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ error: "Erro de validação ao registrar profissional.", details: messages });
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ error: "Erro de restrição: Registro ou email já podem estar em uso.", details: messages });
    }
    return res.status(500).json({ error: "Erro interno no servidor ao registrar profissional." });
  }
});

/**
 * @route   GET /professionals
 * @desc    Lista todos os profissionais
 */
router.get("/", async (req, res) => {
  try {
    const professionals = await Professional.findAll({ order: [["name", "ASC"]] });
    return res.json({ professionals });
  } catch (err) {
    console.error("Erro ao listar profissionais:", err);
    return res.status(500).json({ error: "Falha ao listar profissionais.", details: err.message });
  }
});

/**
 * @route   GET /professionals/:id
 * @desc    Consulta um profissional por ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await Professional.findByPk(id);

    if (!professional) {
      return res.status(404).json({ error: "Profissional não encontrado." });
    }

    return res.json({ professional });
  } catch (err) {
    console.error("Erro ao consultar profissional por ID:", err);
    if (err.name === 'SequelizeDatabaseError' && err.original && err.original.code === '22P02') {
      return res.status(400).json({ error: 'ID do profissional inválido.' });
    }
    return res.status(500).json({ error: "Falha ao consultar profissional.", details: err.message });
  }
});

/**
 * @route   PUT /professionals/:id
 * @desc    Edita um profissional por ID
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { credential_id, name, register, specialty, phone_number, email, has_password } = req.body;

    let professional = await Professional.findByPk(id);

    if (!professional) {
      return res.status(404).json({ error: "Profissional não encontrado." });
    }

    if (register && register !== professional.register) {
      const existingProfessionalWithRegister = await Professional.findOne({ where: { register, id: { [Op.ne]: professional.id } } });
      if (existingProfessionalWithRegister) {
        return res.status(400).json({ error: "Registro profissional já cadastrado para outro profissional." });
      }
    }

    if (email && email !== professional.email) {
      const existingProfessionalWithEmail = await Professional.findOne({ where: { email, id: { [Op.ne]: professional.id } } });
      if (existingProfessionalWithEmail) {
        return res.status(400).json({ error: "Email já cadastrado para outro profissional." });
      }
    }

    professional.credential_id = credential_id !== undefined ? credential_id : professional.credential_id;
    professional.name = name !== undefined ? name : professional.name;
    professional.register = register !== undefined ? register : professional.register;
    professional.specialty = specialty !== undefined ? specialty : professional.specialty;
    professional.phone_number = phone_number !== undefined ? phone_number : professional.phone_number;
    professional.email = email !== undefined ? email : professional.email;
    professional.has_password = has_password !== undefined ? has_password : professional.has_password;


    await professional.save();

    return res.json({ message: "Profissional atualizado com sucesso!", professional });
  } catch (err) {
    console.error("Erro ao atualizar profissional:", err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ error: "Erro de validação", details: messages });
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: "Erro de restrição: registro ou email já podem estar em uso.", details: err.errors.map(e => e.message) });
    }
    return res.status(500).json({ error: "Falha ao atualizar profissional.", details: err.message });
  }
});

/**
 * @route   DELETE /professionals/:id
 * @desc    Deleta um profissional por ID
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await Professional.findByPk(id);

    if (!professional) {
      return res.status(404).json({ error: "Profissional não encontrado." });
    }

    await professional.destroy();

    return res.json({ message: "Profissional removido com sucesso." });
  } catch (err) {
    console.error("Erro ao deletar profissional:", err);
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: "Não é possível remover o profissional pois ele possui uma credencial associada. Remova a credencial primeiro ou configure a deleção em cascata.", details: err.message});
    }
    return res.status(500).json({ error: "Falha ao deletar profissional.", details: err.message });
  }
});

module.exports = router;