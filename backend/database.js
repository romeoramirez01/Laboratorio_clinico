const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'laboratorio_clinico',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});



//Crear tablas
const createTables = async () => {
  const queries = [

    // Tabla de usuarios
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Tabla de citas
    `CREATE TABLE IF NOT EXISTS citas (
      id SERIAL PRIMARY KEY,
      paciente_id INTEGER REFERENCES usuarios(id),
      fecha DATE NOT NULL,
      hora TIME NOT NULL,
      motivo TEXT NOT NULL,
      estado VARCHAR(20) DEFAULT 'pendiente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Tabla de catalogo de examenes
    `CREATE TABLE IF NOT EXISTS catalogo_examenes (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      tiempo_entrega VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Tabla de solicitud de examenes
    `CREATE TABLE IF NOT EXISTS solicitud_examenes (
      id SERIAL PRIMARY KEY,
      paciente_id INTEGER REFERENCES usuarios(id),
      examen_id INTEGER REFERENCES catalogo_examenes(id),
      fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado VARCHAR(20) DEFAULT 'pendiente',
      resultado TEXT,
      archivo_pdf VARCHAR(255)
    )`,
    
    // Tabla de signos vitales
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
    
    // Tabla de historial clínico
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
    
    // Tabla de contactos de emergencia
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

createTables();

module.exports = pool;