const cursos = require('../data/cursos');

function getCursos(req, res) {
  const { creditos } = req.query;

  if (creditos !== undefined) {
    const creditosNum = Number(creditos);
    if (isNaN(creditosNum) || !Number.isInteger(creditosNum) || creditosNum <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'El parámetro creditos debe ser un número entero positivo'
      });
    }
    const filtrados = cursos.filter(c => c.creditos === creditosNum);
    return res.status(200).json({
      status: 'success',
      data: filtrados
    });
  }

  res.status(200).json({
    status: 'success',
    data: cursos
  });
}

function getCursoPorId(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({
      status: 'fail',
      message: 'El ID debe ser un número válido'
    });
  }
  const curso = cursos.find(c => c.id === id);
  if (!curso) {
    return res.status(404).json({
      status: 'fail',
      message: 'Curso no encontrado'
    });
  }
  res.status(200).json({
    status: 'success',
    data: curso
  });
}

function validarCurso(body, excludeId = null) {
  const { nombre, codigo, creditos } = body;
  if (!nombre || !codigo || creditos === undefined || creditos === null) {
    return 'Los campos nombre, codigo y creditos son obligatorios';
  }
  if (typeof creditos !== 'number' || !Number.isInteger(creditos) || creditos <= 0) {
    return 'Los créditos deben ser un número entero positivo';
  }
  if (typeof nombre !== 'string' || nombre.trim() === '') {
    return 'El nombre debe ser una cadena no vacía';
  }
  if (typeof codigo !== 'string' || codigo.trim() === '') {
    return 'El código debe ser una cadena no vacía';
  }
  const existeCodigo = cursos.some(c => c.codigo === codigo.trim() && c.id !== excludeId);
  if (existeCodigo) {
    return 'El código del curso ya existe';
  }
  return null;
}

function crearCurso(req, res) {
  const errorValidacion = validarCurso(req.body);
  if (errorValidacion) {
    const statusCode = errorValidacion === 'El código del curso ya existe' ? 409 : 400;
    return res.status(statusCode).json({
      status: 'fail',
      message: errorValidacion
    });
  }

  const maxId = cursos.length > 0 ? Math.max(...cursos.map(c => c.id)) : 0;
  const nuevoCurso = {
    id: maxId + 1,
    nombre: req.body.nombre.trim(),
    codigo: req.body.codigo.trim(),
    creditos: req.body.creditos
  };
  cursos.push(nuevoCurso);
  res.status(201).json({
    status: 'success',
    data: nuevoCurso
  });
}

function actualizarCurso(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({
      status: 'fail',
      message: 'El ID debe ser un número válido'
    });
  }
  const index = cursos.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({
      status: 'fail',
      message: 'Curso no encontrado'
    });
  }

  const errorValidacion = validarCurso(req.body, id);
  if (errorValidacion) {
    const statusCode = errorValidacion === 'El código del curso ya existe' ? 409 : 400;
    return res.status(statusCode).json({
      status: 'fail',
      message: errorValidacion
    });
  }

  const cursoActualizado = {
    id,
    nombre: req.body.nombre.trim(),
    codigo: req.body.codigo.trim(),
    creditos: req.body.creditos
  };
  cursos[index] = cursoActualizado;
  res.status(200).json({
    status: 'success',
    data: cursoActualizado
  });
}

function eliminarCurso(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({
      status: 'fail',
      message: 'El ID debe ser un número válido'
    });
  }
  const index = cursos.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({
      status: 'fail',
      message: 'Curso no encontrado'
    });
  }
  const cursoEliminado = cursos.splice(index, 1)[0];
  res.status(200).json({
    status: 'success',
    message: `Curso '${cursoEliminado.nombre}' (código: ${cursoEliminado.codigo}) eliminado correctamente`
  });
}

module.exports = {
  getCursos,
  getCursoPorId,
  crearCurso,
  actualizarCurso,
  eliminarCurso
};