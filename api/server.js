// --- Backend para o formulário de Indicação ---
// Este servidor foi criado para ser compatível com o seu HTML e para ser hospedado na Vercel.

const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');

const app = express();

// --- Configuração de CORS (Cross-Origin Resource Sharing) ---
// Permite que o seu site na Vercel comunique com este backend.
app.use(cors());

// Middlewares para processar os dados do formulário
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do Multer para lidar com o upload da foto em memória
const upload = multer({ storage: multer.memoryStorage() });

// --- Rota de Envio ---
// A rota '/send-report' corresponde exatamente ao URL no seu código JavaScript.
// O 'upload.single('foto')' captura o ficheiro do campo com name="foto".
app.post('/send-report', upload.single('foto'), (req, res) => {
    console.log("Recebendo dados do formulário...");

    // Extrai os dados do corpo da requisição usando os nomes exatos do seu HTML.
    // ATENÇÃO: O campo 'Descrição da Indicação ' tem um espaço no final no seu HTML.
    const {
        'Digite seu nome': nome,
        'Endereço da Indicação': endereco,
        'Descrição da Indicação ': descricao
    } = req.body;
    const foto = req.file;

    // Validação para garantir que todos os dados chegaram
    if (!nome || !endereco || !descricao || !foto) {
        console.log("Erro: Faltando dados do formulário.");
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }
    
    // --- Configuração do Nodemailer ---
    // Utiliza as variáveis de ambiente (EMAIL_USER, EMAIL_PASS) que você configurou na Vercel.
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
        to: 'email-de-destino@exemplo.com', // **IMPORTANTE: Altere para o e-mail que receberá as indicações**
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
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar o e-mail:', error);
            return res.status(500).json({ success: false, message: 'Ocorreu um erro ao enviar o e-mail.' });
        }
        console.log('E-mail enviado com sucesso:', info.response);
        res.status(200).json({ success: true, message: 'Indicação enviada com sucesso!' });
    });
});

// Exporta a aplicação para a Vercel. Não use app.listen().
module.exports = app;
