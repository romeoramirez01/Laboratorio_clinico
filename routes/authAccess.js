const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const express = require('express');
const router = express.Router();

// Importa el pool de conexión según la ruta donde tengas tu archivo de base de datos
// (Ajusta la ruta '../config/db' o '../db' según el nombre real de tu archivo de conexión)
const pool = require('../config/db');

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

    const hashedPassword = await bcrypt.hash(password, 10);

    await Usuario.create({
      dui,
      nombres,
      apellidos,
      fecha_nacimiento,
      telefono,
      email: String(email).trim().toLowerCase(),
      password: hashedPassword,
      rol
    });

    return res.status(201).json({ message: 'Usuario creado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

//Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();

    const user = await pool.query('SELECT * FROM usuarios WHERE email = $1', [normalizedEmail]);

    console.log('LOGIN ATTEMPT:', { normalizedEmail, password });
    console.log('USER FOUND:', user);

    if (!user.rows.length) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const match = await bcrypt.compare(password, user.rows[0].password);
    console.log('PASSWORD MATCH:', match);

    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, rol: user.rows[0].rol },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      usuario: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        rol: user.rows[0].rol
      }
    });
  } catch (error) {
    console.error('ERROR LOGIN:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

//Recuperar contraseña
router.post('/recuperar-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await pool.query('SELECT id, nombres FROM usuarios WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Email no registrado' });
        }
        // Generar token único y expiración (1 hora)
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hora
        await pool.query(
            'UPDATE usuarios SET reset_token = $1, reset_expires = $2 WHERE email = $3',
            [token, expires, email]
        );
        // Enviar correo
        await enviarCorreoRecuperacion(email, user.rows[0].nombres, token);
        res.json({ message: 'Se han enviado instrucciones a tu correo electrónico' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await pool.query(
            'SELECT id FROM usuarios WHERE reset_token = $1 AND reset_expires > NOW()',
            [token]
        );
        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE usuarios SET password = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2',
            [hashedPassword, user.rows[0].id]
        );
        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al restablecer contraseña' });
    }
});


module.exports = router;