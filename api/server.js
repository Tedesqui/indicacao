// --- INSTRUÇÕES DE CONFIGURAÇÃO ---
// Este ficheiro foi ajustado com logs de diagnóstico e uma configuração de CORS mais explícita.

const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');

console.log("Servidor a iniciar..."); // Log de diagnóstico 1

const app = express();

// --- Configuração de CORS (Cross-Origin Resource Sharing) ---
// IMPORTANTE: Substitua 'https://seu-site-frontend.vercel.app' pelo URL real do seu site na Vercel.
const allowedOrigins = ['https://tedesqui-indicacao.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem 'origin' (como de apps mobile ou Postman) ou se a origem estiver na lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido por CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração do Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Verificação das Variáveis de Ambiente ---
// Este log é crucial para o diagnóstico.
console.log("A verificar variáveis de ambiente...");
console.log(`EMAIL_USER carregado: ${process.env.EMAIL_USER ? 'Sim' : 'NÃO'}`);
console.log(`EMAIL_PASS carregado: ${process.env.EMAIL_PASS ? 'Sim' : 'NÃO'}`);


// --- Rota Principal para Envio do Relatório ---
app.post('/', upload.single('foto'), (req, res) => {
    console.log("Rota POST '/' foi acionada...");

    const { 'Seu Nome Completo': nome, 'Endereço da Indicação': endereco, 'Descrição da Indicação': descricao } = req.body;
    const foto = req.file;

    if (!nome || !endereco || !descricao || !foto) {
        console.log("Erro: Faltando dados do formulário.");
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }
    
    // --- Configuração do Nodemailer ---
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log("ERRO CRÍTICO: As variáveis de ambiente EMAIL_USER ou EMAIL_PASS não estão definidas.");
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
        from: `"Relatório de Indicação" <${process.env.EMAIL_USER}>`,
        to: 'email-de-destino@exemplo.com', // Altere para o e-mail que receberá o relatório
        subject: `Novo Relatório de Indicação: ${endereco}`,
        html: `<h1>Novo Relatório de Indicação Recebido</h1><p><strong>Nome do Relator:</strong> ${nome}</p><p><strong>Endereço da Ocorrência:</strong> ${endereco}</p><p><strong>Descrição:</strong></p><p>${descricao}</p><hr><p>A foto do problema está anexada a este e-mail.</p>`,
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
            console.log('Erro no Nodemailer:', error);
            return res.status(500).json({ success: false, message: 'Ocorreu um erro ao enviar o e-mail.' });
        }
        console.log('E-mail enviado com sucesso: ' + info.response);
        res.status(200).json({ success: true, message: 'Relatório enviado com sucesso!' });
    });
});

// Exporta a aplicação para a Vercel
module.exports = app;
