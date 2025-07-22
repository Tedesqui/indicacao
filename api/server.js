// 1. IMPORTAÇÃO DAS DEPENDÊNCIAS
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

// 2. INICIALIZAÇÃO DO APP
const app = express();

// 3. CONFIGURAÇÃO DE MIDDLEWARES
app.use(cors()); // Permite que seu frontend acesse a API
app.use(express.json()); // Permite que o servidor entenda o formato JSON

// 4. CONFIGURAÇÃO DO MULTER (PARA UPLOAD DA FOTO)
// Usamos 'memoryStorage' para guardar o arquivo na memória RAM, ideal para anexar ao e-mail sem salvar em disco.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 5. CONFIGURAÇÃO DO NODEMAILER (PARA ENVIAR E-MAIL)
// Configura o "transportador" de e-mail usando as credenciais do seu .env
// IMPORTANTE: Use uma "Senha de App" do Google, não sua senha normal.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Seu e-mail (ex: seu.email@gmail.com)
        pass: process.env.EMAIL_PASS, // Sua Senha de App de 16 dígitos
    },
});

// 6. DEFINIÇÃO DE ROTAS

// Rota principal para verificar se a API está online
app.get('/', (req, res) => {
    res.status(200).json({ status: 'API online e funcionando!' });
});

// Rota para receber o formulário. Note o `upload.single('foto')` que captura o arquivo.
app.post('/send-report', upload.single('foto'), async (req, res) => {
    try {
        // Extrai os dados do corpo da requisição (req.body) e o arquivo (req.file)
        // Os nomes das chaves devem ser EXATAMENTE os mesmos dos atributos `name` no seu HTML.
        const { 'Digite seu nome': nome, 'Endereço da Indicação': endereco, 'Descrição da Indicação ': descricao } = req.body;
        const foto = req.file;

        // Validação para garantir que todos os dados chegaram
        if (!nome || !endereco || !descricao || !foto) {
            return res.status(400).json({ success: false, message: 'Todos os campos, incluindo a foto, são obrigatórios.' });
        }

        // Monta o corpo do e-mail em HTML para ficar mais bonito
        const mailOptions = {
            from: `Relatório de Indicação <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_RECEIVER, // O e-mail que receberá os relatórios
            subject: `Nova Indicação de Problema: ${endereco}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h1 style="color: #0056b3;">Relatório de Indicação Recebido</h1>
                    <p>Olá, um novo relatório foi enviado através do formulário do site.</p>
                    <hr>
                    <h3><strong>De:</strong> ${nome}</h3>
                    <h3><strong>Endereço da Indicação:</strong> ${endereco}</h3>
                    <h3><strong>Descrição do Problema:</strong></h3>
                    <p style="background-color: #f4f4f4; border-left: 5px solid #007bff; padding: 15px; white-space: pre-wrap;">${descricao}</p>
                    <hr>
                    <p>A foto enviada pelo usuário está anexa a este e-mail.</p>
                </div>
            `,
            attachments: [
                {
                    filename: foto.originalname, // Nome original da foto
                    content: foto.buffer,      // O conteúdo da foto
                    contentType: foto.mimetype // O tipo da foto (ex: image/jpeg)
                }
            ]
        };

        // Envia o e-mail
        await transporter.sendMail(mailOptions);

        // Responde ao frontend com sucesso
        console.log(`E-mail enviado com sucesso de: ${nome}`);
        res.status(200).json({ success: true, message: 'Relatório enviado com sucesso!' });

    } catch (error) {
        // Em caso de erro, informa no console e responde ao frontend
        console.error('Erro ao processar a requisição:', error);
        res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor. Tente novamente.' });
    }
});


// 7. INICIALIZAÇÃO DO SERVIDOR
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Exporta o app para a Vercel
module.exports = app;