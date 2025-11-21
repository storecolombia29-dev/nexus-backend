const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Base de datos temporal (en memoria)
let mensajes = [];

// Ruta POST Webhook
app.post('/webhook/whatsapp', (req, res) => {
  console.log('Body recibido:', req.body);

  // Guardar mensaje en la "DB"
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

// Ruta GET para ver mensajes guardados
app.get('/messages', (req, res) => {
  res.json({
    status: "ok",
    total: mensajes.length,
    data: mensajes
  });
});

// Puerto Render
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
// ---------- LISTAR CONVERSACIONES (agrupadas por phone) ----------
app.get('/conversations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.phone,
        MAX(m.created_at) AS last_message_at,
        COUNT(*) AS total_messages,
        -- último mensaje de ese teléfono
        (
          SELECT m2.message
          FROM messages m2
          WHERE m2.phone = m.phone
          ORDER BY m2.created_at DESC
          LIMIT 1
        ) AS last_message
      FROM messages m
      GROUP BY m.phone
      ORDER BY last_message_at DESC;
    `);

    // Aquí podrías meter lógica de estado (NUEVO, AGENTE, RESUELTO) más adelante
    const conversations = result.rows.map(row => ({
      phone: row.phone,
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at,
      totalMessages: row.total_messages,
      status: 'NUEVO',      // por ahora hardcodeado
      tags: [],             // luego puedes llenar esto
    }));

    res.json({
      status: 'ok',
      total: conversations.length,
      data: conversations,
    });
  } catch (err) {
    console.error('❌ Error al consultar conversaciones:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error al consultar conversaciones',
    });
  }
});



