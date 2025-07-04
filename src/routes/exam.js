const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Exam, Patient, Professional, Appointment, ExamStatus } = require("../models");

const EXAM_STATUS_IDS = {
  SOLICITADO: 1,
  COLETADO: 2,
  EM_PROCESSAMENTO: 3,
  FINALIZADO: 4,
  CANCELADO: 5,
};

/**
 * @route   POST /exams
 * @desc    Criar um novo exame para um paciente
 */
router.post("/", async (req, res) => {
  try {
    const { patientId, appointmentId, examType, collectionDate, observations } = req.body;

    if (!patientId || !examType) {
      return res.status(400).json({ error: "ID do Paciente (patientId) e Tipo de Exame (examType) são obrigatórios." });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Paciente não encontrado." });
    }

    if (appointmentId) {
      const appointment = await Appointment.findByPk(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Consulta (appointment) não encontrada." });
      }
      if (appointment.patient_id !== parseInt(patientId)) {
        return res.status(400).json({ error: "A consulta informada não pertence a este paciente." });
      }
    }

    const exam = await Exam.create({
      patient_id: patientId,
      appointment_id: appointmentId || null,
      examType,
      collectionDate,
      observations,
      status_id: EXAM_STATUS_IDS.SOLICITADO,
    });

    const newExamWithDetails = await Exam.findByPk(exam.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Appointment, as: 'appointment' },
        { model: ExamStatus, as: 'status' }
      ]
    });

    return res.status(201).json({ message: "Exame cadastrado com sucesso!", exam: newExamWithDetails });
  } catch (err) {
    console.error("Erro ao cadastrar exame:", err);
    return res.status(500).json({ error: "Falha ao cadastrar exame.", details: err.message });
  }
});

/**
 * @route   GET /exams
 * @desc    Listar todos os exames
 */
router.get("/", async (req, res) => {
  try {
    const exams = await Exam.findAll({
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'name'] },
        { model: ExamStatus, as: 'status' },
        { model: Appointment, as: 'appointment', attributes: ['id', 'appointment_date'] }
      ],
      order: [["requestDate", "DESC"]],
    });
    return res.json({ exams });
  } catch (err) {
    console.error("Erro ao listar todos os exames:", err);
    return res.status(500).json({ error: "Falha ao listar todos os exames.", details: err.message });
  }
});


/**
 * @route   GET /exams/patient/:patientId
 * @desc    Listar todos os exames de um paciente
 */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const patientExists = await Patient.findByPk(patientId);
    if (!patientExists) {
      return res.status(404).json({ error: "Paciente não encontrado." });
    }
    const exams = await Exam.findAll({
      where: { patient_id: patientId },
      include: [
        { model: ExamStatus, as: 'status' },
        {
          model: Appointment,
          as: 'appointment',
          required: false,
          include: [{ model: Professional, as: 'professional', attributes: ['id', 'name']}]
        }
      ],
      order: [["requestDate", "DESC"]],
    });
    return res.json({ exams });
  } catch (err) {
    console.error("Erro ao listar exames do paciente:", err);
    return res.status(500).json({ error: "Falha ao listar exames do paciente.", details: err.message });
  }
});

/**
 * @route   GET /exams/:id
 * @desc    Busca o exame pelo seu ID
 */
router.get("/:id", async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient', attributes: ["id", "name", "email"] },
        { model: ExamStatus, as: 'status' },
        {
          model: Appointment,
          as: 'appointment',
          include: [{ model: Professional, as: 'professional', attributes: ['id', 'name', 'specialty'] }]
        }
      ]
    });
    if (!exam) {
      return res.status(404).json({ error: "Exame não encontrado." });
    }
    return res.json({ exam });
  } catch (err) {
    console.error("Erro ao buscar exame:", err);
    return res.status(500).json({ error: "Falha ao buscar exame.", details: err.message });
  }
});

/**
 * @route   PUT /exams/:id
 * @desc    Edita um exame existente pelo ID
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({ error: "Exame não encontrado." });
    }

    await exam.update(req.body);

    const updatedExamWithDetails = await Exam.findByPk(id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Appointment, as: 'appointment' },
        { model: ExamStatus, as: 'status' }
      ]
    });

    return res.status(200).json({ message: "Exame atualizado com sucesso!", exam: updatedExamWithDetails });
  } catch (err) {
    console.error("Erro ao atualizar exame:", err);
    return res.status(500).json({ error: "Falha ao atualizar exame.", details: err.message });
  }
});

/**
 * @route   DELETE /exams/:id
 * @desc    Deleta um exame pelo ID
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({ error: "Exame não encontrado." });
    }

    await exam.destroy();
    return res.status(200).json({ message: "Exame deletado com sucesso." });
  } catch (err) {
    console.error("Erro ao deletar exame:", err);
    return res.status(500).json({ error: "Falha ao deletar exame.", details: err.message });
  }
});

/**
 * @route   GET /exams/appointments/:appointmentId
 * @desc    Busca todos os exames vinculados a uma consulta
 */
router.get("/appointments/:appointmentId", async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Consulta não encontrada." });
    }

    const exams = await Exam.findAll({
      where: {
        appointment_id: appointmentId
      },
      include: [
        {
          model: ExamStatus,
          as: 'status',
          attributes: ['id', 'description']
        }
      ],
      order: [['requestDate', 'DESC']]
    });

    return res.status(200).json({ exams });

  } catch (err) {
    console.error("Erro ao buscar exames da consulta:", err);
    return res.status(500).json({ error: "Falha ao buscar os exames da consulta.", details: err.message });
  }
});

module.exports = router;