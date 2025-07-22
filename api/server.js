const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/send-report', upload.single('foto'), (req, res) => {
    const { nome, endereco, descricao } = req.body;
    console.log(nome, endereco, descricao);
    console.log(req.file); // Aqui você salva no cloud ou ignora.

    res.status(200).json({ success: true });
});

app.listen(3000);
