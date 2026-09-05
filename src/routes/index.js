const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const assinaturaRoutes = require('./assinaturaRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const fornecedorRoutes = require('./fornecedorRoutes');
const produtoRoutes = require('./produtoRoutes');
const movimentacaoRoutes = require('./movimentacaoRoutes');
const historicoRoutes = require('./historicoRoutes');

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/assinaturas', assinaturaRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/fornecedores', fornecedorRoutes);
router.use('/produtos', produtoRoutes);
router.use('/movimentacoes', movimentacaoRoutes);
router.use('/historico', historicoRoutes);

module.exports = router;
