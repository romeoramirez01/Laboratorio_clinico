const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../backend/database');

const JWT_SECRET = process.env.JWT_SECRET || 'laboratorio-secret-dev';

//Registro de usuario
router.post('/registro', async (req, res) => {
  try {
    const {
      dui,
      nombres,
      apellidos,
      fecha_nacimiento,
      telefono,
      email,
      password,
      rol
    } = req.body;

    if (!dui || !nombres || !apellidos || !fecha_nacimiento || !telefono || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [emailNormalizado]
    );

    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO usuarios (
        dui, nombres, apellidos, fecha_nacimiento, telefono, email, password, rol
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        dui,
        nombres,
        apellidos,
        fecha_nacimiento,
        telefono,
        emailNormalizado,
        passwordHash,
        rol || 'paciente'
      ]
    );

    return res.status(201).json({ message: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('ERROR REGISTRO:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

//Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const emailNormalizado = String(email).trim().toLowerCase();

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [emailNormalizado]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];
    const coincide = await bcrypt.compare(password, usuario.password);

    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('ERROR LOGIN:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

//Recuperar contraseña
router.post('/recuperar-password', async (req, res) => {
  try {
    const { email } = req.body;
    const emailNormalizado = String(email).trim().toLowerCase();

    const result = await pool.query(
      'SELECT id, nombres, email FROM usuarios WHERE email = $1',
      [emailNormalizado]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Correo no registrado' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await pool.query(
      'UPDATE usuarios SET reset_token = $1, reset_token_expira = $2 WHERE id = $3',
      [token, expires, result.rows[0].id]
    );

    return res.json({
      message: 'Se ha enviado un correo de recuperación'
    });
  } catch (error) {
    console.error('ERROR RECUPERAR:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE reset_token = $1 AND reset_token_expira > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE usuarios SET password = $1, reset_token = NULL, reset_token_expira = NULL WHERE id = $2',
      [passwordHash, result.rows[0].id]
    );

    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('ERROR RESET:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;