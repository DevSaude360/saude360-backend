const express = require("express");
const router = express.Router();
const { Prescription, Appointment, Patient, Professional } = require("../models");

/**
 * @route   POST /prescription
 * @desc    Prescreve um ou mais medicamentos para uma consulta.
 */
router.post("/", async (req, res) => {
    const { appointmentId, medicamentos } = req.body;

    if (!appointmentId || !medicamentos || !Array.isArray(medicamentos) || medicamentos.length === 0) {
        return res.status(400).json({ error: "appointmentId and a list of medications are required." });
    }

    try {
        const appointment = await Appointment.findByPk(appointmentId);
        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found." });
        }

        const prescriptionsToCreate = medicamentos.map(med => ({
            ...med,
            appointment_id: parseInt(appointmentId, 10),
            patient_id: appointment.patient_id,
        }));

        const newPrescriptions = await Prescription.bulkCreate(prescriptionsToCreate);

        res.status(201).json({ message: "Medications prescribed successfully!", prescriptions: newPrescriptions });
    } catch (error) {
        console.error("Error prescribing medications:", error);
        res.status(500).json({ error: "Failed to prescribe medications.", details: error.message });
    }
});

/**
 * @route   GET /prescription/appointment/:appointmentId
 * @desc    Lista todas as prescrições de uma consulta.
 */
router.get("/appointment/:appointmentId", async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const prescriptions = await Prescription.findAll({
            where: { appointment_id: appointmentId },
            order: [['created_at', 'ASC']]
        });

        res.json(prescriptions);
    } catch (error) {
        console.error("Error fetching prescriptions for appointment:", error);
        res.status(500).json({ error: "Failed to fetch prescriptions.", details: error.message });
    }
});

/**
 * @route   PUT /prescription/:id
 * @desc    Atualiza uma prescrição existente.
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const prescription = await Prescription.findByPk(id);

        if (!prescription) {
            return res.status(404).json({ error: "Prescription not found." });
        }

        const updatedPrescription = await prescription.update(req.body);

        res.json({ message: "Prescription updated successfully!", prescription: updatedPrescription });
    } catch (error) {
        console.error("Error updating prescription:", error);
        res.status(500).json({ error: "Failed to update prescription.", details: error.message });
    }
});

/**
 * @route   GET /prescription/patient/:patientId
 * @desc    Lista TODAS as prescrições de um paciente.
 */
router.get("/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;

        const patient = await Patient.findByPk(patientId);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found." });
        }

        const prescriptions = await Prescription.findAll({
            where: { patient_id: patientId },
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: Appointment,
                    as: 'appointment',
                    attributes: ['id', 'appointment_date'],
                    include: [{
                        model: Professional,
                        as: 'professional',
                        attributes: ['name', 'specialty']
                    }]
                }
            ]
        });

        res.json(prescriptions);
    } catch (error) {
        console.error("Error fetching patient prescriptions:", error);
        res.status(500).json({ error: "Failed to fetch patient prescriptions.", details: error.message });
    }
});

/**
 * @route   DELETE /prescription/:id
 * @desc    Cancela uma prescrição (muda o status para 'CANCELED').
 */
router.delete("/:id", async (req, res) => {
    try {
        const prescription = await Prescription.findByPk(req.params.id);
        if (!prescription) {
            return res.status(404).json({ error: "Prescription not found." });
        }

        prescription.status = 'CANCELED';
        await prescription.save();

        res.json({ message: "Prescription canceled successfully.", prescription });
    } catch (error) {
        console.error("Error canceling prescription:", error);
        res.status(500).json({ error: "Failed to cancel prescription.", details: error.message });
    }
});

module.exports = router;
