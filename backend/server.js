require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar pool de base de datos para asegurar inicialización
const pool = require('./database');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('../routes/authAccess');
const adminRoutes = require('../routes/admin');
const doctorRoutes = require('../routes/doctor');
const pacienteRoutes = require('../routes/paciente');
const citaRoutes = require('../routes/citas');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/paciente', pacienteRoutes);
app.use('/api/citas', citaRoutes);

// Servir frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta API no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});


