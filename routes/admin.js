const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../backend/database');

// Registrar paciente
router.post('/registrar-paciente', async (req, res) => {
  try {
    const { dui, nombres, apellidos, fecha_nacimiento, telefono, email, password } = req.body;

    if (!dui || !nombres || !apellidos || !fecha_nacimiento || !telefono || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos del paciente' });
    }

    const emailNormalizado = String(email).trim().toLowerCase();
    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [emailNormalizado]);

    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'El paciente ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (dui, nombres, apellidos, fecha_nacimiento, telefono, email, password, rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'paciente')
       RETURNING *`,
      [dui, nombres, apellidos, fecha_nacimiento, telefono, emailNormalizado, passwordHash]
    );

    return res.status(201).json({
      message: 'Paciente registrado correctamente',
      paciente: result.rows[0]
    });
  } catch (error) {
    console.error('ERROR registrar-paciente:', error);
    return res.status(500).json({ error: 'Error al registrar paciente' });
  }
});

// Obtener todos los pacientes
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
    console.error('ERROR listar pacientes:', error);
    return res.status(500).json({ error: 'Error al cargar pacientes' });
  }
});

// Obtener todos los doctores
router.get('/doctores', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM usuarios
      WHERE rol = 'doctor'
      ORDER BY id DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR listar doctores:', error);
    return res.status(500).json({ error: 'Error al cargar doctores' });
  }
});

// Obtener todos los exámenes
router.get('/examenes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM catalogo_examenes
      ORDER BY id DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('ERROR listar exámenes:', error);
    return res.status(500).json({ error: 'Error al cargar exámenes' });
  }
});

// Registrar examen
router.post('/registrar-examen', async (req, res) => {
  try {
    const { nombre, precio, tiempo_entrega } = req.body;

    if (!nombre || !precio || !tiempo_entrega) {
      return res.status(400).json({ error: 'Faltan datos del examen' });
    }

    const result = await pool.query(
      `INSERT INTO catalogo_examenes (nombre, precio, tiempo_entrega)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nombre, precio, tiempo_entrega]
    );

    return res.status(201).json({
      message: 'Examen registrado correctamente',
      examen: result.rows[0]
    });
  } catch (error) {
    console.error('ERROR registrar-examen:', error);
    return res.status(500).json({ error: 'Error al registrar examen' });
  }
});

// Reportes
router.get('/reportes', async (req, res) => {
  try {
    const [pacientes, citas, examenes, doctores] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM usuarios WHERE rol = 'paciente'`),
      pool.query(`SELECT COUNT(*)::int AS total FROM citas`),
      pool.query(`SELECT COUNT(*)::int AS total FROM catalogo_examenes`),
      pool.query(`SELECT COUNT(*)::int AS total FROM usuarios WHERE rol = 'doctor'`)
    ]);

    return res.json({
      pacientes: pacientes.rows[0].total,
      citas: citas.rows[0].total,
      examenes: examenes.rows[0].total,
      doctores: doctores.rows[0].total
    });
  } catch (error) {
    console.error('ERROR reportes:', error);
    return res.status(500).json({ error: 'Error al cargar reportes' });
  }
});

module.exports = router;