const express = require("express");
const router = express.Router();

const { Appointment, Patient, Professional } = require("../models");
const { StatusAgendamentoEnum, StatusAgendamentoDescricao } = require("../enums/statusAgendamentoEnum");

function adicionarDescricaoStatus(appointmentInstance) {
  if (appointmentInstance && appointmentInstance.status_id) {
    const appointmentJson = appointmentInstance.toJSON ? appointmentInstance.toJSON() : { ...appointmentInstance };
    appointmentJson.status = {
      id: appointmentInstance.status_id,
      description: StatusAgendamentoDescricao[appointmentInstance.status_id] || "Status Desconhecido"
    };
    return appointmentJson;
  }
  return appointmentInstance;
}

function adicionarDescricaoStatusParaLista(appointments) {
  return appointments.map(app => adicionarDescricaoStatus(app));
}

/**
 * @route   POST /appointments
 * @desc    Criação de nova consulta
 */
router.post("/", async (req, res) => {
  try {
    const { patientId, professionalId, appointmentDate, reason } = req.body;

    if (!patientId || !professionalId || !appointmentDate) {
      return res.status(400).json({ error: "ID do Paciente, ID do Profissional e Data da Consulta são obrigatórios." });
    }
    const patient = await Patient.findByPk(patientId);
    if (!patient) return res.status(404).json({ error: "Paciente não encontrado." });
    const professional = await Professional.findByPk(professionalId);
    if (!professional) return res.status(404).json({ error: "Profissional não encontrado." });

    const newAppointmentRequest = await Appointment.create({
      patient_id: patientId,
      professional_id: professionalId,
      appointment_date: appointmentDate,
      reason: reason,
      status_id: StatusAgendamentoEnum.SOLICITADA,
    });

    res.status(201).json({
      message: "Solicitação de consulta enviada com sucesso!",
      appointment: adicionarDescricaoStatus(newAppointmentRequest)
    });
  } catch (err) {
    console.error("Erro ao solicitar consulta:", err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ error: "Erro de validação", details: messages });
    }
    res.status(500).json({ error: "Falha ao solicitar consulta.", details: err.message });
  }
});

/**
 * @route   PUT /appointments/:id/professional-response
 * @desc    Profissional dá a resposta do agendamento
 */
router.put("/:id/professional-response", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, professionalRejectionReason, professionalSuggestedDate, professionalSuggestionReason } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: "Solicitação de consulta não encontrada." });
    }

    const statusAtualId = appointment.status_id;
    if (statusAtualId !== StatusAgendamentoEnum.SOLICITADA && statusAtualId !== StatusAgendamentoEnum.NOVA_PROPOSTA_PACIENTE_AGUARDANDO_PROFISSIONAL) {
      const descricaoStatusAtual = StatusAgendamentoDescricao[statusAtualId] || "Desconhecido";
      return res.status(400).json({ error: `Ação não permitida para consulta com status '${descricaoStatusAtual}'. Esperado 'Solicitada' ou 'Nova Proposta Paciente Aguardando Profissional'.` });
    }

    let updateData = {};
    let message = "";

    switch (action) {
      case 'accept':
        updateData.status_id = StatusAgendamentoEnum.AGENDADA;
        message = "Consulta agendada com sucesso pelo profissional.";
        break;
      case 'decline':
        if (!professionalRejectionReason) return res.status(400).json({ error: "O motivo da recusa é obrigatório." });
        updateData.status_id = StatusAgendamentoEnum.RECUSADA_PELO_PROFISSIONAL;
        updateData.professional_rejection_reason = professionalRejectionReason;
        message = "Proposta de consulta recusada pelo profissional.";
        break;
      case 'suggest_reschedule':
        if (!professionalSuggestedDate) return res.status(400).json({ error: "A nova data sugerida é obrigatória." });
        updateData.status_id = StatusAgendamentoEnum.REAGENDAMENTO_SUGERIDO_PELO_PROFISSIONAL;
        updateData.professional_suggested_date = professionalSuggestedDate;
        updateData.professional_suggestion_reason = professionalSuggestionReason;
        message = "Nova data para a consulta sugerida pelo profissional.";
        break;
      default:
        return res.status(400).json({ error: "Ação inválida." });
    }
    if (action === 'accept' || action === 'decline') {
      updateData.professional_suggested_date = null;
      updateData.professional_suggestion_reason = null;
      updateData.patient_suggestion_reason = null;
    }
    if (action === 'suggest_reschedule') {
      updateData.patient_suggestion_reason = null;
    }


    await appointment.update(updateData);
    const updatedAppointment = await Appointment.findByPk(id);
    res.json({ message, appointment: adicionarDescricaoStatus(updatedAppointment) });

  } catch (err) {
    console.error("Erro na resposta do profissional:", err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ error: "Erro de validação", details: messages });
    }
    res.status(500).json({ error: "Falha ao processar resposta do profissional.", details: err.message });
  }
});

/**
 * @route   PUT /appointments/:id/patient-response
 * @desc    Paciente responde a sugestão de reagendamento do profissional
 */
router.put("/:id/patient-response", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, patientRescheduleRejectionReason, newPatientSuggestedDate, patientNewSuggestionReason } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: "Consulta ou sugestão de reagendamento não encontrada." });
    }

    if (appointment.status_id !== StatusAgendamentoEnum.REAGENDAMENTO_SUGERIDO_PELO_PROFISSIONAL) {
      const descricaoStatusAtual = StatusAgendamentoDescricao[appointment.status_id] || "Desconhecido";
      return res.status(400).json({ error: `Ação não permitida. Status atual da consulta: '${descricaoStatusAtual}'. Esperado 'Reagendamento Sugerido pelo Profissional'.` });
    }

    let updateData = {};
    let message = "";

    switch (action) {
      case 'accept_reschedule':
        if (!appointment.professional_suggested_date) return res.status(400).json({ error: "Nenhuma data foi formalmente sugerida." });
        updateData.status_id = StatusAgendamentoEnum.AGENDADA;
        updateData.appointment_date = appointment.professional_suggested_date;
        message = "Reagendamento aceito pelo paciente. Consulta agendada!";
        break;
      case 'decline_reschedule':
        updateData.status_id = StatusAgendamentoEnum.REAGENDAMENTO_RECUSADO_PELO_PACIENTE;
        updateData.patient_reschedule_rejection_reason = patientRescheduleRejectionReason;
        message = "Sugestão de reagendamento do profissional recusada pelo paciente.";
        break;
      case 'decline_and_resuggest':
        if (!newPatientSuggestedDate) return res.status(400).json({ error: "A nova data sugerida pelo paciente é obrigatória." });
        updateData.status_id = StatusAgendamentoEnum.NOVA_PROPOSTA_PACIENTE_AGUARDANDO_PROFISSIONAL;
        updateData.appointment_date = newPatientSuggestedDate;
        updateData.patient_suggestion_reason = patientNewSuggestionReason;
        message = "Paciente recusou sugestão e propôs nova data. Aguardando aprovação do profissional.";
        break;
      default:
        return res.status(400).json({ error: "Ação inválida." });
    }
    if (action === 'accept_reschedule' || action === 'decline_reschedule' || action === 'decline_and_resuggest') {
      updateData.professional_suggested_date = null;
      updateData.professional_suggestion_reason = null;
    }
    if (action === 'accept_reschedule' || action === 'decline_reschedule'){
      updateData.patient_suggestion_reason = null;
    }

    await appointment.update(updateData);
    const updatedAppointment = await Appointment.findByPk(id);
    res.json({ message, appointment: adicionarDescricaoStatus(updatedAppointment) });
  } catch (err) {
    console.error("Erro na resposta do paciente ao reagendamento:", err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ error: "Erro de validação", details: messages });
    }
    res.status(500).json({ error: "Falha ao processar resposta do paciente.", details: err.message });
  }
});

/**
 * @route   GET /appointments
 * @desc    Lista todas as consultas
 */
router.get("/", async (req, res) => {
  try {
    const { statusId, patientId, professionalId } = req.query;
    let whereClause = {};

    if (patientId) whereClause.patient_id = patientId;
    if (professionalId) whereClause.professional_id = professionalId;
    if (statusId) {
      const numericStatusId = parseInt(statusId);
      if (Object.values(StatusAgendamentoEnum).includes(numericStatusId)) {
        whereClause.status_id = numericStatusId;
      } else {
        return res.status(400).json({ error: "Valor de statusId inválido." });
      }
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient', attributes: ["id", "name", "email"] },
        { model: Professional, as: 'professional', attributes: ["id", "name", "specialty", "email"] }
      ],
      order: [["appointment_date", "DESC"]],
    });
    res.json({ appointments: adicionarDescricaoStatusParaLista(appointments) });
  } catch (err) {
    console.error("Erro ao listar consultas:", err);
    res.status(500).json({ error: "Falha ao listar consultas.", details: err.message });
  }
});

/**
 * @route   GET /appointments/:id
 * @desc    Obtém uma consulta específica pelo ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: Patient, as: 'patient', attributes: ["id", "name", "email"] },
        { model: Professional, as: 'professional', attributes: ["id", "name", "specialty", "email"] }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ error: "Consulta não encontrada." });
    }
    res.json({ appointment: adicionarDescricaoStatus(appointment) });
  } catch (err) {
    console.error("Erro ao buscar consulta:", err);
    res.status(500).json({ error: "Falha ao buscar consulta.", details: err.message });
  }
});

/**
 * @route   PUT /appointments/:id
 * @desc    Atualiza dados de uma consulta
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({ error: "Consulta não encontrada." });
    }

    const {
      patientId,
      professionalId,
      appointmentDate,
      reason,
      statusId,
      professionalRejectionReason,
      professionalSuggestedDate,
      professionalSuggestionReason,
      patientRescheduleRejectionReason,
      patientSuggestionReason
    } = req.body;

    let updateData = {};
    let houveAlteracao = false;

    if (patientId !== undefined && patientId !== appointment.patient_id) {
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({ error: "Novo Paciente não encontrado para atualização." });
      }
      updateData.patient_id = patientId;
      houveAlteracao = true;
    }

    if (professionalId !== undefined && professionalId !== appointment.professional_id) {
      const professional = await Professional.findByPk(professionalId);
      if (!professional) {
        return res.status(404).json({ error: "Novo Profissional não encontrado para atualização." });
      }
      updateData.professional_id = professionalId;
      houveAlteracao = true;
    }

    if (appointmentDate !== undefined) {
      updateData.appointment_date = appointmentDate;
      houveAlteracao = true;
    }

    if (reason !== undefined) {
      updateData.reason = reason;
      houveAlteracao = true;
    }

    if (statusId !== undefined) {
      const numericStatusId = parseInt(statusId);
      if (!Object.values(StatusAgendamentoEnum).includes(numericStatusId)) {
        return res.status(400).json({ error: "ID de status inválido fornecido." });
      }
      updateData.status_id = numericStatusId;
      houveAlteracao = true;
    }

    if (professionalRejectionReason !== undefined) {
      updateData.professional_rejection_reason = professionalRejectionReason;
      houveAlteracao = true;
    }
    if (professionalSuggestedDate !== undefined) {
      updateData.professional_suggested_date = professionalSuggestedDate;
      houveAlteracao = true;
    } else if (professionalSuggestedDate === null && req.body.hasOwnProperty('professionalSuggestedDate')) {
      updateData.professional_suggested_date = null;
      houveAlteracao = true;
    }
    if (professionalSuggestionReason !== undefined) {
      updateData.professional_suggestion_reason = professionalSuggestionReason;
      houveAlteracao = true;
    }
    if (patientRescheduleRejectionReason !== undefined) {
      updateData.patient_reschedule_rejection_reason = patientRescheduleRejectionReason;
      houveAlteracao = true;
    }
    if (patientSuggestionReason !== undefined) {
      updateData.patient_suggestion_reason = patientSuggestionReason;
      houveAlteracao = true;
    }

    if (!houveAlteracao) {
      return res.status(400).json({ error: "Nenhum dado fornecido para atualização." });
    }

    await appointment.update(updateData);

    const updatedAppointment = await Appointment.findByPk(id);

    res.json({
      message: "Consulta atualizada com sucesso!",
      appointment: adicionarDescricaoStatus(updatedAppointment)
    });

  } catch (err) {
    console.error("Erro ao atualizar consulta:", err);
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ error: "Erro de validação", details: messages });
    }
    res.status(500).json({ error: "Falha ao atualizar consulta.", details: err.message });
  }
});

/**
 * @route   PUT /appointments/:id
 * @desc    Deleta uma consulta
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) return res.status(404).json({ error: "Consulta não encontrada." });
    await appointment.destroy();
    res.json({ message: "Consulta deletada permanentemente com sucesso." });
  } catch (err) {
    console.error("Erro ao deletar consulta:", err);
    res.status(500).json({ error: "Falha ao deletar consulta.", details: err.message });
  }
});

/**
 * @route   GET /appointments/patient/:patientId
 * @desc    Lista todas as consultas de um paciente específico
 */
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const patientExists = await Patient.findByPk(patientId);
    if (!patientExists) return res.status(404).json({ error: "Paciente não encontrado." });
    const appointments = await Appointment.findAll({
      where: { patient_id: patientId },
      include: [
        { model: Professional, as: 'professional', attributes: ["id", "name", "register", "specialty"] }
      ],
      order: [["appointment_date", "ASC"]],
    });
    res.json({ appointments: adicionarDescricaoStatusParaLista(appointments) });
  } catch (err) {
    console.error("Erro ao listar consultas do paciente:", err);
    res.status(500).json({ error: "Falha ao listar consultas do paciente.", details: err.message });
  }
});

/**
 * @route   GET /appointments/professional/:professionalId
 * @desc    Lista todas as consultas de um profissional específico
 */
router.get("/professional/:professionalId", async (req, res) => {
  try {
    const { professionalId } = req.params;
    const professionalExists = await Professional.findByPk(professionalId);
    if (!professionalExists) return res.status(404).json({ error: "Profissional não encontrado." });
    const appointments = await Appointment.findAll({
      where: { professional_id: professionalId },
      include: [
        { model: Patient, as: 'patient', attributes: ["id", "name", "email"] }
      ],
      order: [["appointment_date", "ASC"]],
    });
    res.json({ appointments: adicionarDescricaoStatusParaLista(appointments) });
  } catch (err) {
    console.error("Erro ao listar consultas do profissional:", err);
    res.status(500).json({ error: "Falha ao listar consultas do profissional.", details: err.message });
  }
});

/**
 * @route   GET /appointments/professional/:professionalId/patient/:patientId
 * @desc    Lista todas as consultas de um profissional específico para um paciente específico
 */
router.get("/professional/:professionalId/patient/:patientId", async (req, res) => {
  try {
    const { professionalId, patientId } = req.params;
    const patientExists = await Patient.findByPk(patientId);
    if (!patientExists) return res.status(404).json({ error: "Paciente não encontrado." });
    const professionalExists = await Professional.findByPk(professionalId);
    if (!professionalExists) return res.status(404).json({ error: "Profissional não encontrado." });
    const appointments = await Appointment.findAll({
      where: { professional_id: professionalId, patient_id: patientId },
      order: [["appointment_date", "ASC"]],
    });
    res.json({ appointments: adicionarDescricaoStatusParaLista(appointments) });
  } catch (err)  {
    console.error("Erro ao listar consultas do profissional e paciente:", err);
    res.status(500).json({ error: "Falha ao listar as consultas especificadas.", details: err.message });
  }
});

module.exports = router;