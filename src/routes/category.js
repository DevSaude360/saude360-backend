const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const Patient = require("../models/Patient");
const Document = require("../models/Document");

/**
 * @route   DELETE /category
 * @desc    Cria uma nova categoria para um paciente
 */
router.post("/", async (req, res) => {
    try {
        const { patientId, name, iconName, colorHex } = req.body;

        if (!patientId || !name) {
            return res.status(400).json({ error: "patientId e name são obrigatórios." });
        }

        const patient = await Patient.findByPk(patientId);
        if (!patient) {
            return res.status(404).json({ error: "Paciente não encontrado." });
        }

        const newCategory = await Category.create({
            patient_id: patientId,
            name,
            iconName,
            colorHex,
        });

        res.status(201).json(newCategory);
    } catch (err) {
        console.error("Erro ao criar categoria:", err);
        res.status(500).json({ error: "Falha ao criar categoria." });
    }
});

/**
 * @route   DELETE /category/:id
 * @desc    Exclui uma categoria e torna seus documentos não categorizados
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: "Categoria não encontrada." });
        }

        await category.destroy();

        res.status(200).json({ message: "Pasta excluída com sucesso! Os documentos foram movidos para a lista principal." });

    } catch (err) {
        console.error("Erro ao excluir a categoria:", err);
        res.status(500).json({ error: "Falha ao excluir a categoria." });
    }
});

module.exports = router;