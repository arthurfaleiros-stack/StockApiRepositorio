const AppError = require('../utils/appError');

// Middleware global de captura e padronização de erros
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Ocorreu um erro interno no servidor.';
  let details = err.details || null;

  // Erros do Multer (Upload)
  if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'O arquivo enviado ultrapassa o tamanho máximo permitido.';
    } else {
      message = `Erro no upload de arquivo: ${err.message}`;
    }
  }

  // Erros de sintaxe de JSON no Body da requisição
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Formato JSON inválido no corpo da requisição.';
  }

  // Erros específicos de constraints do MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Já existe um registro com os mesmos dados únicos (ex: e-mail, código SKU ou CNPJ).';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 422;
    code = 'FOREIGN_KEY_VIOLATION';
    message = 'O registro referenciado (ex: categoria_id, fornecedor_id, usuario_id) não existe.';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    code = 'RESTRICTED_RELATION';
    message = 'Não é possível excluir este registro pois existem outros registros vinculados a ele.';
  }

  // Se não for erro operacional conhecido e for 500, logar no console
  if (statusCode === 500 && process.env.NODE_ENV !== 'test') {
    console.error(' [Unhandled Error]:', err);
  }

  const responseBody = {
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  };

  return res.status(statusCode).json(responseBody);
}

module.exports = errorHandler;
