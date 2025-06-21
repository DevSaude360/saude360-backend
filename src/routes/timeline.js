const express = require("express");
const router = express.Router();

const { Timeline, Appointment, Professional } = require("../models");

/**
 * @route   POST /timeline
 * @desc    Cria uma nova ação
 */
router.post("/", async (req, res) => {
    try {
        const { appointmentId, title, description, dueDate } = req.body;
        if (!appointmentId || !title) {
            return res.status(400).json({ error: "ID da consulta (appointmentId) e título são obrigatórios." });
        }

        const appointmentExists = await Appointment.findByPk(appointmentId);
        if (!appointmentExists) {
            return res.status(404).json({ error: "Consulta não encontrada." });
        }

        const action = await Timeline.create({
            appointment_id: appointmentId,
            title,
            description,
            dueDate,
        });

        res.status(201).json({ message: "Ação criada com sucesso!", action });
    } catch (err) {
        console.error("Erro ao criar ação:", err);
        res.status(500).json({ error: "Falha ao criar a ação.", details: err.message });
    }
});

/**
 * @route   GET /timeline/appointment/:appointmentId
 * @desc    Busca todas as ações
 */
router.get("/appointment/:appointmentId", async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const actions = await Timeline.findAll({
            where: { appointment_id: appointmentId },
            order: [['dueDate', 'ASC'], ['createdAt', 'ASC']]
        });
        res.json({ actions });
    } catch (err) {
        console.error("Erro ao buscar ações da consulta:", err);
        res.status(500).json({ error: "Falha ao buscar ações.", details: err.message });
    }
});

/**
 * @route   PUT /timeline/:id
 * @desc    Edita uma ação
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, isCompleted } = req.body;

        const action = await Timeline.findByPk(id);
        if (!action) {
            return res.status(404).json({ error: "Ação não encontrada." });
        }

        await action.update({ title, description, dueDate, isCompleted });

        res.json({ message: "Ação atualizada com sucesso!", action });
    } catch (err) {
        console.error("Erro ao atualizar ação:", err);
        res.status(500).json({ error: "Falha ao atualizar a ação.", details: err.message });
    }
});

/**
 * @route   DELETE /timeline/:id
 * @desc    Deleta uma ação
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const action = await Timeline.findByPk(id);
        if (!action) {
            return res.status(404).json({ error: "Ação não encontrada." });
        }
        await action.destroy();
        res.json({ message: "Ação deletada com sucesso." });
    } catch (err) {
        console.error("Erro ao deletar ação:", err);
        res.status(500).json({ error: "Falha ao deletar a ação.", details: err.message });
    }
});

module.exports = router;