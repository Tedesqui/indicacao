// =================================================================
//      BACKEND PARA FORMULÁRIO DE INDICAÇÃO COM SENDGRID
//      (Versão final com CORS configurado para Vercel)
// =================================================================

// 1. IMPORTAÇÃO DAS DEPENDÊNCIAS
const express = require('express');
const cors = require('cors'); // A biblioteca CORS
const multer = require('multer');
const sgMail = require('@sendgrid/mail'); // Biblioteca oficial do SendGrid
require('dotenv').config(); // Carrega as variáveis de ambiente

// 2. INICIALIZAÇÃO E CONFIGURAÇÃO
const app = express();
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Configura o SendGrid com sua Chave de API

// 3. MIDDLEWARES

// Configuração explícita de CORS para permitir requisições de qualquer origem
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Middleware para entender JSON no corpo das requisições
app.use(express.json());

// Configuração do Multer para upload de arquivos em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// 4. DEFINIÇÃO DE ROTAS

// Rota raiz (GET /) para verificar se a API está online
// A Vercel direciona a requisição de '/' para '/public/index.html' por causa do vercel.json,
// mas esta rota é útil para testes e garante que a API responde.
app.get('/api', (req, res) => {
    res.status(200).json({ status: 'API com SendGrid e CORS configurado está online!' });
});

// Rota principal (POST /api/send-report) para receber os dados do formulário
app.post('/api/send-report', upload.single('foto'), async (req, res) => {
    try {
        // Extrai os dados do corpo da requisição e o arquivo
        const { 'Digite seu nome': nome, 'Endereço da Indicação': endereco, 'Descrição da Indicação ': descricao } = req.body;
        const foto = req.file;

        // Validação dos dados recebidos
        if (!nome || !endereco || !descricao || !foto) {
            return res.status(400).json({ success: false, message: 'Todos os campos, incluindo a foto, são obrigatórios.' });
        }
        
        // Converte o buffer da imagem para Base64, formato que o SendGrid usa para anexos
        const anexoEmBase64 = foto.buffer.toString('base64');

        // Monta o objeto da mensagem para a API do SendGrid
        const msg = {
            to: process.env.EMAIL_RECEIVER,
            from: process.env.SENDGRID_FROM_EMAIL, // Seu e-mail verificado no SendGrid
            subject: `Nova Indicação de Problema: ${endereco}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h1 style="color: #0056b3;">Relatório de Indicação Recebido</h1>
                    <p>Um novo relatório foi enviado através do formulário do site.</p>
                    <hr>
                    <h3><strong>De:</strong> ${nome}</h3>
                    <h3><strong>Endereço da Indicação:</strong> ${endereco}</h3>
                    <h3><strong>Descrição do Problema:</strong></h3>
                    <p style="background-color: #f4f4f4; border-left: 5px solid #007bff; padding: 15px; white-space: pre-wrap;">${descricao}</p>
                    <hr>
                    <p>A foto da indicação está anexa a este e-mail.</p>
                </div>
            `,
            attachments: [
                {
                    content: anexoEmBase64,
                    filename: foto.originalname,
                    type: foto.mimetype,
                    disposition: 'attachment',
                },
            ],
        };

        // Envia o e-mail
        await sgMail.send(msg);

        console.log(`E-mail enviado com sucesso de: ${nome} via SendGrid`);
        
        // Retorna a resposta de sucesso para o frontend
        res.status(200).json({ success: true, message: 'Relatório enviado com sucesso!' });

    } catch (error) {
        // Em caso de erro, registra no console do servidor e retorna uma mensagem de erro
        console.error('Erro do SendGrid:', error.response?.body || error.message);
        res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao tentar enviar o e-mail.' });
    }
});


// Exporta o app para ser usado pela Vercel
module.exports = app;
