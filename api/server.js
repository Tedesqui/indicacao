// --- INSTRUÇÕES DE CONFIGURAÇÃO ---
// Este ficheiro foi ajustado para ser compatível com o ambiente serverless da Vercel.
// A linha "app.listen()" foi removida e "module.exports = app;" foi adicionada.

const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();

// --- Middlewares ---
app.use(cors()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração do Multer para lidar com o upload do ficheiro (foto) em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Rota Principal para Envio do Relatório ---
app.post('/send-report', upload.single('foto'), (req, res) => {
    console.log("Recebendo dados do formulário...");

    const { 'Seu Nome Completo': nome, 'Endereço da Indicação': endereco, 'Descrição do Problema': descricao } = req.body;
    const foto = req.file;

    if (!nome || !endereco || !descricao || !foto) {
        console.log("Erro: Faltando dados do formulário.");
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }
    
    // --- Configuração do Nodemailer ---
    // As credenciais são lidas de variáveis de ambiente configuradas na Vercel.
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
        to: 'jk.tedesqui@gmail.com', // Altere para o e-mail que receberá o relatório
        subject: `Novo Relatório de Indicação: ${endereco}`,
        html: `
            <h1>Novo Relatório de Indicação Recebido</h1>
            <p><strong>Nome do Relator:</strong> ${nome}</p>
            <p><strong>Endereço da Indicação:</strong> ${endereco}</p>
            <p><strong>Descrição:</strong></p>
            <p>${descricao}</p>
            <hr>
            <p>A foto do problema está anexada a este e-mail.</p>
        `,
        attachments: [
            {
                filename: foto.originalname,
                content: foto.buffer,
                contentType: foto.mimetype
            }
        ]
    };

    // --- Envio do E-mail ---
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Erro ao enviar e-mail:', error);
            return res.status(500).json({ success: false, message: 'Ocorreu um erro ao enviar o e-mail.' });
        }
        console.log('E-mail enviado com sucesso: ' + info.response);
        res.status(200).json({ success: true, message: 'Relatório enviado com sucesso!' });
    });
});

// --- Exporta a Aplicação para a Vercel ---
// A Vercel precisa que a aplicação Express seja exportada para que ela possa geri-la.
module.exports = app;
