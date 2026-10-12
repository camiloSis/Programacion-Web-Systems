const express = require('express');
const logger = require('./middlewares/logger');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const cursoRoutes = require('./routes/cursoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(logger);
app.use(express.static('public'));

app.use('/api/cursos', cursoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api/cursos`);
  console.log(`Frontend disponible en http://localhost:${PORT}/`);
});

module.exports = app;