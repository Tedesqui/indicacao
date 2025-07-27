/*
 * Ficheiro: api/send-email.js
 */

const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/send-email', upload.single('foto'), (req, res) => {
    // Extrai os dados
    const { nome, endereco, descricao } = req.body;
    const foto = req.file; // 'foto' será undefined se nenhum ficheiro for enviado

    // Configura o Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // Monta o e-mail base
    const mailOptions = {
        from: `Formulário de Indicação <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_RECEIVER,
        subject: 'Nova Indicação Recebida!',
        html: `
            <h1>Nova Indicação Recebida</h1>
            <p><strong>Nome Completo:</strong> ${nome}</p>
            <p><strong>Endereço da Indicação:</strong> ${endereco}</p>
            <p><strong>Descrição Detalhada:</strong></p>
            <p>${descricao}</p>
            <hr>
            <p>${foto ? 'Uma foto foi enviada em anexo.' : 'Nenhuma foto foi enviada.'}</p>
        `,
        attachments: [], // Inicia com um array de anexos vazio
    };

    // Se uma foto foi enviada, adiciona-a ao array de anexos
    if (foto) {
        mailOptions.attachments.push({
            filename: foto.originalname,
            content: foto.buffer,
            contentType: foto.mimetype,
        });
    }

    // Envia o e-mail
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar e-mail:', error);
            return res.status(500).json({ message: 'Falha ao enviar o e-mail.' });
        }
        res.status(200).json({ message: 'E-mail enviado com sucesso!' });
    });
});

module.exports = app;
