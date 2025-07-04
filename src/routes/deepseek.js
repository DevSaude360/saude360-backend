const express = require("express");
const axios = require("axios");
const puppeteer = require('puppeteer');
const { marked } = require('marked');
const { supabaseAdmin } = require('../config/supabase');
const { Appointment, Patient, Professional, Exam, ExamStatus } = require("../models");

require('dotenv').config();

const router = express.Router();

const SUPABASE_PDF_BUCKET = 'prontuarios-pdf';

/**
 * Busca dados da consulta no banco local e usa a IA para gerar um sumário.
 * @param {number} appointmentId - O ID da consulta.
 * @returns {Promise<object>} Um objeto contendo os dados da consulta e o sumário da IA.
 */
async function gerarDadosCompletos(appointmentId) {
  const appointment = await Appointment.findByPk(appointmentId, {
    include: [
      { model: Patient, as: 'patient' },
      { model: Professional, as: 'professional' }
    ]
  });

  if (!appointment) {
    throw new Error(`Consulta com ID ${appointmentId} não encontrada.`);
  }

  const exams = await Exam.findAll({
    where: { appointment_id: appointmentId },
    include: [{ model: ExamStatus, as: 'status' }]
  });

  let dadosParaIA = `
    DADOS DA CONSULTA PARA GERAÇÃO DE PRONTUÁRIO:
    - Paciente: ${appointment.patient.name} (ID: ${appointment.patient.id})
    - Profissional: ${appointment.professional.name} (Especialidade: ${appointment.professional.specialty})
    - Data da Consulta: ${new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}
    - Motivo: ${appointment.reason || 'Não especificado'}
  `;

  if (exams.length > 0) {
    dadosParaIA += `\n--- EXAMES ASSOCIADOS ---\n`;
    exams.forEach(exam => {
      dadosParaIA += `  - Exame: ${exam.examType}, Status: ${exam.status ? exam.status.description : 'N/A'}\n`;
    });
  }

  const prompt = {
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: "Você é um assistente médico especialista em documentação clínica. Sua tarefa é gerar um prontuário profissional, bem estruturado e coeso, em formato de texto corrido, a partir dos dados brutos de uma consulta e seus exames associados. Organize as informações de forma lógica: identificação do paciente, queixa principal, resumo do atendimento, exames solicitados/resultados e um plano de conduta sugerido.",
      },
      { role: "user", content: dadosParaIA },
    ],
    temperature: 0.7,
  };

  const response = await axios.post(process.env.DEEPSEEK_API_URL, prompt, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.KEY_DEEPSEEK}` },
  });

  const sumarioGerado = response.data.choices[0].message.content || "Não foi possível gerar o sumário.";

  return { appointment, exams, sumarioGerado, dadosBrutosJson: { appointment: appointment.toJSON(), exams: exams.map(e => e.toJSON()) } };
}

/**
 * Gera um buffer de PDF a partir de um conteúdo HTML.
 * @param {object} appointment - O objeto da consulta.
 * @param {string} sumarioHtml - O sumário gerado pela IA, já convertido para HTML.
 * @param {Array<object>} exams - A lista de exames.
 * @returns {Promise<Buffer>} O buffer do arquivo PDF.
 */
async function gerarPdfBuffer(appointment, sumarioHtml, exams) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Prontuário Clínico</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #007bff; }
            
            /* --- A MUDANÇA ESTÁ AQUI --- */
            /* Removemos a regra 'page-break-inside: avoid;' para permitir que o conteúdo flua entre as páginas */
            .section { margin-bottom: 25px; } 

            .section h2 { font-size: 18px; color: #0056b3; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
            .details-grid div { padding: 5px 0; }
            p, li { line-height: 1.6; font-size: 14px; }
            .summary { background-color: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
            ul { padding-left: 20px; }
        </style>
    </head>
    <body>
        <div class="header"><h1>Prontuário Clínico</h1></div>
        <div class="section">
            <h2>Identificação</h2>
            <div class="details-grid">
                <div><strong>Paciente:</strong> ${appointment.patient.name}</div>
                <div><strong>Profissional:</strong> ${appointment.professional.name}</div>
                <div><strong>ID Paciente:</strong> ${appointment.patient.id}</div>
                <div><strong>Especialidade:</strong> ${appointment.professional.specialty}</div>
                <div><strong>Data da Consulta:</strong> ${new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}</div>
            </div>
        </div>
        <div class="section summary">
            <h2>Resumo da Consulta (Gerado por IA)</h2>
            ${sumarioHtml}
        </div>
        ${exams.length > 0 ? `
        <div class="section">
            <h2>Exames Associados</h2>
            <ul>
                ${exams.map(exam => `
                    <li>
                        <strong>${exam.examType}:</strong> Status: ${exam.status ? exam.status.description : 'N/A'}. 
                        ${exam.observations ? `Observações: ${exam.observations}` : ''}
                    </li>
                `).join('')}
            </ul>
        </div>` : ''}
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '40px', right: '40px', bottom: '40px', left: '40px' } });
  await browser.close();

  return pdfBuffer;
}

/**
 * @route   POST /deepseek/prontuarios/request-generation
 * @desc    Faz a criação do prontuario e disponibiliza ele no supabase
 */
router.post("/prontuarios/request-generation", async (req, res) => {
  const { appointmentId } = req.body;
  if (!appointmentId) return res.status(400).json({ error: "O campo 'appointmentId' é obrigatório!" });

  try {
    const { data: existente, error: findError } = await supabaseAdmin
        .from('geracoes_prontuarios')
        .select('id')
        .eq('appointment_id', appointmentId)
        .single();

    if (findError && findError.code !== 'PGRST116') throw findError;

    if (existente) {
      return res.status(200).json({ message: "Prontuário já havia sido gerado.", geracaoId: existente.id });
    }

    const { appointment, exams, sumarioGerado, dadosBrutosJson } = await gerarDadosCompletos(appointmentId);
    const sumarioHtml = marked(sumarioGerado);
    const pdfBuffer = await gerarPdfBuffer(appointment, sumarioHtml, exams);

    const pdfPath = `public/prontuario_${appointmentId}_${Date.now()}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
        .from(SUPABASE_PDF_BUCKET)
        .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw uploadError;

    const { data: novoRegistro, error: insertError } = await supabaseAdmin
        .from('geracoes_prontuarios')
        .insert({
          appointment_id: appointmentId,
          sumario_texto: sumarioGerado,
          sumario_html: sumarioHtml,
          pdf_path: pdfPath,
          dados_brutos_json: dadosBrutosJson,
        })
        .select('id')
        .single();
    if (insertError) throw insertError;

    res.status(201).json({ message: "Prontuário gerado e salvo com sucesso.", geracaoId: novoRegistro.id });

  } catch (error) {
    console.error("Erro no processo de geração de prontuário:", error);
    res.status(500).json({ error: "Falha ao solicitar geração do prontuário.", details: error.message });
  }
});

/**
 * @route   POST /deepseek/prontuarios/:requestId/download
 * @desc    Faz o download de um arquivo PDF com as informações
 */
router.get("/prontuarios/:geracaoId/download", async (req, res) => {
  const { geracaoId } = req.params;
  try {
    const { data, error: findError } = await supabaseAdmin
        .from('geracoes_prontuarios')
        .select('pdf_path')
        .eq('id', geracaoId)
        .single();
    if (findError || !data) return res.status(404).json({ error: "Registro de geração não encontrado." });

    const { data: urlData, error: urlError } = await supabaseAdmin.storage
        .from(SUPABASE_PDF_BUCKET)
        .createSignedUrl(data.pdf_path, 3600);
    if (urlError) throw urlError;

    res.json({ downloadUrl: urlData.signedUrl });
  } catch (error) {
    console.error("Erro ao gerar link de download:", error);
    res.status(500).json({ error: "Falha ao obter link de download.", details: error.message });
  }
});

/**
 * @route   POST /remedios
 * @desc    Busca informações de um remédio.
 */
router.post("/remedios", async (req, res) => {
  // ... (código do endpoint de remédios que criamos)
});

/**
 * @route   POST /farmacias
 * @desc    Busca farmácias próximas a um CEP.
 */
router.post("/farmacias", async (req, res) => {
  // ... (código do endpoint de farmácias que você já tinha)
});

module.exports = router;
