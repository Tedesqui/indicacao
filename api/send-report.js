const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const runMiddleware = (req, res, fn) =>
    new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Método não permitido.' });
        return;
    }

    try {
        await runMiddleware(req, res, upload.single('foto'));

        const { nome, endereco, descricao } = req.body;
        console.log('Nome:', nome);
        console.log('Endereço:', endereco);
        console.log('Descrição:', descricao);
        console.log('Arquivo recebido:', req.file ? req.file.originalname : 'nenhum arquivo');

        // Aqui você poderia enviar para banco de dados ou storage na nuvem.

        res.status(200).json({ success: true, message: 'Relatório enviado com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao processar a indicação.' });
    }
};
