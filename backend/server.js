require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});


