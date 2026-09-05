const usuarioService = require('../services/usuarioService');

class UsuarioController {
  async list(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const result = await usuarioService.listUsers({ page, limit, search });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await usuarioService.getUserById(req.params.id);
      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { nome, email, senha, perfil } = req.body;
      const user = await usuarioService.createUser({ nome, email, senha, perfil });
      return res.status(201).json({
        message: 'Usuário criado com sucesso.',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { nome, email } = req.body;
      const user = await usuarioService.updateUser(req.params.id, { nome, email });
      return res.status(200).json({
        message: 'Usuário atualizado com sucesso.',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePerfil(req, res, next) {
    try {
      const { perfil } = req.body;
      const user = await usuarioService.updateUserPerfil(req.params.id, perfil);
      return res.status(200).json({
        message: 'Perfil de usuário atualizado com sucesso.',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await usuarioService.deleteUser(req.params.id, req.user.id);
      return res.status(200).json({
        message: 'Usuário excluído com sucesso.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsuarioController();
