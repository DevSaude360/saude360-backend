const express = require("express");
const router = express.Router();
const multer = require("multer");
const { supabaseAdmin } = require("../config/supabase");
const Document = require("../models/Document");
const Patient = require("../models/Patient");
const Category = require("../models/Category");

const tiposDeArquivoPermitidos = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const filtroDeArquivo = (req, file, cb) => {
    if (tiposDeArquivoPermitidos.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Tipo de arquivo não suportado! Por favor, envie apenas imagens, PDFs, documentos ou planilhas."), false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: filtroDeArquivo,
    limits: {
        fileSize: 30 * 1024 * 1024,
    },
});

/**
 * @route   POST /documents/upload
 * @desc    Envia um documento para um paciente
 */
router.post(
    "/upload",
    upload.single('documento'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "Nenhum arquivo enviado. O campo deve se chamar 'documento'." });
            }

            const { patientId, documentType, categoryId } = req.body;
            if (!patientId || !documentType) {
                return res.status(400).json({ error: "O ID do paciente (patientId) e o tipo de documento (documentType) são obrigatórios." });
            }

            const patient = await Patient.findByPk(patientId);
            if (!patient) return res.status(404).json({ error: "Paciente não encontrado." });

            const file = req.file;
            const fileExtension = file.originalname.split('.').pop();
            const uniqueFileName = `paciente-${patientId}/${Date.now()}.${fileExtension}`;

            const { data, error: uploadError } = await supabaseAdmin.storage
                .from('document-patient')
                .upload(uniqueFileName, file.buffer, {
                    contentType: file.mimetype,
                });

            if (uploadError) {
                throw uploadError;
            }

            const newDocument = await Document.create({
                patient_id: patientId,
                documentType: documentType,
                category_id: categoryId ? parseInt(categoryId) : null,
                fileName: file.originalname,
                storagePath: data.path,
                mimeType: file.mimetype,
                fileSize: file.size,
            });

            res.status(201).json({
                message: "Documento enviado com sucesso!",
                document: newDocument
            });

        } catch (err) {
            console.error("Erro no upload do documento:", err);
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: `Erro do Multer: ${err.message}`});
            } else if (err.message.includes("Tipo de arquivo não suportado")) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: "Falha ao processar o envio do documento." });
        }
    }
);

/**
 * @route   GET /documents/patient/:patientId
 * @desc    Busca todos os documentos de um paciente específico
 */
router.get("/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;

        const patient = await Patient.findByPk(patientId);
        if (!patient) {
            return res.status(404).json({ error: "Paciente não encontrado." });
        }

        const categories = await Category.findAll({
            where: { patient_id: patientId },
            include: {
                model: Document,
                as: 'documents',
            },
            order: [['name', 'ASC']],
        });

        const uncategorizedDocuments = await Document.findAll({
            where: {
                patient_id: patientId,
                category_id: null,
            },
            order: [['createdAt', 'DESC']],
        });

        res.status(200).json({
            categories: categories,
            uncategorized: uncategorizedDocuments,
        });

    } catch (err) {
        console.error("Erro na rota de busca de documentos:", err);
        res.status(500).json({ error: "Falha ao buscar documentos." });
    }
});

/**
 * @route   DELETE /documents/:id
 * @desc    Exclui um documento específico
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findByPk(id);
        if (!document) {
            return res.status(404).json({ error: "Documento não encontrado." });
        }

        const { error: storageError } = await supabaseAdmin.storage
            .from('document-patient')
            .remove([document.storagePath]);

        if (storageError) {
            console.error("Aviso: Falha ao remover o ficheiro do Supabase Storage. O ficheiro pode precisar de remoção manual:", storageError.message);
        }

        await document.destroy();

        res.status(200).json({ message: "Documento excluído com sucesso!" });

    } catch (err) {
        console.error("Erro ao excluir o documento:", err);
        res.status(500).json({ error: "Falha ao excluir o documento." });
    }
});

/**
 * @route   PUT /documents/:id
 * @desc    Atualiza um documento (tipo e/ou categoria)
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { documentType, categoryId } = req.body;

        const document = await Document.findByPk(id);
        if (!document) {
            return res.status(404).json({ error: "Documento não encontrado." });
        }
        if (documentType !== undefined) {
            document.documentType = documentType;
        }
        if (categoryId !== undefined) {
            document.category_id = categoryId;
        }

        await document.save();

        res.status(200).json(document);

    } catch (err) {
        console.error("Erro ao atualizar o documento:", err);
        res.status(500).json({ error: "Falha ao atualizar o documento." });
    }
});

module.exports = router;