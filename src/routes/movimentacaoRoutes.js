const express = require('express');
const router = express.Router();
const movimentacaoController = require('../controllers/movimentacaoController');
const verifyJWT = require('../middlewares/verifyJWT');
const { validateBody } = require('../middlewares/validate');

router.use(verifyJWT);

router.get('/', movimentacaoController.list);
router.get('/:id', movimentacaoController.getById);
router.post(
  '/',
  validateBody(['produto_id', 'tipo', 'quantidade']),
  movimentacaoController.create
);

module.exports = router;
