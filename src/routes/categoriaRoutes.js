const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const verifyJWT = require('../middlewares/verifyJWT');
const verifyRole = require('../middlewares/verifyRole');
const { validateBody } = require('../middlewares/validate');

router.use(verifyJWT);

router.get('/', categoriaController.list);
router.get('/:id', categoriaController.getById);
router.post('/', verifyRole('ADMIN', 'GERENTE'), validateBody(['nome']), categoriaController.create);
router.put('/:id', verifyRole('ADMIN', 'GERENTE'), categoriaController.update);
router.delete('/:id', verifyRole('ADMIN'), categoriaController.delete);

module.exports = router;
