const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : false
});

const createTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      dui VARCHAR(10) UNIQUE NOT NULL,
      nombres VARCHAR(100) NOT NULL,
      apellidos VARCHAR(100) NOT NULL,
      fecha_nacimiento DATE NOT NULL,
      telefono VARCHAR(15) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      rol VARCHAR(20) DEFAULT 'paciente',
      reset_token VARCHAR(255),
      reset_token_expira TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS citas (
      id SERIAL PRIMARY KEY,
      paciente_id INTEGER REFERENCES usuarios(id),
      fecha DATE NOT NULL,
      hora TIME NOT NULL,
      motivo TEXT NOT NULL,
      estado VARCHAR(20) DEFAULT 'pendiente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS catalogo_examenes (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      tiempo_entrega VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS solicitud_examenes (
      id SERIAL PRIMARY KEY,
      paciente_id INTEGER REFERENCES usuarios(id),
      examen_id INTEGER REFERENCES catalogo_examenes(id),
      fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado VARCHAR(20) DEFAULT 'pendiente',
      resultado TEXT,
      archivo_pdf VARCHAR(255)
    )`,
    `CREATE TABLE IF NOT EXISTS signos_vitales (
      id SERIAL PRIMARY KEY,
      paciente_id INTEGER REFERENCES usuarios(id),
      presion_arterial VARCHAR(20),
      frecuencia_cardiaca INTEGER,
      temperatura DECIMAL(4,1),
      peso DECIMAL(5,2),
      altura DECIMAL(5,2),
      observaciones TEXT,
      fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS historial_clinico (
      id SERIAL PRIMARY KEY,
      paciente_id INTEGER REFERENCES usuarios(id),
      enfermedad VARCHAR(100),
      fecha_inicio DATE,
      intensidad VARCHAR(20),
      factores_alivio TEXT,
      factores_empeoran TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contactos_emergencia (
      id SERIAL PRIMARY KEY,
      paciente_id INTEGER REFERENCES usuarios(id),
      nombre VARCHAR(100),
      telefono VARCHAR(15),
      relacion VARCHAR(50)
    )`
  ];

  for (const query of queries) {
    try {
      await pool.query(query);
      console.log('Tabla creada/verificada correctamente');
    } catch (error) {
      console.error('Error creando tabla:', error);
    }
  }
};

createTables().catch((err) => {
  console.error('Error inicializando base de datos:', err);
});

module.exports = pool;