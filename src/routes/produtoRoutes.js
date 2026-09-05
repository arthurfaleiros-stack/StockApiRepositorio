const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const verifyJWT = require('../middlewares/verifyJWT');
const verifyRole = require('../middlewares/verifyRole');
const upload = require('../middlewares/upload');
const { validateBody } = require('../middlewares/validate');

router.use(verifyJWT);

router.get('/', produtoController.list);
router.get('/alerta-estoque', produtoController.alertas);
router.get('/:id', produtoController.getById);
router.post(
  '/',
  verifyRole('ADMIN', 'GERENTE'),
  validateBody(['categoria_id', 'fornecedor_id', 'nome', 'codigo']),
  produtoController.create
);
router.put('/:id', verifyRole('ADMIN', 'GERENTE'), produtoController.update);
router.post('/:id/foto', verifyRole('ADMIN', 'GERENTE'), upload.single('foto'), produtoController.uploadFoto);
router.delete('/:id', verifyRole('ADMIN'), produtoController.delete);

module.exports = router;
