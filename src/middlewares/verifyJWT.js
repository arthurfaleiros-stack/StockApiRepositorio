const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError('Token de autenticação não fornecido.', 401, 'UNAUTHORIZED'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new AppError('Token mal formatado. Padrão: Bearer <token>', 401, 'MALFORMATTED_TOKEN'));
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET || 'kstock_secret_key_default';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Token de autenticação expirado.', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Token de autenticação inválido.', 401, 'INVALID_TOKEN'));
    }

    req.user = {
      id: decoded.id,
      nome: decoded.nome,
      email: decoded.email,
      perfil: decoded.perfil ? decoded.perfil.toUpperCase() : 'OPERADOR'
    };

    return next();
  });
}

module.exports = verifyJWT;
