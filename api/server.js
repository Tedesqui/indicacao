// =================================================================
//          BACKEND PARA FORMULÁRIO DE INDICAÇÃO
// =================================================================
// Autor: Seu Nome (ou Gemini)
// Data: 22/07/2025
// Descrição: API para receber dados de um formulário, incluindo
//            uma imagem, e enviar tudo por e-mail.
// =================================================================

// 1. IMPORTAÇÃO DAS DEPENDÊNCIAS
// -----------------------------------------------------------------
const express = require('express');        // Framework para criar o servidor
const cors = require('cors');              // Para permitir requisições de outros domínios (seu frontend)
const multer = 'multer');            // Para lidar com upload de arquivos (a foto)
const nodemailer = require('nodemailer');      // Para enviar e-mails
require('dotenv').config();                // Para carregar as variáveis de ambiente do arquivo .env

// 2. INICIALIZAÇÃO E CONFIGURAÇÃO DO APP EXPRESS
// -----------------------------------------------------------------
const app = express();

// Middlewares essenciais
app.use(cors());                           // Habilita o CORS para todas as rotas
app.use(express.json());                   // Habilita o parser de JSON para ler o corpo das requisições
app.use(express.urlencoded({ extended: true })); // Habilita o parser de dados de formulário

// 3. CONFIGURAÇÃO DO MULTER (UPLOAD DE ARQUIVOS)
// -----------------------------------------------------------------
// Usamos 'memoryStorage' para armazenar o arquivo temporariamente na memória RAM.
// É a melhor abordagem para ambientes serverless (como a Vercel) e para
// quando o arquivo será apenas um anexo de e-mail, sem precisar salvá-lo em disco.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 4. CONFIGURAÇÃO DO NODEMAILER (ENVIO DE E-MAIL)
// -----------------------------------------------------------------
// 'transporter' é o objeto responsável por enviar o e-mail.
// As credenciais são puxadas das variáveis de ambiente para segurança.
const transporter = nodemailer.createTransport({
    service: 'gmail', // Usando o serviço do Gmail.
    auth: {
        user: process.env.EMAIL_USER, // O seu e-mail do Gmail
        pass: process.env.EMAIL_PASS, // A "Senha de App" gerada na sua conta Google
    },
});

// 5. DEFINIÇÃO DAS ROTAS DA API
// -----------------------------------------------------------------

/**
 * Rota Raiz (GET /)
 * Utilizada para verificar se a API está online e funcionando.
 * Evita o erro "Cannot GET /" quando acessada diretamente pelo navegador.
 */
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'API de Relatório de Indicações está no ar.',
    instrucao: 'Esta API deve ser consumida pelo formulário do frontend.',
  });
});

/**
 * Rota de Envio de Relatório (POST /send-report)
 * Recebe os dados do formulário, incluindo a foto.
 * O 'upload.single('foto')' é o middleware do Multer que captura o arquivo enviado
 * no campo com `name="foto"`.
 */
app.post('/send-report', upload.single('foto'), async (req, res) => {
    try {
        // Extrai os dados de texto do corpo (req.body)
        const { 'Digite seu nome': nome, 'Endereço da Indicação': endereco, 'Descrição da Indicação ': descricao } = req.body;
        
        // Extrai o arquivo da requisição (req.file)
        const foto = req.file;

        // Validação: Verifica se todos os campos e a foto foram recebidos
        if (!nome || !endereco || !descricao || !foto) {
            console.log('Tentativa de envio com campos faltando.');
            return res.status(400).json({ success: false, message: 'Erro: Todos os campos, incluindo a foto, são obrigatórios.' });
        }

        // Monta o objeto com as opções do e-mail
        const mailOptions = {
            from: `Formulário de Indicação <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_RECEIVER, // E-mail que vai receber os relatórios
            subject: `Nova Indicação de Problema em: ${endereco}`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #333;">
                    <h1 style="color: #0056b3;">Relatório de Indicação</h1>
                    <p>Um novo relatório foi enviado através do formulário.</p>
                    <table cellpadding="10" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background-color: #f4f5f7;">
                            <td style="border: 1px solid #dfe1e6; font-weight: bold; width: 150px;">Indicado por:</td>
                            <td style="border: 1px solid #dfe1e6;">${nome}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #dfe1e6; font-weight: bold;">Endereço:</td>
                            <td style="border: 1px solid #dfe1e6;">${endereco}</td>
                        </tr>
                    </table>
                    <h2 style="color: #091e42; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Descrição Detalhada</h2>
                    <div style="background-color: #fafbfc; border: 1px solid #dfe1e6; border-radius: 6px; padding: 15px; white-space: pre-wrap;">${descricao}</div>
                    <p style="margin-top: 20px; font-style: italic;">A foto da indicação está anexada a este e-mail.</p>
                </div>
            `,
            attachments: [{
                filename: foto.originalname, // Nome original do arquivo
                content: foto.buffer,      // Os dados binários do arquivo
                contentType: foto.mimetype // O tipo do arquivo (ex: 'image/jpeg')
            }]
        };

        // Envia o e-mail
        await transporter.sendMail(mailOptions);
        
        console.log(`Relatório de '${nome}' enviado com sucesso para ${process.env.EMAIL_RECEIVER}`);
        
        // Retorna uma resposta de sucesso para o frontend
        res.status(200).json({ success: true, message: 'Sua mensagem foi enviada e será analisada o mais rápido possível!' });

    } catch (error) {
        // Em caso de erro, registra no console do servidor e retorna uma mensagem de erro genérica
        console.error('Falha no envio do relatório:', error);
        res.status(500).json({ success: false, message: 'Ocorreu um erro inesperado no servidor. Tente novamente mais tarde.' });
    }
});

// 6. INICIALIZAÇÃO DO SERVIDOR
// -----------------------------------------------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor iniciado e ouvindo na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT} para verificar o status da API.`);
});

// 7. EXPORTAÇÃO DO APP (Necessário para a Vercel)
// -----------------------------------------------------------------
module.exports = app;
