const API_BASE = '/api/cursos';

let editandoId = null;

async function cargarCursos() {
  const filtro = document.getElementById('filtroCreditos').value;
  const url = filtro ? `${API_BASE}?creditos=${filtro}` : API_BASE;

  try {
    const response = await fetch(url);
    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.message || 'Error al cargar cursos');
    }

    renderizarTabla(resultado.data);
  } catch (error) {
    mostrarMensaje('formMessage', `Error al cargar cursos: ${error.message}`, true);
  }
}

function renderizarTabla(cursos) {
  const tbody = document.getElementById('cursosBody');
  const emptyMessage = document.getElementById('emptyMessage');

  tbody.innerHTML = '';

  if (cursos.length === 0) {
    emptyMessage.style.display = 'block';
    return;
  }

  emptyMessage.style.display = 'none';

  cursos.forEach(curso => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${curso.id}</td>
      <td>${escapeHtml(curso.nombre)}</td>
      <td>${escapeHtml(curso.codigo)}</td>
      <td><span class="creditos-badge">${curso.creditos}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit" onclick="editarCurso(${curso.id})">Editar</button>
          <button class="btn-action btn-delete" onclick="eliminarCurso(${curso.id})">Eliminar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function guardarCurso(event) {
  event.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const codigo = document.getElementById('codigo').value.trim();
  const creditos = parseInt(document.getElementById('creditos').value, 10);

  const datos = { nombre, codigo, creditos };
  const url = editandoId ? `${API_BASE}/${editandoId}` : API_BASE;
  const method = editandoId ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.message || 'Error al guardar');
    }

    mostrarMensaje('formMessage', editandoId ? 'Curso actualizado correctamente' : 'Curso creado correctamente', false);
    resetForm();
    cargarCursos();
  } catch (error) {
    mostrarMensaje('formMessage', `Error: ${error.message}`, true);
  }
}

async function editarCurso(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.message || 'Curso no encontrado');
    }

    const curso = resultado.data;
    document.getElementById('cursoId').value = curso.id;
    document.getElementById('nombre').value = curso.nombre;
    document.getElementById('codigo').value = curso.codigo;
    document.getElementById('creditos').value = curso.creditos;

    editandoId = curso.id;
    document.getElementById('formTitle').textContent = 'Editar Curso';
    document.getElementById('btnSubmit').textContent = 'Actualizar Curso';
    document.getElementById('btnCancel').style.display = 'inline-flex';
    document.getElementById('nombre').focus();
  } catch (error) {
    mostrarMensaje('formMessage', `Error al cargar curso: ${error.message}`, true);
  }
}

async function eliminarCurso(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este curso?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.message || 'Error al eliminar');
    }

    mostrarMensaje('formMessage', resultado.message || 'Curso eliminado correctamente', false);
    cargarCursos();
  } catch (error) {
    mostrarMensaje('formMessage', `Error: ${error.message}`, true);
  }
}

function resetForm() {
  document.getElementById('cursoForm').reset();
  document.getElementById('cursoId').value = '';
  editandoId = null;
  document.getElementById('formTitle').textContent = 'Crear Nuevo Curso';
  document.getElementById('btnSubmit').textContent = 'Crear Curso';
  document.getElementById('btnCancel').style.display = 'none';
  document.getElementById('formMessage').style.display = 'none';
}

function mostrarMensaje(elementId, texto, esError) {
  const el = document.getElementById(elementId);
  el.textContent = texto;
  el.className = 'message ' + (esError ? 'error' : 'success');
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', cargarCursos);