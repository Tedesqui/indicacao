// Importação das dependências
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

// Inicialização do Express
const app = express();

// Configuração dos Middlewares
// Habilita o CORS para permitir requisições do seu frontend
app.use(cors());
// Permite que o Express entenda requisições com corpo em JSON
app.use(express.json());
// Permite que o Express entenda requisições com corpo URL-encoded
app.use(express.urlencoded({ extended: true }));

// Configuração do Multer para lidar com o upload da foto
// Vamos armazenar a foto em memória para anexá-la diretamente ao e-mail
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuração do Nodemailer (transporter)
// É aqui que você coloca as credenciais do seu e-mail.
// Use variáveis de ambiente para segurança!
const transporter = nodemailer.createTransport({
    service: 'gmail', // ou outro provedor de e-mail
    auth: {
        user: process.env.EMAIL_USER, // Seu e-mail (ex: seuemail@gmail.com)
        pass: process.env.EMAIL_PASS, // Sua Senha de App do Google
    },
});

// Definição da rota POST para /send-report
// O 'upload.single('foto')' é o middleware do Multer que processa o arquivo do campo 'foto'
app.post('/send-report', upload.single('foto'), async (req, res) => {
    // Extrai os dados do corpo da requisição
    const { 'Digite seu nome': nome, 'Endereço da Indicação': endereco, 'Descrição da Indicação ': descricao } = req.body;
    
    // O arquivo da foto estará em req.file
    const foto = req.file;

    // Validação básica para garantir que todos os dados chegaram
    if (!nome || !endereco || !descricao || !foto) {
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }

    // Montagem do corpo do e-mail em HTML para uma melhor visualização
    const mailOptions = {
        from: `Relatório de Indicação <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_RECEIVER, // O e-mail que receberá o relatório
        subject: `Nova Indicação Recebida de: ${nome}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2 style="color: #0056b3;">Nova Indicação de Problema Recebida</h2>
                <p>Você recebeu um novo relatório através do formulário online.</p>
                <hr>
                <h3>Detalhes da Indicação:</h3>
                <ul>
                    <li><strong>Nome do Indicador:</strong> ${nome}</li>
                    <li><strong>Endereço:</strong> ${endereco}</li>
                </ul>
                <h3>Descrição do Problema:</h3>
                <p style="background-color: #f4f4f4; border-left: 4px solid #007bff; padding: 10px;">
                    ${descricao}
                </p>
                <hr>
                <p>Uma foto foi anexada a este e-mail para análise.</p>
            </div>
        `,
        attachments: [
            {
                filename: foto.originalname, // Nome original do arquivo
                content: foto.buffer,      // O conteúdo do arquivo em buffer
                contentType: foto.mimetype // O tipo do arquivo (ex: image/jpeg)
            }
        ]
    };

    try {
        // Envio do e-mail
        await transporter.sendMail(mailOptions);
        
        // Resposta de sucesso para o frontend
        console.log(`E-mail enviado com sucesso de ${nome}`);
        res.status(200).json({ success: true, message: 'Relatório enviado com sucesso!' });

    } catch (error) {
        // Resposta de erro para o frontend
        console.error('Erro ao enviar o e-mail:', error);
        res.status(500).json({ success: false, message: 'Ocorreu um erro no servidor ao tentar enviar o e-mail.' });
    }
});

// Define a porta do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Exporta o app para a Vercel (necessário para a arquitetura serverless)
module.exports = app;
