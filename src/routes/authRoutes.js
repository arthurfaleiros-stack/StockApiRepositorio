const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyJWT = require('../middlewares/verifyJWT');
const { validateBody } = require('../middlewares/validate');

router.post('/register', validateBody(['nome', 'email', 'senha']), authController.register);
router.post('/login', validateBody(['email', 'senha']), authController.login);
router.get('/me', verifyJWT, authController.me);

module.exports = router;
