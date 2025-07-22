// --- Backend para o formulário de Indicação ---
// Versão com diagnóstico melhorado e configuração de CORS explícita.

const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');

const app = express();

// --- Configuração de CORS (Cross-Origin Resource Sharing) ---
// IMPORTANTE: Confirme se 'https://tedesqui-indicacao.vercel.app' é o URL exato do seu site.
const corsOptions = {
  origin: 'https://tedesqui-indicacao.vercel.app',
  optionsSuccessStatus: 200 // para browsers mais antigos
};
app.use(cors(corsOptions));

// Middlewares para processar os dados do formulário
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do Multer
const upload = multer({ storage: multer.memoryStorage() });

// --- Rota de Verificação (Health Check) ---
// Pode testar esta rota diretamente no navegador para ver se o servidor está online.
// URL: https://tedesqui-indicacao.vercel.app/send-report
app.get('/send-report', (req, res) => {
    console.log("Rota GET de verificação acionada com sucesso.");
    res.status(200).json({ message: 'O servidor de backend está a funcionar corretamente.' });
});

// --- Rota de Envio do Formulário ---
app.post('/send-report', upload.single('foto'), (req, res) => {
    console.log("Rota POST acionada. A processar o formulário...");
    console.log("Dados recebidos:", req.body); // Log para ver os dados que chegam

    // Extrai os dados do corpo da requisição usando os nomes exatos do seu HTML.
    const {
        'Digite seu nome': nome,
        'Endereço da Indicação': endereco,
        'Descrição da Indicação ': descricao
    } = req.body;
    const foto = req.file;

    // Validação
    if (!nome || !endereco || !descricao || !foto) {
        console.error("Erro: Faltando dados do formulário.", { nome, endereco, descricao, foto: !!foto });
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }
    
    // --- Configuração do Nodemailer ---
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("ERRO CRÍTICO: Variáveis de ambiente EMAIL_USER ou EMAIL_PASS não encontradas.");
        return res.status(500).json({ success: false, message: 'Erro de configuração no servidor.' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // --- Montagem do E-mail ---
    const mailOptions = {
        from: `"Relatório de Indicações" <${process.env.EMAIL_USER}>`,
        to: 'jk.tedesqui@gmail.com', // **IMPORTANTE: Altere para o e-mail que receberá as indicações**
        subject: `Nova Indicação Recebida: ${endereco}`,
        html: `
            <h1>Nova Indicação Recebida</h1>
            <p><strong>Nome do Indicador:</strong> ${nome}</p>
            <p><strong>Endereço da Indicação:</strong> ${endereco}</p>
            <p><strong>Descrição:</strong></p>
            <p>${descricao}</p>
            <hr>
            <p>A foto da indicação está anexada a este e-mail.</p>
        `,
        attachments: [{
            filename: foto.originalname,
            content: foto.buffer,
            contentType: foto.mimetype
        }]
    };

    // --- Envio do E-mail ---
    console.log("A tentar enviar o e-mail...");
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar o e-mail (Nodemailer):', error);
            return res.status(500).json({ success: false, message: 'Ocorreu um erro ao enviar o e-mail.' });
        }
        console.log('E-mail enviado com sucesso:', info.response);
        res.status(200).json({ success: true, message: 'Indicação enviada com sucesso!' });
    });
});

// Exporta a aplicação para a Vercel.
module.exports = app;
