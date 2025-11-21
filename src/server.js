const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Base de datos temporal (en memoria)
let mensajes = [];

// Webhook
app.post('/webhook/whatsapp', (req, res) => {
  console.log('Body recibido:', req.body);

  mensajes.push({
    id: Date.now(),
    from: req.body.from || "",
    message: req.body.message || "",
    full: req.body
  });

  res.status(200).json({
    status: 'ok',
    message: 'Webhook recibido y guardado correctamente',
    data: req.body
  });
});

// GET mensajes
app.get('/messages', (req, res) => {
  res.json({
    status: "ok",
    total: mensajes.length,
    data: mensajes
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor listo en " + PORT));
