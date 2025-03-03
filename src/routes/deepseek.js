const express = require("express");
const axios = require("axios");

require("dotenv").config();

const router = express.Router();

const DEEPSEEK_API_KEY = process.env.KEY_DEEPSEEK;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

/**
 * @route   POST /deepseek
 * @desc    Faz uma requisição para a API do DeepSeek e retorna a resposta
 * @access  Público
 */
router.post("/", async (req, res) => {
  try {
    const { cep } = req.body;

    if (!cep) {
      return res.status(400).json({ error: "O campo 'cep' é obrigatório!" });
    }

    const prompt = `
    Liste as 5 farmácias mais próximas do CEP: ${cep}.
    Responda **apenas** com JSON puro e completo, sem explicações, sem formatação extra.
    
    **Exemplo de resposta**:
    {
      "farmacias": [
        {
          "nome": "Farmácia São João",
          "distancia": "300m",
          "endereco": "Rua Marechal Floriano, Bairro Centro, Passo Fundo",
          "telefone": "(54) 3311-1234"
        }
      ]
    }
    `;

    const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`
      }
    }
    );

let respostaBruta = response.data.choices[0].message.content || "";

try {
  const respostaLimpa = respostaBruta.replace(/```json|```/g, "").trim();

  const jsonFinal = JSON.parse(respostaLimpa);

  res.json({ farmacias: jsonFinal.farmacias });
} catch (error) {
  console.error("Erro ao processar JSON:", error);
  res.status(500).json({ error: "Erro ao processar a resposta do DeepSeek" });
}
} catch (error) {
console.error("Erro na API do DeepSeek:", error);
res.status(500).json({ error: "Erro ao conectar-se à API do DeepSeek" });
}
});

module.exports = router;
