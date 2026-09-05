const express = require('express');
const router = express.Router();
const assinaturaController = require('../controllers/assinaturaController');
const verifyJWT = require('../middlewares/verifyJWT');
const verifyRole = require('../middlewares/verifyRole');
const { validateBody } = require('../middlewares/validate');

router.use(verifyJWT);

router.get('/minha', assinaturaController.minha);
router.get('/', verifyRole('ADMIN'), assinaturaController.list);
router.get('/:id', verifyRole('ADMIN'), assinaturaController.getById);
router.post('/', verifyRole('ADMIN'), validateBody(['usuario_id', 'plano', 'data_inicio']), assinaturaController.create);
router.patch('/:id/status', verifyRole('ADMIN'), validateBody(['status']), assinaturaController.updateStatus);

module.exports = router;
