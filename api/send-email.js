/*
 * ---------------------------------------------------------------------------
 * Ficheiro 1: api/send-email.js
 * ---------------------------------------------------------------------------
 * Este é o ficheiro principal do seu backend. Coloque-o dentro de uma pasta
 * chamada "api" na raiz do seu projeto.
 */

const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');

const app = express();

// Habilita o CORS para permitir que o seu frontend (no GitHub Pages)
// se comunique com este backend (na Vercel).
app.use(cors());

// Configura o Multer para processar o upload do ficheiro em memória.
// Isto é eficiente e ideal para ambientes serverless como a Vercel.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Cria a rota (endpoint) que o seu formulário irá chamar.
// O `upload.single('foto')` diz ao servidor para esperar um ficheiro
// no campo do formulário com o atributo name="foto".
app.post('/api/send-email', upload.single('foto'), (req, res) => {
    // Extrai os dados de texto do corpo da requisição
    const { nome, endereco, descricao } = req.body;
    // Extrai o ficheiro da requisição
    const foto = req.file;

    // Validação para garantir que a foto foi enviada
    if (!foto) {
        return res.status(400).json({ message: 'O envio da foto é obrigatório.' });
    }

    // Configura o Nodemailer.
    // Ele usa as Variáveis de Ambiente que você configurará na Vercel
    // para manter as suas credenciais seguras.
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // O seu e-mail do Gmail
            pass: process.env.EMAIL_PASS, // A sua senha de app de 16 dígitos
        },
    });

    // Monta o corpo do e-mail que você receberá
    const mailOptions = {
        from: `Formulário de Indicação <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_RECEIVER, // O e-mail que receberá a notificação
        subject: 'Nova Indicação com Foto Recebida!',
        html: `
            <h1>Nova Indicação Recebida</h1>
            <p><strong>Nome Completo:</strong> ${nome}</p>
            <p><strong>Endereço da Indicação:</strong> ${endereco}</p>
            <p><strong>Descrição Detalhada:</strong></p>
            <p>${descricao}</p>
            <hr>
            <p>A foto enviada segue em anexo.</p>
        `,
        attachments: [
            {
                filename: foto.originalname, // Usa o nome original do ficheiro
                content: foto.buffer,      // O conteúdo da imagem
                contentType: foto.mimetype,  // O tipo do ficheiro (ex: image/jpeg)
            },
        ],
    };

    // Envia o e-mail
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar e-mail:', error);
            return res.status(500).json({ message: 'Falha ao enviar o e-mail.' });
        }
        console.log('E-mail enviado com sucesso:', info.response);
        res.status(200).json({ message: 'E-mail enviado com sucesso!' });
    });
});

// Exporta a aplicação para que a Vercel possa executá-la.
module.exports = app;