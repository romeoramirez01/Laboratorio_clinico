const express = require('express');
const router = express.Router();
const pool = require('../backend/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.nombres, u.apellidos
      FROM citas c
      LEFT JOIN usuarios u ON u.id = c.paciente_id
      ORDER BY c.id DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR listar citas:', error);
    return res.status(500).json({ error: 'Error al cargar citas' });
  }
});

router.get('/mias', async (req, res) => {
  try {
    const pacienteId = req.query.id;

    if (!pacienteId) {
      return res.status(400).json({ error: 'Falta id del paciente' });
    }

    const result = await pool.query(`
      SELECT *
      FROM citas
      WHERE paciente_id = $1
      ORDER BY fecha DESC, hora DESC
    `, [pacienteId]);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR mis citas:', error);
    return res.status(500).json({ error: 'Error al cargar citas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { paciente_id, fecha, hora, motivo } = req.body;

    if (!paciente_id || !fecha || !hora || !motivo) {
      return res.status(400).json({ error: 'Faltan datos de la cita' });
    }

    const result = await pool.query(
      `INSERT INTO citas (paciente_id, fecha, hora, motivo, estado)
       VALUES ($1, $2, $3, $4, 'pendiente')
       RETURNING *`,
      [paciente_id, fecha, hora, motivo]
    );

    return res.status(201).json({
      message: 'Cita creada correctamente',
      cita: result.rows[0]
    });
  } catch (error) {
    console.error('ERROR crear cita:', error);
    return res.status(500).json({ error: 'Error al crear cita' });
  }
});

module.exports = router;