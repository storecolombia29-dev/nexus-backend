const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// "Base de datos" en memoria
let messages = [];

// ---- WEBHOOK DESDE N8N ----
app.post('/webhook/whatsapp', (req, res) => {
  console.log('Body recibido:', req.body);

  // Soportamos distintas keys por si cambias algo en n8n
  const phone =
    req.body.phone ||
    req.body.celular ||
    req.body.wa_id ||
    'desconocido';

  const text =
    req.body.message ||
    req.body.mensaje ||
    '';

  const now = Date.now();

  messages.push({
    id: now,
    phone,
    message: text,
    createdAt: now,
    raw: req.body,
  });

  return res.json({
    status: 'ok',
    message: 'Webhook recibido y guardado correctamente',
    data: { phone, text },
  });
});

// ---- LISTAR MENSAJES CRUDOS (DEBUG) ----
app.get('/messages', (req, res) => {
  res.json({
    status: 'ok',
    total: messages.length,
    data: messages,
  });
});

// ---- ENDPOINT QUE USA LA APP: /conversations ----
app.get('/conversations', (req, res) => {
  const map = new Map();

  for (const m of messages) {
    if (!m.phone) continue;

    const existing = map.get(m.phone);
    const isoDate = new Date(m.createdAt).toISOString();

    if (!existing) {
      map.set(m.phone, {
        phone: m.phone,
        lastMessage: m.message,
        lastMessageAt: isoDate,
        totalMessages: 1,
        status: 'new', // de momento todo entra como NUEVO
        tags: [],
      });
    } else {
      existing.totalMessages += 1;

      // actualiza último mensaje si este es más reciente
      if (m.createdAt > Date.parse(existing.lastMessageAt)) {
        existing.lastMessage = m.message;
        existing.lastMessageAt = isoDate;
      }
    }
  }

  const data = Array.from(map.values()).sort(
    (a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt)
  );

  res.json({
    status: 'ok',
    total: data.length,
    data,
  });
});

// ---- RUTA RAÍZ (para ver que el backend vive) ----
app.get('/', (_req, res) => {
  res.send('Nexus backend OK ✅');
});

// ---- INICIO DEL SERVIDOR ----
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor listo en puerto ${PORT}`);
});
