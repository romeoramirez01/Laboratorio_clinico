
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'laboratorio-secret-dev';

//Verificacion del token
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(403).json({ error: 'No se proporcionó token' });
  }
  
  try {
    const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

//Verificacion de rol
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
};

module.exports = { verificarToken, verificarRol, JWT_SECRET };