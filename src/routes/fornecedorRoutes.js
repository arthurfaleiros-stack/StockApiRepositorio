const express = require('express');
const router = express.Router();
const fornecedorController = require('../controllers/fornecedorController');
const verifyJWT = require('../middlewares/verifyJWT');
const verifyRole = require('../middlewares/verifyRole');
const { validateBody } = require('../middlewares/validate');

router.use(verifyJWT);

router.get('/', fornecedorController.list);
router.get('/:id', fornecedorController.getById);
router.post('/', verifyRole('ADMIN', 'GERENTE'), validateBody(['nome', 'cnpj']), fornecedorController.create);
router.put('/:id', verifyRole('ADMIN', 'GERENTE'), fornecedorController.update);
router.delete('/:id', verifyRole('ADMIN'), fornecedorController.delete);

module.exports = router;
