/*
// --- INSTRUÇÕES DE CONFIGURAÇÃO ---
// 1. Instale o Node.js no seu computador ou servidor.
// 2. Crie uma pasta para o projeto e salve este arquivo como "server.js" dentro dela.
// 3. Abra o terminal (ou prompt de comando) nessa pasta e execute os seguintes comandos:
//    npm init -y
//    npm install express nodemailer multer cors
// 4. Configure as variáveis de ambiente (EMAIL_USER, EMAIL_PASS) na sua plataforma de hospedagem (Vercel, etc.).
// 5. Para iniciar o servidor localmente, crie um arquivo .env ou execute: node server.js

const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000; // Porta em que o servidor irá rodar

// --- Middlewares ---
// Habilita o CORS para permitir que o seu frontend (mesmo em um arquivo local) se comunique com este backend.
app.use(cors()); 
// Permite que o express entenda dados de formulário simples
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração do Multer para lidar com o upload do arquivo (foto) em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Rota Principal para Envio do Relatório ---
// O 'upload.single('foto')' garante que ele vai processar um único arquivo vindo do campo com name="foto"
app.post('/send-report', upload.single('foto'), (req, res) => {
    console.log("Recebendo dados do formulário...");

    // Extrai os dados do corpo da requisição
    const { 'Nome do Relator': nome, 'Endereço do Problema': endereco, 'Descrição do Problema': descricao } = req.body;
    const foto = req.file;

    // Verificação simples para garantir que todos os dados chegaram
    if (!nome || !endereco || !descricao || !foto) {
        console.log("Erro: Faltando dados do formulário.");
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }
    
    // --- Configuração do Nodemailer (TRANSPORTE DE E-MAIL) ---
    // As credenciais agora são lidas de variáveis de ambiente para maior segurança.
    // Você deve configurar as variáveis EMAIL_USER e EMAIL_PASS na sua plataforma de hospedagem (Vercel, Netlify, etc.).
    const transporter = nodemailer.createTransport({
        service: 'gmail', // ou outro serviço como Outlook, etc.
        auth: {
            user: process.env.EMAIL_USER, // Lê a variável de ambiente
            pass: process.env.EMAIL_PASS  // Lê a variável de ambiente
        }
    });

    // --- Montagem do E-mail ---
    const mailOptions = {
        from: `"Relatório de Problemas" <${process.env.EMAIL_USER}>`, // E-mail que aparecerá como remetente
        to: 'jk.tedesqui@gmail.com', // E-MAIL QUE RECEBERÁ O RELATÓRIO
        subject: `Novo Relatório de Problema: ${endereco}`,
        // Corpo do e-mail em HTML para melhor formatação
        html: `
            <h1>Novo Relatório de Problema Recebido</h1>
            <p><strong>Nome do Relator:</strong> ${nome}</p>
            <p><strong>Endereço da Ocorrência:</strong> ${endereco}</p>
            <p><strong>Descrição:</strong></p>
            <p>${descricao}</p>
            <hr>
            <p>A foto do problema está anexada a este e-mail.</p>
        `,
        // Anexa a foto
        attachments: [
            {
                filename: foto.originalname,
                content: foto.buffer, // O buffer da imagem que está na memória
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

// --- Inicia o Servidor ---
app.listen(port, () => {
    console.log(`Servidor de backend rodando em http://localhost:${port}`);
});
