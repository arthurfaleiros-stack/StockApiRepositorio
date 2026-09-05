const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const { nome, email, senha } = req.body;
      const result = await authService.register({ nome, email, senha });
      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso.',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, senha } = req.body;
      const result = await authService.login({ email, senha });
      return res.status(200).json({
        message: 'Login realizado com sucesso.',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);
      return res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
