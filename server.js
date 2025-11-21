const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// 🔹 Aquí guardaremos los mensajes en memoria (para empezar)
const messages = [];

/* ------- RUTA DE PRUEBA ------- */
app.get('/', (req, res) => {
  res.json({ message: 'Servidor Nexus Backend funcionando' });
});

/* ------- RUTA POST DESDE N8N / WHATSAPP ------- */
app.post('/webhook/whatsapp', (req, res) => {
  console.log('Body recibido:', req.body);

  // Asegúrate de que desde n8n mandas algo como:
  // { mensaje: "...", wa_id: "...", nombre: "...", timestamp: "..." }

  const { mensaje, wa_id, nombre, timestamp } = req.body;

  const msg = {
    id: Date.now(),
    wa_id: wa_id || null,
    nombre: nombre || null,
    mensaje: mensaje || null,
    timestamp: timestamp || new Date().toISOString(),
    raw: req.body, // por si necesitas todo el JSON después
  };

  messages.push(msg);

  res.status(200).json({
    status: 'ok',
    message: 'Webhook recibido correctamente',
    data: msg,
  });
});

/* ------- RUTA GET PARA LEER MENSAJES DESDE NEXUS ------- */
app.get('/messages', (req, res) => {
  // Devuelve los mensajes en orden del más reciente al más antiguo
  res.json({
    status: 'ok',
    total: messages.length,
    data: [...messages].reverse(),
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
