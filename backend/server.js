require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
//require('dotenv').config();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});


//Middleware
app.use(cors());
app.use(express.json());
//Ruta absoluta para el logo en el PDF
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/prueba', express.static(uploadsPath));
console.log('SIRVIENDO ARCHIVOS ESTÁTICOS DESDE:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));
app.use(express.urlencoded({ extended: true }));


//Importar rutas
const authRoutes = require('../routes/authAccess');
const pacienteRoutes = require('../routes/pacientes');
const citaRoutes = require('../routes/citas');
const examenRoutes = require('../routes/examenes');
const signosVitalesRoutes = require('../routes/signosVitales');
const adminRoutes = require('../routes/admin');


//Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/examenes', examenRoutes);
app.use('/api/signos-vitales', signosVitalesRoutes);
app.use('/api/admin', adminRoutes);


//Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

//Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
//Ruta del servidor
app.listen(PORT, () => {
    console.log('Servidor corriendo en http://localhost:' + PORT);
});