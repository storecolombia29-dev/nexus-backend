const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Ruta GET de prueba
app.get('/', (req, res) => {
    res.json({ message: 'Servidor Nexus Backend funcionando' });
});

// Ruta POST Webhook
app.post('/webhook/whatsapp', (req, res) => {
    console.log('Body recibido:', req.body);

    res.status(200).json({
        status: 'ok',
        message: 'Webhook recibido correctamente',
        data: req.body
    });
});

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
