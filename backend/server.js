require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
app.use('/prueba', express.static(uploadsPath));

const authRoutes = require('../routes/authAccess');
const pacienteRoutes = require('../routes/pacientes');
const citaRoutes = require('../routes/citas');
const examenRoutes = require('../routes/examenes');
const signosVitalesRoutes = require('../routes/signosVitales');
const adminRoutes = require('../routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/examenes', examenRoutes);
app.use('/api/signos-vitales', signosVitalesRoutes);
app.use('/api/admin', adminRoutes);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});


