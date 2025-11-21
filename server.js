const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------- CONEXIÓN A POSTGRES ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Crear tabla si no existe
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(30),
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Tabla messages lista');
  } catch (err) {
    console.error('Error creando tabla:', err);
  }
})();

// ---------- RUTA WEBHOOK DESDE N8N ----------
app.post('/webhook/whatsapp', async (req, res) => {
  const { phone, message } = req.body;

  try {
    await pool.query(
      'INSERT INTO messages (phone, message) VALUES ($1, $2)',
      [phone, message]
    );

    res.json({
      status: 'ok',
      message: 'Guardado en base de datos',
      data: req.body,
    });
  } catch (err) {
    console.error('Error guardando mensaje:', err);
    res.status(500).json({ error: 'Error guardando mensaje' });
  }
});

// ---------- LISTAR MENSAJES ----------
app.get('/messages', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM messages ORDER BY id DESC'
    );

    res.json({
      status: 'ok',
      total: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error consultando mensajes' });
  }
});

// ---------- LISTAR CONVERSACIONES ----------
app.get('/conversations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.phone,
        MAX(m.created_at) AS last_message_at,
        COUNT(*) AS total_messages,
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

    const conversations = result.rows.map(row => ({
      phone: row.phone,
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at,
      totalMessages: row.total_messages,
      status: 'NUEVO',
      tags: [],
    }));

    res.json({
      status: 'ok',
      total: conversations.length,
      data: conversations,
    });
  } catch (err) {
    console.error('Error en /conversations', err);
    res.status(500).json({ error: 'Error consultando conversaciones' });
  }
});

// ---------- INICIO SERVIDOR ----------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
