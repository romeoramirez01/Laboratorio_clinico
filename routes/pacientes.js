const express = require('express');
const router = express.Router();
const pool = require('../backend/database');

// Listar pacientes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM usuarios
      WHERE rol = 'paciente'
      ORDER BY id DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR listar pacientes:', error);
    return res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

// Obtener perfil del paciente
router.get('/mi-perfil', async (req, res) => {
  try {
    const pacienteId = req.query.id || req.headers['x-user-id'];

    if (!pacienteId) {
      return res.status(400).json({ error: 'Falta id del paciente' });
    }

    const result = await pool.query(`
      SELECT *
      FROM usuarios
      WHERE id = $1 AND rol = 'paciente'
    `, [pacienteId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('ERROR mi-perfil:', error);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

module.exports = router;