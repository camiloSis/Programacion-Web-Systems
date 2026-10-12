function logger(req, res, next) {
  const inicio = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    console.log(`${timestamp} | ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duracion} ms`);
  });

  next();
}

module.exports = logger;