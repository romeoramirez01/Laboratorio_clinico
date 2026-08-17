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

router.get('/examenes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM catalogo_examenes
      ORDER BY id DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR doctor examenes:', error);
    return res.status(500).json({ error: 'Error al cargar exámenes' });
  }
});

router.post('/signos-vitales', async (req, res) => {
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
      message: 'Signos vitales guardados',
      signos: result.rows[0]
    });
  } catch (error) {
    console.error('ERROR doctor signos:', error);
    return res.status(500).json({ error: 'Error al guardar signos vitales' });
  }
});

module.exports = router;