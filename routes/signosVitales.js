const express = require('express');
const router = express.Router();
const pool = require('../backend/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM signos_vitales
      ORDER BY fecha_registro DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR signos vitales:', error);
    return res.status(500).json({ error: 'Error al cargar signos vitales' });
  }
});

router.get('/mios', async (req, res) => {
  try {
    const pacienteId = req.query.id;

    if (!pacienteId) {
      return res.status(400).json({ error: 'Falta id del paciente' });
    }

    const result = await pool.query(`
      SELECT *
      FROM signos_vitales
      WHERE paciente_id = $1
      ORDER BY fecha_registro DESC
    `, [pacienteId]);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR signos del paciente:', error);
    return res.status(500).json({ error: 'Error al cargar signos vitales' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      paciente_id,
      presion_arterial,
      frecuencia_cardiaca,
      temperatura,
      peso,
      altura,
      observaciones
    } = req.body;

    if (!paciente_id) {
      return res.status(400).json({ error: 'Falta paciente_id' });
    }

    const result = await pool.query(
      `INSERT INTO signos_vitales (
        paciente_id, presion_arterial, frecuencia_cardiaca, temperatura, peso, altura, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [paciente_id, presion_arterial, frecuencia_cardiaca, temperatura, peso, altura, observaciones]
    );

    return res.status(201).json({
      message: 'Signos vitales registrados correctamente',
      signos: result.rows[0]
    });
  } catch (error) {
    console.error('ERROR crear signos vitales:', error);
    return res.status(500).json({ error: 'Error al guardar signos vitales' });
  }
});

module.exports = router;