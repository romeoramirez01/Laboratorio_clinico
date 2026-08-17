const express = require('express');
const pool = require('../backend/database');
const { verificarToken, verificarRol } = require('../middleware/auth');

const router = express.Router();

// Perfil del paciente
router.get('/mi-perfil', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(400).json({ error: 'Falta el id del usuario' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('ERROR mi-perfil:', error);
    return res.status(500).json({ error: 'Error al cargar perfil' });
  }
});

// Buscar paciente por DUI
router.get('/buscar/:dui', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, dui, nombres, apellidos, telefono, email FROM usuarios WHERE dui = $1',
      [req.params.dui]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('ERROR buscar paciente:', error);
    return res.status(500).json({ error: 'Error al buscar paciente' });
  }
});

// Obtener historial clínico del paciente
router.get('/mi-historial', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM historial_clinico WHERE paciente_id = $1 ORDER BY created_at DESC',
      [req.usuario.id]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR historial paciente:', error);
    return res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Registrar historial clínico
router.post('/registrar-historial', verificarToken, verificarRol(['doctor', 'admin']), async (req, res) => {
  try {
    const {
      dui,
      enfermedad,
      fecha_inicio,
      intensidad,
      factores_alivio,
      factores_empeoran
    } = req.body;

    if (!dui || !enfermedad || !fecha_inicio || !intensidad) {
      return res.status(400).json({ error: 'Faltan datos del historial clínico' });
    }

    const paciente = await pool.query(
      'SELECT id FROM usuarios WHERE dui = $1',
      [dui]
    );

    if (paciente.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const result = await pool.query(
      `INSERT INTO historial_clinico (
        paciente_id, enfermedad, fecha_inicio, intensidad, factores_alivio, factores_empeoran
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        paciente.rows[0].id,
        enfermedad,
        fecha_inicio,
        intensidad,
        factores_alivio,
        factores_empeoran
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('ERROR registrar historial:', error);
    return res.status(500).json({ error: 'Error al registrar historial' });
  }
});

// Obtener contacto de emergencia
router.get('/mi-contacto-emergencia', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contactos_emergencia WHERE paciente_id = $1',
      [req.usuario.id]
    );

    return res.json(result.rows[0] || null);
  } catch (error) {
    console.error('ERROR contacto emergencia:', error);
    return res.status(500).json({ error: 'Error al obtener contacto' });
  }
});

// Obtener todos los contactos de emergencia del paciente
router.get('/mis-contactos-emergencia', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contactos_emergencia WHERE paciente_id = $1 ORDER BY id',
      [req.usuario.id]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR obtener contactos:', error);
    return res.status(500).json({ error: 'Error al obtener contactos' });
  }
});

// Obtener un contacto específico
router.get('/contacto-emergencia/:id', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contactos_emergencia WHERE id = $1 AND paciente_id = $2',
      [req.params.id, req.usuario.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('ERROR obtener contacto:', error);
    return res.status(500).json({ error: 'Error al obtener contacto' });
  }
});

// Crear nuevo contacto
router.post('/contacto-emergencia', verificarToken, async (req, res) => {
  try {
    const { nombre, telefono, relacion } = req.body;

    if (!nombre || !telefono || !relacion) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const result = await pool.query(
      `INSERT INTO contactos_emergencia (paciente_id, nombre, telefono, relacion)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.usuario.id, nombre, telefono, relacion]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('ERROR crear contacto:', error);
    return res.status(500).json({ error: 'Error al crear contacto' });
  }
});

// Actualizar contacto
router.put('/contacto-emergencia/:id', verificarToken, async (req, res) => {
  try {
    const { nombre, telefono, relacion } = req.body;
    const contactoId = req.params.id;

    const result = await pool.query(
      `UPDATE contactos_emergencia
       SET nombre = $1, telefono = $2, relacion = $3
       WHERE id = $4 AND paciente_id = $5
       RETURNING *`,
      [nombre, telefono, relacion, contactoId, req.usuario.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('ERROR actualizar contacto:', error);
    return res.status(500).json({ error: 'Error al actualizar contacto' });
  }
});

// Eliminar contacto
router.delete('/contacto-emergencia/:id', verificarToken, async (req, res) => {
  try {
    const contactoId = req.params.id;

    const result = await pool.query(
      'DELETE FROM contactos_emergencia WHERE id = $1 AND paciente_id = $2 RETURNING *',
      [contactoId, req.usuario.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }

    return res.json({ message: 'Contacto eliminado' });
  } catch (error) {
    console.error('ERROR eliminar contacto:', error);
    return res.status(500).json({ error: 'Error al eliminar contacto' });
  }
});

module.exports = router;