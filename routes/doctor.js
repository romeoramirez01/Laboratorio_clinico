const express = require('express');
const router = express.Router();
const pool = require('../backend/database');

router.get('/pacientes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM usuarios
      WHERE rol = 'paciente'
      ORDER BY id DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR doctor pacientes:', error);
    return res.status(500).json({ error: 'Error al cargar pacientes' });
  }
});

router.get('/citas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.nombres, u.apellidos
      FROM citas c
      LEFT JOIN usuarios u ON u.id = c.paciente_id
      ORDER BY c.fecha, c.hora
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR doctor citas:', error);
    return res.status(500).json({ error: 'Error al cargar citas' });
  }
});

module.exports = router;