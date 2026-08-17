const express = require('express');
const router = express.Router();
const pool = require('../backend/database');

router.get('/mi-perfil', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: 'Falta id del paciente' });
    }

    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('ERROR mi-perfil:', error);
    return res.status(500).json({ error: 'Error al cargar perfil' });
  }
});

router.get('/mis-citas', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: 'Falta id del paciente' });
    }

    const result = await pool.query('SELECT * FROM citas WHERE paciente_id = $1 ORDER BY fecha DESC, hora DESC', [id]);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR mis-citas:', error);
    return res.status(500).json({ error: 'Error al cargar citas' });
  }
});

router.get('/mis-examenes', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: 'Falta id del paciente' });
    }

    const result = await pool.query(
      `SELECT se.*, ce.nombre, ce.precio, ce.tiempo_entrega
       FROM solicitud_examenes se
       LEFT JOIN catalogo_examenes ce ON ce.id = se.examen_id
       WHERE se.paciente_id = $1
       ORDER BY se.fecha_solicitud DESC`,
      [id]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR mis-examenes:', error);
    return res.status(500).json({ error: 'Error al cargar exámenes' });
  }
});

module.exports = router;

const API_URL = `${window.location.origin}/api`;
fetch(`${API_URL}/paciente/mis-citas?id=1`)