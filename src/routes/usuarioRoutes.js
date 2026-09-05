const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verifyJWT = require('../middlewares/verifyJWT');
const verifyRole = require('../middlewares/verifyRole');
const { validateBody } = require('../middlewares/validate');

router.use(verifyJWT);

router.get('/', verifyRole('ADMIN'), usuarioController.list);
router.post('/', verifyRole('ADMIN'), validateBody(['nome', 'email', 'senha', 'perfil']), usuarioController.create);
router.get('/:id', usuarioController.getById);
router.put('/:id', usuarioController.update);
router.patch('/:id/perfil', verifyRole('ADMIN'), validateBody(['perfil']), usuarioController.updatePerfil);
router.delete('/:id', verifyRole('ADMIN'), usuarioController.delete);

module.exports = router;
