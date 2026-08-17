const express = require('express');
const pool = require('../backend/database');
const { verificarToken, verificarRol } = require('../middleware/auth');
const API_BASE = `${window.location.origin}/api`;

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: 'Respuesta no válida del servidor' };
  }

  if (!response.ok) {
    throw new Error(data.error || 'Error del servidor');
  }

  return data;
}

async function obtenerMiPerfil() {
  const response = await fetch(`${API_BASE}/pacientes/mi-perfil`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('No se pudo cargar el perfil');
  }

  return response.json();
}

async function obtenerMisCitas() {
  return requestJson('/citas/mias');
}

async function obtenerMisExamenes() {
  return requestJson('/examenes/mios');
}

async function obtenerMisSignos() {
  return requestJson('/signos-vitales/mios');
}

const router = express.Router();

//Obtener perfil del paciente() {
router.get('/mi-perfil', async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [usuarioId]);
    res.json(result.rows[0]);
  } catch (error) {    res.status(500).json({ error: 'Error al cargar perfil' });  }});//Buscar paciente por DUIrouter.get('/buscar/:dui', verificarToken, async (req, res) => {  try {    const result = await pool.query(      'SELECT id, dui, nombres, apellidos, telefono, email FROM usuarios WHERE dui = $1',      [req.params.dui]    );        if (result.rows.length === 0) {      return res.status(404).json({ error: 'Paciente no encontrado' });    }    res.json(result.rows[0]);  } catch (error) {    res.status(500).json({ error: 'Error al buscar paciente' });  }});//Obtener historial clinico del pacienterouter.get('/mi-historial', verificarToken, async (req, res) => {  try {    const result = await pool.query(      'SELECT * FROM historial_clinico WHERE paciente_id = $1 ORDER BY created_at DESC',      [req.usuario.id]    );    res.json(result.rows);  } catch (error) {    res.status(500).json({ error: 'Error al obtener historial' });  }});//Registrar historial clinicorouter.post('/registrar-historial', verificarToken, verificarRol(['doctor', 'admin']), async (req, res) => {  const { dui, enfermedad, fecha_inicio, intensidad, factores_alivio, factores_empeoran } = req.body;    try {    const paciente = await pool.query('SELECT id FROM usuarios WHERE dui = $1', [dui]);    if (paciente.rows.length === 0) {      return res.status(404).json({ error: 'Paciente no encontrado' });    }        const result = await pool.query(      `INSERT INTO historial_clinico (paciente_id, enfermedad, fecha_inicio, intensidad, factores_alivio, factores_empeoran)       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,      [paciente.rows[0].id, enfermedad, fecha_inicio, intensidad, factores_alivio, factores_empeoran]    );        res.status(201).json(result.rows[0]);  } catch (error) {    console.error(error);    res.status(500).json({ error: 'Error al registrar historial' });  }});//Obtener contacto de emergenciarouter.get('/mi-contacto-emergencia', verificarToken, async (req, res) => {  try {    const result = await pool.query(      'SELECT * FROM contactos_emergencia WHERE paciente_id = $1',      [req.usuario.id]    );    res.json(result.rows[0] || null);  } catch (error) {    res.status(500).json({ error: 'Error al obtener contacto' });  }});// CONTACTOS DE EMERGENCIA - CRUD// Obtener todos los contactos del pacienterouter.get('/mis-contactos-emergencia', verificarToken, async (req, res) => {    try {        const result = await pool.query(            'SELECT * FROM contactos_emergencia WHERE paciente_id = $1 ORDER BY id',            [req.usuario.id]        );        res.json(result.rows);    } catch (error) {        console.error('Error al obtener contactos:', error);        res.status(500).json({ error: 'Error al obtener contactos' });    }});//Obtener un contacto especificorouter.get('/contacto-emergencia/:id', verificarToken, async (req, res) => {    try {        const result = await pool.query(            'SELECT * FROM contactos_emergencia WHERE id = $1 AND paciente_id = $2',            [req.params.id, req.usuario.id]        );                if (result.rows.length === 0) {            return res.status(404).json({ error: 'Contacto no encontrado' });        }        res.json(result.rows[0]);    } catch (error) {        console.error('Error al obtener contacto:', error);        res.status(500).json({ error: 'Error al obtener contacto' });    }});//Crear nuevo contactorouter.post('/contacto-emergencia', verificarToken, async (req, res) => {    const { nombre, telefono, relacion } = req.body;        if (!nombre || !telefono || !relacion) {        return res.status(400).json({ error: 'Todos los campos son requeridos' });    }        try {        const result = await pool.query(            `INSERT INTO contactos_emergencia (paciente_id, nombre, telefono, relacion)             VALUES ($1, $2, $3, $4)             RETURNING *`,            [req.usuario.id, nombre, telefono, relacion]        );        res.status(201).json(result.rows[0]);    } catch (error) {        console.error('Error al crear contacto:', error);        res.status(500).json({ error: 'Error al crear contacto' });    }});//Actualizar contactorouter.put('/contacto-emergencia/:id', verificarToken, async (req, res) => {    const { nombre, telefono, relacion } = req.body;    const contactoId = req.params.id;        try {        const result = await pool.query(            `UPDATE contactos_emergencia              SET nombre = $1, telefono = $2, relacion = $3             WHERE id = $4 AND paciente_id = $5             RETURNING *`,            [nombre, telefono, relacion, contactoId, req.usuario.id]        );                if (result.rows.length === 0) {            return res.status(404).json({ error: 'Contacto no encontrado' });        }        res.json(result.rows[0]);    } catch (error) {        console.error('Error al actualizar contacto:', error);        res.status(500).json({ error: 'Error al actualizar contacto' });    }});//Eliminar contactorouter.delete('/contacto-emergencia/:id', verificarToken, async (req, res) => {    const contactoId = req.params.id;        try {        const result = await pool.query(            'DELETE FROM contactos_emergencia WHERE id = $1 AND paciente_id = $2 RETURNING *',            [contactoId, req.usuario.id]        );                if (result.rows.length === 0) {            return res.status(404).json({ error: 'Contacto no encontrado' });        }        res.json({ message: 'Contacto eliminado' });    } catch (error) {        console.error('Error al eliminar contacto:', error);        res.status(500).json({ error: 'Error al eliminar contacto' });    }});module.exports = router;