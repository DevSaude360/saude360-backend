const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
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

/**
 * @route   GET /prescription/:id/download
 * @desc    Gera um PDF de uma prescrição específica e o disponibiliza para download.
 */
router.get("/:id/download", async (req, res) => {
    try {
        const { id } = req.params;

        const prescription = await Prescription.findByPk(id, {
            include: [{
                model: Appointment,
                as: 'appointment',
                include: [
                    { model: Patient, as: 'patient' },
                    { model: Professional, as: 'professional' }
                ]
            }]
        });

        if (!prescription) {
            return res.status(404).json({ error: "Prescription not found." });
        }

        const { patient, professional } = prescription.appointment;

        const htmlContent = generatePrescriptionHtml(prescription, patient, professional);

        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();

        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '40px', right: '40px', bottom: '40px', left: '40px' }
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Content-Disposition', `attachment; filename=receituario_${patient.name.replace(/\s/g, '_')}_${id}.pdf`);

        res.end(pdfBuffer);

    } catch (error) {
        console.error("Error generating prescription PDF:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate PDF.", details: error.message });
        }
    }
});

/**
 * Função auxiliar para gerar o HTML do receituário.
 * @param {object} prescription - O objeto da prescrição.
 * @param {object} patient - O objeto do paciente.
 * @param {object} professional - O objeto do profissional.
 * @returns {string} O HTML completo do receituário.
 */
function generatePrescriptionHtml(prescription, patient, professional) {
    const issueDate = new Date().toLocaleDateString('pt-BR');
    const issueTime = new Date(prescription.created_at).toLocaleString('pt-BR');
    const prescriptionId = `P-${String(prescription.id).padStart(6, '0')}`;

    let medicationDescription = prescription.medication_name;
    if (prescription.duration) {
        medicationDescription += ` - ${prescription.duration}`;
    }

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Receituário Médico - ${prescriptionId}</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 40px; color: #333; }
            .header, .footer { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #0056b3; font-size: 24px; }
            .header-info { display: flex; justify-content: space-between; font-size: 12px; color: #555; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
            .section h2 { font-size: 18px; color: #0056b3; margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 20px; font-size: 14px; }
            .details-grid strong { color: #333; }
            .med-item { margin-bottom: 15px; }
            .med-item .name { font-weight: bold; font-size: 16px; }
            .med-item .dosage { padding-left: 15px; font-style: italic; color: #555; }
            .footer { border-top: 1px solid #ccc; padding-top: 15px; font-size: 12px; color: #777; margin-top: 40px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Receituário</h1>
            <div class="header-info">
                <span>Data: ${issueDate}</span>
                <span>Receituário no: ${prescriptionId}</span>
                <span>Atendimento via telemedicina</span>
            </div>
        </div>

        <div class="section">
            <h2>Paciente</h2>
            <div class="details-grid">
                <div><strong>Nome:</strong> ${patient.name || 'Não informado'}</div>
                <div><strong>Data de Nascimento:</strong> ${patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}</div>
                <div style="grid-column: 1 / -1;"><strong>Endereço:</strong> ${patient.address || 'Não informado'}</div>
                </div>
        </div>

        <div class="section">
            <h2>Medicamentos</h2>
            <div class="med-item">
                <div class="name">${medicationDescription}</div>
                <div class="dosage">${prescription.dosage || 'Conforme orientação médica.'}</div>
                ${prescription.additional_instructions ? `<div class="dosage">Instruções: ${prescription.additional_instructions}</div>` : ''}
            </div>
            <div style="font-size: 12px; color: #888; text-align: right; margin-top: 20px;">
                Horário da prescrição: ${issueTime}
            </div>
        </div>

        <div class="section">
            <h2>Médico/-a</h2>
            <div class="details-grid">
                <div><strong>Nome:</strong> ${professional.name || 'Não informado'}</div>
                <div><strong>CRM:</strong> ${professional.register || 'Não informado'}</div>
                </div>
        </div>

        <div class="footer signature-section">
            <div>RECEITA DIGITAL</div>        </div>
    </body>
    </html>
    `;
}

module.exports = router;
