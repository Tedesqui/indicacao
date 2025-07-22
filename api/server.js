// =================================================================
//      BACKEND PARA FORMULÁRIO DE INDICAÇÃO COM SENDGRID
//      (COM CONFIGURAÇÃO DE CORS EXPLÍCITA PARA VERCEL)
// =================================================================

const express = require('express');
const cors = require('cors'); // A biblioteca CORS
const multer = require('multer');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ======================= MUDANÇA PRINCIPAL AQUI =======================
// Em vez de apenas app.use(cors()), vamos passar um objeto de configuração.
// Isso informa explicitamente quais "origens" (sites) podem fazer requisições.
const corsOptions = {
  origin: '*', // Permite requisições de QUALQUER origem. Para mais segurança,
               // você pode substituir '*' pela URL do seu frontend.
               // Ex: origin: 'https://meu-formulario.com'
  methods: ['GET', 'POST', 'OPTIONS'], // Permite os métodos necessários
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
};

app.use(cors(corsOptions)); // Aplica as opções de CORS
// ====================================================================

app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rota raiz para verificação
app.get('/', (req, res) => {
    res.status(200).json({ status: 'API com SendGrid e CORS configurado está online!' });
});

// Rota para o formulário
app.post('/send-report', upload.single('foto'), async (req, res) => {
    try {
        const { 'Digite seu nome': nome, 'Endereço da Indicação': endereco, 'Descrição da Indicação ': descricao } = req.body;
        const foto = req.file;

        if (!nome || !endereco || !descricao || !foto) {
            return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
        }
        
        const anexoEmBase64 = foto.buffer.toString('base64');

        const msg = {
            to: process.env.EMAIL_RECEIVER,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: `Nova Indicação de Problema: ${endereco}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h1>Relatório de Indicação Recebido</h1>
                    <p>De: <strong>${nome}</strong></p>
                    <p>Endereço: <strong>${endereco}</strong></p>
                    <p>Descrição: ${descricao}</p>
                    <p>A foto da indicação está anexa.</p>
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

        await sgMail.send(msg);

        console.log(`E-mail enviado com sucesso de: ${nome} via SendGrid`);
        res.status(200).json({ success: true, message: 'Relatório enviado com sucesso!' });

    } catch (error) {
        console.error('Erro do SendGrid:', error.response?.body || error.message);
        res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao tentar enviar o e-mail.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
