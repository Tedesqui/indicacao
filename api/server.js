// =================================================================
//      BACKEND PARA FORMULÁRIO DE INDICAÇÃO COM SENDGRID
// =================================================================

// 1. IMPORTAÇÃO DAS DEPENDÊNCIAS
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sgMail = require('@sendgrid/mail'); // Importa a biblioteca do SendGrid
require('dotenv').config();

// 2. INICIALIZAÇÃO E CONFIGURAÇÃO DO APP E SENDGRID
const app = express();
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Configura o SendGrid com sua Chave de API

// 3. MIDDLEWARES
app.use(cors());
app.use(express.json());

// 4. CONFIGURAÇÃO DO MULTER (Não muda)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 5. DEFINIÇÃO DE ROTAS
app.get('/', (req, res) => {
    res.status(200).json({ status: 'API com SendGrid está online!' });
});

app.post('/send-report', upload.single('foto'), async (req, res) => {
    try {
        // Extrai os dados do corpo da requisição e o arquivo
        const { 'Digite seu nome': nome, 'Endereço da Indicação': endereco, 'Descrição da Indicação ': descricao } = req.body;
        const foto = req.file;

        // Validação
        if (!nome || !endereco || !descricao || !foto) {
            return res.status(400).json({ success: false, message: 'Todos os campos, incluindo a foto, são obrigatórios.' });
        }
        
        // Converte o buffer da imagem para Base64, que é o formato que o SendGrid usa para anexos
        const anexoEmBase64 = foto.buffer.toString('base64');

        // Monta a mensagem para a API do SendGrid
        const msg = {
            to: process.env.EMAIL_RECEIVER, // O destinatário do relatório
            from: process.env.SENDGRID_FROM_EMAIL, // SEU E-MAIL VERIFICADO no SendGrid
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

        // Envia o e-mail usando a API do SendGrid
        await sgMail.send(msg);

        console.log(`E-mail enviado com sucesso de: ${nome} via SendGrid`);
        res.status(200).json({ success: true, message: 'Relatório enviado com sucesso!' });

    } catch (error) {
        console.error('Erro do SendGrid:', error.response?.body || error.message);
        res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao tentar enviar o e-mail.' });
    }
});


// 6. INICIALIZAÇÃO DO SERVIDOR
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Exporta o app para a Vercel
module.exports = app;
