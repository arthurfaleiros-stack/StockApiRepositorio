const express = require('express');
const router = express.Router();
const historicoController = require('../controllers/historicoController');
const verifyJWT = require('../middlewares/verifyJWT');
const verifyRole = require('../middlewares/verifyRole');

router.use(verifyJWT);
router.use(verifyRole('ADMIN', 'GERENTE'));

router.get('/', historicoController.list);
router.get('/:id', historicoController.getById);

module.exports = router;
