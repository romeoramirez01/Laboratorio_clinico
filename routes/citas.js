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
    console.error('ERROR citas del paciente:', error);
    return res.status(500).json({ error: 'Error al cargar citas del paciente' });
  }
});

router.get('/agenda', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.nombres, u.apellidos
      FROM citas c
      LEFT JOIN usuarios u ON u.id = c.paciente_id
      ORDER BY c.fecha, c.hora
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR agenda doctor:', error);
    return res.status(500).json({ error: 'Error al cargar agenda' });
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

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, hora, motivo, estado } = req.body;

    const result = await pool.query(
      `UPDATE citas
       SET fecha = COALESCE($1, fecha),
           hora = COALESCE($2, hora),
           motivo = COALESCE($3, motivo),
           estado = COALESCE($4, estado)
       WHERE id = $5
       RETURNING *`,
      [fecha, hora, motivo, estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    return res.json({
      message: 'Cita actualizada correctamente',
      cita: result.rows[0]
    });
  } catch (error) {
    console.error('ERROR actualizar cita:', error);
    return res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

module.exports = router;