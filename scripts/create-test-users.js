require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const users = [
  {
    dui: '00000001-1',
    nombres: 'Admin',
    apellidos: 'Prueba',
    fecha_nacimiento: '1990-01-01',
    telefono: '70000001',
    email: 'admin@test.com',
    password: 'Admin123!',
    rol: 'admin'
  },
  {
    dui: '00000002-2',
    nombres: 'Doctor',
    apellidos: 'Prueba',
    fecha_nacimiento: '1985-02-02',
    telefono: '70000002',
    email: 'doctor@test.com',
    password: 'Doctor123!',
    rol: 'doctor'
  },
  {
    dui: '00000003-3',
    nombres: 'Paciente',
    apellidos: 'Prueba',
    fecha_nacimiento: '2000-03-03',
    telefono: '70000003',
    email: 'paciente@test.com',
    password: 'Paciente123!',
    rol: 'paciente'
  }
];

async function createUser(user) {
  const existing = await pool.query(
    'SELECT id FROM usuarios WHERE email = $1',
    [user.email.trim().toLowerCase()]
  );

  if (existing.rows.length > 0) {
    console.log(`Usuario ya existe: ${user.email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(user.password, 10);

  await pool.query(
    `INSERT INTO usuarios (
      dui, nombres, apellidos, fecha_nacimiento, telefono, email, password, rol
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      user.dui,
      user.nombres,
      user.apellidos,
      user.fecha_nacimiento,
      user.telefono,
      user.email.trim().toLowerCase(),
      hashedPassword,
      user.rol
    ]
  );

  console.log(`Usuario creado: ${user.email} (${user.rol})`);
}

async function main() {
  try {
    for (const user of users) {
      await createUser(user);
    }
    console.log('Usuarios de prueba creados correctamente.');
  } catch (error) {
    console.error('Error al crear usuarios:', error);
  } finally {
    await pool.end();
  }
}

main();