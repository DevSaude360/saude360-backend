const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

const Credential = require("../models/Credential");
const Patient = require("../models/Patient");
const Professional = require("../models/Professional");

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
 * @route   GET /credentials
 * @desc    Listar todas as credenciais
 */
router.get("/", authenticateToken, async (req, res) => {
    try {
        const credentials = await Credential.findAll({
            attributes: ['id', 'email', 'createdAt', 'updatedAt']
        });
        return res.json({ credentials });
    } catch (err) {
        console.error("Erro ao listar credenciais:", err);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

/**
 * @route   GET /credentials/:id
 * @desc    Listar credencial por ID
 */
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const credential = await Credential.findByPk(req.params.id, {
            attributes: ['id', 'email', 'createdAt', 'updatedAt']
        });
        if (!credential) {
            return res.status(404).json({ error: "Credencial não encontrada." });
        }

        return res.json({ credential });
    } catch (err) {
        console.error("Erro ao buscar credencial:", err);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }
});

/**
 * @route   PUT /credentials/:id/change-email
 * @desc    Atualizar o e-mail da credencial
 */
router.put("/:id/change-email", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { newEmail } = req.body;

    if (!newEmail) {
        return res.status(400).json({ error: "O novo e-mail é obrigatório." });
    }

    try {
        const credentialToUpdate = await Credential.findByPk(id);
        if (!credentialToUpdate) {
            return res.status(404).json({ error: "Credencial não encontrada." });
        }

        const existingCredentialWithNewEmail = await Credential.findOne({
            where: {
                email: newEmail,
                id: { [Op.ne]: id }
            }
        });
        if (existingCredentialWithNewEmail) {
            return res.status(400).json({ error: "O novo e-mail já está em uso por outra credencial." });
        }

        const oldEmail = credentialToUpdate.email;
        await credentialToUpdate.update({ email: newEmail });

        const patient = await Patient.findOne({ where: { credential_id: id } });
        if (patient && patient.email === oldEmail) {
            await patient.update({ email: newEmail });
        } else {
            const professional = await Professional.findOne({ where: { credential_id: id } });
            if (professional && professional.email === oldEmail) {
                await professional.update({ email: newEmail });
            }
        }

        return res.status(200).json({
            message: "E-mail da credencial atualizado com sucesso.",
            credential: {id: credentialToUpdate.id, email: newEmail}
        });
    } catch (err) {
        console.error("Erro ao atualizar e-mail da credencial:", err);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: "O novo e-mail fornecido já está em uso." });
        }
        return res.status(500).json({ error: "Erro interno no servidor ao atualizar e-mail." });
    }
});

/**
 * @route   PUT /credentials/:id/change-password
 * @desc    Atualizar a senha da credencial
 */
router.put("/:id/change-password", authenticateToken, async (req, res) => {
    try {
        const targetCredentialId = parseInt(req.params.id);
        const { newPassword, oldPassword } = req.body;
        const actor = req.user;

        if (isNaN(targetCredentialId)) {
            return res.status(400).json({ error: "ID da credencial inválido na URL." });
        }

        if (!actor.credentialId || actor.credentialId !== targetCredentialId) {
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

        const targetCredential = await Credential.findByPk(targetCredentialId);

        if (!targetCredential) {
            return res.status(404).json({ error: "Credencial não encontrada." });
        }

        if (!targetCredential.password) {
            return res.status(400).json({ error: "Senha inicial não configurada. Use o fluxo de definição de senha." });
        }

        const match = await bcrypt.compare(oldPassword, targetCredential.password);
        if (!match) {
            return res.status(401).json({ error: "Senha antiga incorreta." });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        await targetCredential.update({ password: hash });

        if (actor.userType === 'patient') {
            const associatedPatient = await Patient.findOne({ where: { credential_id: targetCredential.id } });
            if (associatedPatient && !associatedPatient.has_password) {
                await associatedPatient.update({ has_password: true });
            }
        }

        return res.status(200).json({ message: "Senha alterada com sucesso!" });

    } catch (err) {
        console.error("Erro ao alterar senha da credencial:", err);
        return res.status(500).json({ error: "Erro interno no servidor ao alterar senha." });
    }
});

module.exports = router;
