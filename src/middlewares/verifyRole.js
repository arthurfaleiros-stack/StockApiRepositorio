const AppError = require('../utils/appError');

function verifyRole(...allowedRoles) {
  const normalizedRoles = allowedRoles.map(r => r.toUpperCase());

  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Usuário não autenticado.', 401, 'UNAUTHORIZED'));
    }

    const userRole = (req.user.perfil || '').toUpperCase();

    if (!normalizedRoles.includes(userRole)) {
      return next(
        new AppError(
          `Acesso não autorizado para o perfil: ${userRole}. Perfis permitidos: ${normalizedRoles.join(', ')}.`,
          403,
          'FORBIDDEN'
        )
      );
    }

    return next();
  };
}

module.exports = verifyRole;
