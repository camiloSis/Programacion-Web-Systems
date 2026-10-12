function notFoundHandler(req, res, next) {
  res.status(404).json({
    status: 'fail',
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
  });
}

function errorHandler(err, req, res, next) {
  console.error('Error no controlado:', err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'fail',
      message: 'JSON mal formado en el cuerpo de la petición'
    });
  }

  const statusCode = err.status || 500;
  const message = statusCode === 500 ? 'Error interno del servidor' : err.message;

  res.status(statusCode).json({
    status: statusCode === 500 ? 'error' : 'fail',
    message
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};